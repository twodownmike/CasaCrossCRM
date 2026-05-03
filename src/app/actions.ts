"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deriveInitials } from "@/lib/format";
import type {
  ContractStatus,
  EventStatus,
  PayStatus,
  RoleKind,
} from "@/lib/types";

const ROLE_TINTS: Record<RoleKind, { tint: string; ink: string }> = {
  photographer: { tint: "var(--slate-tint)", ink: "var(--slate)" },
  model: { tint: "var(--rose-tint)", ink: "#a04e60" },
  vendor: { tint: "var(--gold-tint)", ink: "#8a6c2e" },
  venue: { tint: "var(--sage-tint)", ink: "var(--sage-deep)" },
  hmua: { tint: "#f0e8f0", ink: "#7a5a8a" },
  stylist: { tint: "var(--sage-tint)", ink: "var(--sage-deep)" },
  sponsor: { tint: "#ece8e0", ink: "#6e5e3a" },
};

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function num(form: FormData, key: string) {
  const v = s(form, key);
  return v === "" ? 0 : Number(v);
}
function nullable(form: FormData, key: string) {
  const v = s(form, key);
  return v === "" ? null : v;
}

// ─── People ───
export async function createPerson(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = s(form, "name");
  const role = s(form, "role") as RoleKind;
  if (!name || !role) return;

  const { tint, ink } = ROLE_TINTS[role] || {
    tint: "var(--hair-2)",
    ink: "var(--ink-2)",
  };

  const { data, error } = await supabase
    .from("people")
    .insert({
      name,
      role,
      email: nullable(form, "email"),
      phone: nullable(form, "phone"),
      instagram: nullable(form, "instagram"),
      location: nullable(form, "location"),
      specialty: nullable(form, "specialty"),
      bio: nullable(form, "bio"),
      initials: deriveInitials(name),
      tint,
      ink,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/people");
  redirect(`/people/${data!.id}`);
}

export async function updatePerson(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const role = s(form, "role") as RoleKind;
  const { tint, ink } = ROLE_TINTS[role] || {
    tint: "var(--hair-2)",
    ink: "var(--ink-2)",
  };
  const { error } = await supabase
    .from("people")
    .update({
      name: s(form, "name"),
      role,
      email: nullable(form, "email"),
      phone: nullable(form, "phone"),
      instagram: nullable(form, "instagram"),
      location: nullable(form, "location"),
      specialty: nullable(form, "specialty"),
      bio: nullable(form, "bio"),
      initials: deriveInitials(s(form, "name")),
      tint,
      ink,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(`/people/${id}`);
  revalidatePath("/people");
  redirect(`/people/${id}`);
}

export async function deletePerson(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase.from("people").delete().eq("id", id);
  revalidatePath("/people");
  redirect("/people");
}

export async function addNote(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const personId = s(form, "person_id");
  const body = s(form, "body");
  if (!personId || !body) return;
  await supabase
    .from("notes")
    .insert({ person_id: personId, body, created_by: user.id });
  revalidatePath(`/people/${personId}`);
}

// ─── Events ───
export async function createEvent(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = s(form, "name");
  const date = s(form, "date");
  if (!name || !date) return;

  const tags = s(form, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { data, error } = await supabase
    .from("events")
    .insert({
      name,
      subtitle: nullable(form, "subtitle"),
      description: nullable(form, "description"),
      date,
      time_label: nullable(form, "time_label"),
      cover: s(form, "cover") || "modern",
      cover_image_url: nullable(form, "cover_image_url"),
      location: nullable(form, "location"),
      status: (s(form, "status") || "planning") as EventStatus,
      capacity: num(form, "capacity") || 12,
      tags,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/events");
  redirect(`/events/${data!.id}`);
}

export async function updateEvent(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const tags = s(form, "tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("events")
    .update({
      name: s(form, "name"),
      subtitle: nullable(form, "subtitle"),
      description: nullable(form, "description"),
      date: s(form, "date"),
      time_label: nullable(form, "time_label"),
      cover: s(form, "cover") || "modern",
      cover_image_url: nullable(form, "cover_image_url"),
      location: nullable(form, "location"),
      status: (s(form, "status") || "planning") as EventStatus,
      capacity: num(form, "capacity") || 12,
      tags,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(`/events/${id}`);
  revalidatePath("/events");
  redirect(`/events/${id}`);
}

export async function deleteEvent(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/events");
  redirect("/events");
}

// ─── Participants ───
export async function addParticipant(form: FormData) {
  const supabase = createClient();
  const eventId = s(form, "event_id");
  const personId = s(form, "person_id");
  const role = s(form, "role") as RoleKind;
  if (!eventId || !personId || !role) return;
  const rate = num(form, "rate");
  await supabase.from("participants").upsert(
    {
      event_id: eventId,
      person_id: personId,
      role,
      role_note: nullable(form, "role_note"),
      rate,
      paid: 0,
      status: rate === 0 ? "comp" : "due",
      contract: "unsent",
      due_date: nullable(form, "due_date"),
    },
    { onConflict: "event_id,person_id" },
  );
  revalidatePath(`/events/${eventId}`);
}

export async function updateParticipant(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  if (!id) return;
  const updates: Record<string, unknown> = {};
  const rate = form.get("rate");
  const paid = form.get("paid");
  const status = form.get("status");
  const contract = form.get("contract");
  const due = form.get("due_date");
  const role = form.get("role");
  const roleNote = form.get("role_note");

  let rateValue: number | undefined;
  let paidValue: number | undefined;
  if (typeof rate === "string" && rate !== "") {
    rateValue = Number(rate);
    updates.rate = rateValue;
  }
  if (typeof paid === "string" && paid !== "") {
    paidValue = Number(paid);
    updates.paid = paidValue;
  }
  if (typeof status === "string") updates.status = status as PayStatus;
  if (typeof contract === "string")
    updates.contract = contract as ContractStatus;
  if (typeof due === "string") updates.due_date = due === "" ? null : due;
  if (typeof role === "string" && role !== "")
    updates.role = role as RoleKind;
  if (typeof roleNote === "string")
    updates.role_note = roleNote === "" ? null : roleNote;

  // If rate becomes $0, this is a comp booking — force status + paid to match.
  if (rateValue === 0) {
    updates.status = "comp";
    updates.paid = 0;
  } else if (
    rateValue !== undefined &&
    paidValue !== undefined &&
    paidValue >= rateValue &&
    rateValue > 0
  ) {
    // If paid >= rate, mark fully paid automatically.
    updates.status = "paid";
  }

  await supabase.from("participants").update(updates).eq("id", id);
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/participants/${id}`);
  }
}

export async function removeParticipant(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  if (!id) return;
  await supabase.from("participants").delete().eq("id", id);
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function markPaid(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  if (!id) return;
  const { data: row } = await supabase
    .from("participants")
    .select("rate")
    .eq("id", id)
    .single();
  if (!row) return;
  const rate = Number(row.rate);
  await supabase
    .from("participants")
    .update({
      paid: rate,
      status: rate === 0 ? "comp" : "paid",
    })
    .eq("id", id);
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/participants/${id}`);
    redirect(`/events/${eventId}?tab=money`);
  }
}

// ─── Tasks ───
export async function createTask(form: FormData) {
  const supabase = createClient();
  const eventId = s(form, "event_id");
  const title = s(form, "title");
  if (!title) return;
  await supabase.from("tasks").insert({
    event_id: eventId || null,
    title,
    due: nullable(form, "due"),
    done: false,
  });
  if (eventId) revalidatePath(`/events/${eventId}`);
  revalidatePath("/home");
}

export async function toggleTask(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const done = form.get("done") === "true";
  const eventId = s(form, "event_id");
  if (!id) return;
  await supabase.from("tasks").update({ done: !done }).eq("id", id);
  if (eventId) revalidatePath(`/events/${eventId}`);
  revalidatePath("/home");
}

// ─── Messages ───
export async function sendMessage(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const eventId = s(form, "event_id");
  const text = s(form, "text");
  if (!eventId || !text) return;
  const senderName =
    (user.user_metadata?.name as string) ||
    user.email?.split("@")[0] ||
    "You";
  await supabase.from("messages").insert({
    event_id: eventId,
    sender_id: user.id,
    sender_name: senderName,
    text,
  });
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/messages");
}
