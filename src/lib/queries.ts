import { createClient } from "@/lib/supabase/server";
import type {
  EventRow,
  Participant,
  Person,
  Task,
  Activity,
  Note,
  Expense,
  EventNote,
} from "./types";

export type ParticipantWithPerson = Participant & { person: Person };
export type EventWithParticipants = EventRow & {
  participants: ParticipantWithPerson[];
};
export type EventFull = EventWithParticipants & {
  tasks: Task[];
  activity: Activity[];
  expenses: Expense[];
  event_notes: EventNote[];
};

export type PersonActivityItem = {
  id: string;
  occurredAt: string;
  title: string;
  detail: string | null;
  href: string | null;
  tone: "default" | "accent" | "sage";
};

function placeholderPerson(id: string): Person {
  return {
    id,
    name: "Unknown person",
    first_name: null,
    last_name: null,
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

function attachSubmissionOptIns<T extends Person>(
  people: T[],
  submissions:
    | Array<{
        id: string;
        converted_person_id: string | null;
        future_projects_opt_in: boolean;
      }>
    | null
    | undefined,
): T[] {
  const byPersonId = new Map<
    string,
    { id: string; future_projects_opt_in: boolean }
  >();
  (submissions ?? []).forEach((s) => {
    if (s.converted_person_id) {
      byPersonId.set(s.converted_person_id, {
        id: s.id,
        future_projects_opt_in: s.future_projects_opt_in,
      });
    }
  });

  return people.map((p) => {
    const submission = byPersonId.get(p.id);
    if (!submission) return p;
    return {
      ...p,
      source_submission_id: submission.id,
      future_projects_opt_in: submission.future_projects_opt_in,
    };
  });
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
    supabase
      .from("participants")
      .select("*")
      .in("event_id", ids)
      .range(0, 9999),
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
    { data: expenses },
    { data: eventNotes },
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
      .from("expenses")
      .select("*")
      .eq("event_id", id)
      .order("spent_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("event_notes")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
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
    expenses: (expenses ?? []) as Expense[],
    event_notes: (eventNotes ?? []) as EventNote[],
  };
}

export async function listPeople(): Promise<Person[]> {
  const supabase = createClient();
  const [{ data }, { data: submissions }] = await Promise.all([
    supabase.from("people").select("*").order("name", { ascending: true }),
    supabase
      .from("submissions")
      .select("id, converted_person_id, future_projects_opt_in")
      .not("converted_person_id", "is", null),
  ]);
  return attachSubmissionOptIns(data ?? [], submissions);
}

export async function getPerson(id: string): Promise<{
  person: Person;
  events: EventWithParticipants[];
  notes: Note[];
} | null> {
  const supabase = createClient();
  const [{ data: person }, { data: sourceSubmission }] = await Promise.all([
    supabase.from("people").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("submissions")
      .select("id, converted_person_id, future_projects_opt_in")
      .eq("converted_person_id", id)
      .maybeSingle(),
  ]);
  if (!person) return null;
  const personWithSubmission = attachSubmissionOptIns(
    [person],
    sourceSubmission ? [sourceSubmission] : [],
  )[0];

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
    return { person: personWithSubmission, events: [], notes: notes ?? [] };
  }

  const [
    { data: events },
    { data: allParts },
    { data: people },
    { data: notes },
  ] = await Promise.all([
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

  return {
    person: personWithSubmission,
    events: fullEvents,
    notes: notes ?? [],
  };
}

export async function getPersonActivity(
  personId: string,
): Promise<PersonActivityItem[]> {
  const supabase = createClient();
  const { data: participants } = await supabase
    .from("participants")
    .select("id, event_id")
    .eq("person_id", personId);
  const participantIds = (participants ?? []).map((row) => row.id);
  const eventIds = Array.from(
    new Set((participants ?? []).map((row) => row.event_id)),
  );

  const [
    { data: notes },
    { data: submissions },
    { data: invites },
    { data: messages },
    { data: assignments },
    { data: contracts },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("notes")
      .select("id, body, created_at")
      .eq("person_id", personId),
    supabase
      .from("submissions")
      .select("id, created_at, reviewed_at, status, outcome")
      .eq("converted_person_id", personId),
    supabase
      .from("portal_invites")
      .select("id, email, created_at, accepted_at")
      .eq("person_id", personId),
    supabase
      .from("portal_messages")
      .select("id, event_id, sender_kind, sender_name, body, created_at")
      .eq("person_id", personId),
    supabase
      .from("form_assignments")
      .select("id, form_id, event_id, created_at, sent_at, completed_at")
      .eq("person_id", personId),
    participantIds.length
      ? supabase
          .from("contracts")
          .select(
            "id, participant_id, event_id, title, sent_at, opened_at, signed_at",
          )
          .in("participant_id", participantIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase.from("events").select("id, name, date").in("id", eventIds)
      : Promise.resolve({ data: [] }),
  ]);

  const formIds = Array.from(
    new Set((assignments ?? []).map((row) => row.form_id)),
  );
  const { data: forms } = formIds.length
    ? await supabase.from("forms").select("id, title").in("id", formIds)
    : { data: [] as Array<{ id: string; title: string }> };
  const eventById = new Map((events ?? []).map((row) => [row.id, row]));
  const formById = new Map((forms ?? []).map((row) => [row.id, row.title]));
  const items: PersonActivityItem[] = [];
  const add = (item: PersonActivityItem) => items.push(item);
  const snippet = (value: string, length = 120) =>
    value.length > length ? `${value.slice(0, length).trim()}…` : value;

  (notes ?? []).forEach((row) =>
    add({
      id: `note-${row.id}`,
      occurredAt: row.created_at,
      title: "Internal note added",
      detail: snippet(row.body),
      href: `/people/${personId}?tab=notes`,
      tone: "default",
    }),
  );
  (submissions ?? []).forEach((row) => {
    add({
      id: `submission-${row.id}`,
      occurredAt: row.created_at,
      title: "Application received",
      detail: null,
      href: `/inbox/${row.id}`,
      tone: "accent",
    });
    if (row.reviewed_at) {
      add({
        id: `submission-reviewed-${row.id}`,
        occurredAt: row.reviewed_at,
        title:
          row.status === "approved"
            ? "Application approved"
            : "Application reviewed",
        detail: row.outcome || null,
        href: `/inbox/${row.id}`,
        tone: row.status === "approved" ? "sage" : "default",
      });
    }
  });
  (invites ?? []).forEach((row) => {
    add({
      id: `invite-${row.id}`,
      occurredAt: row.created_at,
      title: "Portal invitation sent",
      detail: row.email,
      href: null,
      tone: "accent",
    });
    if (row.accepted_at) {
      add({
        id: `invite-accepted-${row.id}`,
        occurredAt: row.accepted_at,
        title: "Portal invitation accepted",
        detail: row.email,
        href: null,
        tone: "sage",
      });
    }
  });
  (messages ?? []).forEach((row) => {
    const event = eventById.get(row.event_id);
    add({
      id: `message-${row.id}`,
      occurredAt: row.created_at,
      title:
        row.sender_kind === "portal"
          ? "Portal message received"
          : "Portal message sent",
      detail: `${event?.name || "Event"} · ${snippet(row.body, 90)}`,
      href: `/inbox?view=conversations`,
      tone: row.sender_kind === "portal" ? "accent" : "default",
    });
  });
  (assignments ?? []).forEach((row) => {
    const formTitle = formById.get(row.form_id) || "Form";
    const event = eventById.get(row.event_id);
    add({
      id: `form-${row.id}`,
      occurredAt: row.sent_at || row.created_at,
      title: `${formTitle} sent`,
      detail: event?.name || null,
      href: `/forms/${row.form_id}/responses`,
      tone: "accent",
    });
    if (row.completed_at) {
      add({
        id: `form-completed-${row.id}`,
        occurredAt: row.completed_at,
        title: `${formTitle} completed`,
        detail: event?.name || null,
        href: `/forms/${row.form_id}/responses`,
        tone: "sage",
      });
    }
  });
  (contracts ?? []).forEach((row) => {
    const event = eventById.get(row.event_id);
    const detail = event?.name || null;
    if (row.sent_at)
      add({
        id: `contract-sent-${row.id}`,
        occurredAt: row.sent_at,
        title: `${row.title} sent`,
        detail,
        href: `/events/${row.event_id}`,
        tone: "accent",
      });
    if (row.opened_at)
      add({
        id: `contract-opened-${row.id}`,
        occurredAt: row.opened_at,
        title: `${row.title} opened`,
        detail,
        href: `/events/${row.event_id}`,
        tone: "default",
      });
    if (row.signed_at)
      add({
        id: `contract-signed-${row.id}`,
        occurredAt: row.signed_at,
        title: `${row.title} signed`,
        detail,
        href: `/events/${row.event_id}`,
        tone: "sage",
      });
  });
  (events ?? []).forEach((row) =>
    add({
      id: `event-${row.id}`,
      occurredAt: `${row.date}T12:00:00`,
      title: row.name,
      detail: "Event date",
      href: `/events/${row.id}`,
      tone: "default",
    }),
  );

  return items.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function aggregateFinances(events: EventWithParticipants[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let owed = 0,
    paid = 0,
    overdue = 0;
  events.forEach((e) => {
    if (e.status === "wrapped" || e.stage === "complete") {
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
