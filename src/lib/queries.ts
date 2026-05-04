import { createClient } from "@/lib/supabase/server";
import type {
  EventRow,
  Participant,
  Person,
  Task,
  Activity,
  Message,
  Note,
  MoodImage,
  Expense,
} from "./types";

export type ParticipantWithPerson = Participant & { person: Person };
export type EventWithParticipants = EventRow & {
  participants: ParticipantWithPerson[];
};
export type EventFull = EventWithParticipants & {
  tasks: Task[];
  activity: Activity[];
  messages: Message[];
  mood_images: MoodImage[];
  expenses: Expense[];
};

function placeholderPerson(id: string): Person {
  return {
    id,
    name: "Unknown person",
    legal_name: null,
    preferred_name: null,
    role: "vendor",
    email: null,
    phone: null,
    instagram: null,
    location: null,
    bio: null,
    specialty: null,
    initials: "?",
    tint: "var(--hair-2)",
    ink: "var(--ink-3)",
    joined_at: null,
  };
}

export async function listEvents(): Promise<EventWithParticipants[]> {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (!events) return [];

  const ids = events.map((e) => e.id);
  if (ids.length === 0) return events.map((e) => ({ ...e, participants: [] }));

  const [{ data: parts }, { data: people }] = await Promise.all([
    supabase.from("participants").select("*").in("event_id", ids).range(0, 9999),
    supabase.from("people").select("*").range(0, 9999),
  ]);

  const peopleById = new Map<string, Person>();
  (people ?? []).forEach((p) => peopleById.set(p.id, p));

  return events.map((e) => {
    const ps = (parts ?? []).filter((pp) => pp.event_id === e.id);
    return {
      ...e,
      participants: ps.map((pp) => ({
        ...pp,
        person: peopleById.get(pp.person_id) ?? placeholderPerson(pp.person_id),
      })),
    };
  });
}

export async function getEvent(id: string): Promise<EventFull | null> {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!event) return null;

  const [
    { data: parts },
    { data: people },
    { data: tasks },
    { data: activity },
    { data: messages },
    { data: moodImages },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("participants").select("*").eq("event_id", id).range(0, 9999),
    supabase.from("people").select("*").range(0, 9999),
    supabase
      .from("tasks")
      .select("*")
      .eq("event_id", id)
      .order("due", { ascending: true, nullsFirst: false }),
    supabase
      .from("activity")
      .select("*")
      .eq("event_id", id)
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("messages")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("mood_images")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("*")
      .eq("event_id", id)
      .order("spent_at", { ascending: false, nullsFirst: false }),
  ]);

  const peopleById = new Map<string, Person>();
  (people ?? []).forEach((p) => peopleById.set(p.id, p));

  return {
    ...event,
    participants: (parts ?? []).map((p) => ({
      ...p,
      person: peopleById.get(p.person_id) ?? placeholderPerson(p.person_id),
    })),
    tasks: tasks ?? [],
    activity: activity ?? [],
    messages: messages ?? [],
    mood_images: moodImages ?? [],
    expenses: (expenses ?? []) as Expense[],
  };
}

export async function listPeople(): Promise<Person[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("people")
    .select("*")
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getPerson(
  id: string,
): Promise<{
  person: Person;
  events: EventWithParticipants[];
  notes: Note[];
} | null> {
  const supabase = createClient();
  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!person) return null;

  const { data: parts } = await supabase
    .from("participants")
    .select("*")
    .eq("person_id", id);
  const eventIds = (parts ?? []).map((p) => p.event_id);
  if (eventIds.length === 0) {
    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("person_id", id)
      .order("created_at", { ascending: false });
    return { person, events: [], notes: notes ?? [] };
  }

  const [{ data: events }, { data: allParts }, { data: people }, { data: notes }] =
    await Promise.all([
      supabase.from("events").select("*").in("id", eventIds),
      supabase
        .from("participants")
        .select("*")
        .in("event_id", eventIds)
        .range(0, 9999),
      supabase.from("people").select("*").range(0, 9999),
      supabase
        .from("notes")
        .select("*")
        .eq("person_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const peopleById = new Map<string, Person>();
  (people ?? []).forEach((p) => peopleById.set(p.id, p));

  const fullEvents: EventWithParticipants[] = (events ?? []).map((e) => {
    const ps = (allParts ?? []).filter((pp) => pp.event_id === e.id);
    return {
      ...e,
      participants: ps.map((pp) => ({
        ...pp,
        person: peopleById.get(pp.person_id) ?? placeholderPerson(pp.person_id),
      })),
    };
  });

  fullEvents.sort((a, b) => a.date.localeCompare(b.date));

  return { person, events: fullEvents, notes: notes ?? [] };
}

export function aggregateFinances(events: EventWithParticipants[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let owed = 0,
    paid = 0,
    overdue = 0;
  events.forEach((e) => {
    if (e.status === "wrapped") {
      paid += e.participants.reduce((s, p) => s + Number(p.paid), 0);
      return;
    }
    e.participants.forEach((p) => {
      paid += Number(p.paid);
      const remaining = Number(p.rate) - Number(p.paid);
      if (remaining > 0) {
        owed += remaining;
        if (
          p.due_date &&
          new Date(p.due_date + "T12:00:00").getTime() < today.getTime()
        ) {
          overdue += remaining;
        }
      }
    });
  });
  return { owed, paid, overdue };
}
