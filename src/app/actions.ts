"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { deriveInitials } from "@/lib/format";
import { sendNotificationEmail } from "@/lib/notify";
import { applicationEmail } from "@/emails/application";
import { ROLE_META } from "@/lib/types";
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
      first_name: nullable(form, "first_name"),
      last_name: nullable(form, "last_name"),
      legal_name: nullable(form, "legal_name"),
      preferred_name: nullable(form, "preferred_name"),
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
      first_name: nullable(form, "first_name"),
      last_name: nullable(form, "last_name"),
      legal_name: nullable(form, "legal_name"),
      preferred_name: nullable(form, "preferred_name"),
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
  const { error: venueErr } = await supabase
    .from("events")
    .update({ venue_id: null })
    .eq("venue_id", id);
  if (venueErr) throw venueErr;

  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) throw error;
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
      portal_brief: nullable(form, "portal_brief"),
      date,
      time_label: nullable(form, "time_label"),
      cover: s(form, "cover") || "modern",
      cover_image_url: nullable(form, "cover_image_url"),
      location: nullable(form, "location"),
      status: (s(form, "status") || "planning") as EventStatus,
      capacity: num(form, "capacity") || 12,
      tags,
      is_public: form.get("is_public") === "on",
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
      portal_brief: nullable(form, "portal_brief"),
      date: s(form, "date"),
      time_label: nullable(form, "time_label"),
      cover: s(form, "cover") || "modern",
      cover_image_url: nullable(form, "cover_image_url"),
      location: nullable(form, "location"),
      status: (s(form, "status") || "planning") as EventStatus,
      capacity: num(form, "capacity") || 12,
      tags,
      is_public: form.get("is_public") === "on",
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
export async function addParticipant(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const eventId = s(form, "event_id");
  const personId = s(form, "person_id");
  const role = s(form, "role") as RoleKind;
  if (!eventId || !personId || !role) {
    return { ok: false, error: "Missing event, person, or role." };
  }
  const rate = num(form, "rate");
  const { error } = await supabase.from("participants").upsert(
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
  if (error) {
    console.error("addParticipant failed", { eventId, personId, role, error });
    return { ok: false, error: error.message };
  }
  revalidatePath(`/events/${eventId}`);
  return { ok: true };
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

export async function bulkMarkPaid(
  form: FormData,
): Promise<{ ok: boolean; count: number }> {
  const supabase = createClient();
  const ids = form
    .getAll("ids[]")
    .filter((v): v is string => typeof v === "string");
  const eventId = s(form, "event_id");
  if (ids.length === 0) return { ok: true, count: 0 };
  const { data: rows } = await supabase
    .from("participants")
    .select("id, rate")
    .in("id", ids);
  for (const row of rows ?? []) {
    const rate = Number(row.rate);
    await supabase
      .from("participants")
      .update({ paid: rate, status: rate === 0 ? "comp" : "paid" })
      .eq("id", row.id);
  }
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { ok: true, count: rows?.length ?? 0 };
}

export async function bulkRemoveParticipants(
  form: FormData,
): Promise<{ ok: boolean; count: number }> {
  const supabase = createClient();
  const ids = form
    .getAll("ids[]")
    .filter((v): v is string => typeof v === "string");
  const eventId = s(form, "event_id");
  if (ids.length === 0) return { ok: true, count: 0 };
  await supabase.from("participants").delete().in("id", ids);
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { ok: true, count: ids.length };
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

// ─── Expenses ───
export async function createExpense(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const eventId = s(form, "event_id");
  const description = s(form, "description");
  const amountRaw = s(form, "amount");
  if (!eventId || !description || amountRaw === "") return;
  await supabase.from("expenses").insert({
    event_id: eventId,
    description,
    category: nullable(form, "category"),
    amount: Number(amountRaw),
    vendor_name: nullable(form, "vendor_name"),
    spent_at: nullable(form, "spent_at"),
    notes: nullable(form, "notes"),
    receipt_url: nullable(form, "receipt_url"),
    created_by: user.id,
  });
  revalidatePath(`/events/${eventId}`);
}

export async function updateExpense(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  const amountRaw = s(form, "amount");
  if (!id) return;
  await supabase
    .from("expenses")
    .update({
      description: s(form, "description"),
      category: nullable(form, "category"),
      amount: amountRaw === "" ? 0 : Number(amountRaw),
      vendor_name: nullable(form, "vendor_name"),
      spent_at: nullable(form, "spent_at"),
      notes: nullable(form, "notes"),
      receipt_url: nullable(form, "receipt_url"),
    })
    .eq("id", id);
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function deleteExpense(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  if (!id) return;
  await supabase.from("expenses").delete().eq("id", id);
  if (eventId) revalidatePath(`/events/${eventId}`);
}

// ─── Submissions (public intake form) ───
export async function moveSubmission(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = s(form, "id");
  const stage = s(form, "stage");
  if (!id || !stage) return;
  await supabase.from("submissions").update({ status: stage }).eq("id", id);
  revalidatePath("/inbox");
}

export async function submitApplication(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  if (s(form, "website") !== "") return { ok: true }; // honeypot triggered

  const role = s(form, "role") as RoleKind;
  const firstName = s(form, "first_name");
  const lastName = s(form, "last_name");
  const businessName = s(form, "business_name");
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const legacyLegalName = s(form, "legal_name");
  const legalName = fullName || legacyLegalName;
  const preferredName = businessName || s(form, "preferred_name");
  // Backward compat: older form used a single 'name' field.
  const fallbackName = s(form, "name");
  const displayName = preferredName || legalName || fallbackName;
  const email = nullable(form, "email");
  const specialty = nullable(form, "specialty");
  if (!role || !firstName || !lastName || !email || !specialty) {
    return {
      ok: false,
      error: "Role, first name, last name, email, and specialty are required.",
    };
  }
  const payload = {
    role,
    name: displayName,
    first_name: firstName,
    last_name: lastName,
    legal_name: legalName || null,
    preferred_name: preferredName || null,
    email,
    phone: nullable(form, "phone"),
    instagram: nullable(form, "instagram"),
    location: nullable(form, "location"),
    specialty,
    portfolio_url: nullable(form, "portfolio_url"),
    message: nullable(form, "message"),
    future_projects_opt_in: form.get("future_projects_opt_in") === "on",
  };
  const { error } = await supabase.from("submissions").insert(payload);
  if (error) {
    console.error("submitApplication failed", error);
    return { ok: false, error: error.message };
  }

  // Notify the team. Failures here log but don't fail the submission.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const inboxUrl = siteUrl ? `${siteUrl}/inbox` : "/inbox";
  const roleLabel = ROLE_META[payload.role]?.label || payload.role;
  const subject = `New ${roleLabel.toLowerCase()} application — ${payload.name}`;
  const fields = [
    { label: "Role", value: roleLabel },
    { label: "Name", value: payload.name },
    payload.legal_name ? { label: "Legal name", value: payload.legal_name } : null,
    payload.email ? { label: "Email", value: payload.email } : null,
    payload.phone ? { label: "Phone", value: payload.phone } : null,
    payload.instagram ? { label: "Instagram", value: payload.instagram } : null,
    payload.location ? { label: "Location", value: payload.location } : null,
    payload.specialty ? { label: "Specialty", value: payload.specialty } : null,
    payload.portfolio_url ? { label: "Portfolio", value: payload.portfolio_url } : null,
    { label: "Future projects", value: payload.future_projects_opt_in ? "Yes" : "No" },
  ].filter((f): f is { label: string; value: string } => f !== null);

  await sendNotificationEmail({
    subject,
    ...(await applicationEmail({
      applicantName: payload.name,
      roleLabel,
      fields,
      message: payload.message,
      inboxUrl,
    })),
  });

  return { ok: true };
}

const ROLE_TINTS_FOR_SUBMISSION: Record<RoleKind, { tint: string; ink: string }> = {
  photographer: { tint: "var(--slate-tint)", ink: "var(--slate)" },
  model: { tint: "var(--rose-tint)", ink: "#a04e60" },
  vendor: { tint: "var(--gold-tint)", ink: "#8a6c2e" },
  venue: { tint: "var(--sage-tint)", ink: "var(--sage-deep)" },
  hmua: { tint: "#f0e8f0", ink: "#7a5a8a" },
  stylist: { tint: "var(--sage-tint)", ink: "var(--sage-deep)" },
  sponsor: { tint: "#ece8e0", ink: "#6e5e3a" },
};

export async function approveSubmission(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = s(form, "id");
  if (!id) return;

  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sub || sub.status === "approved" || sub.status === "archived") return;

  const { tint, ink } = ROLE_TINTS_FOR_SUBMISSION[sub.role as RoleKind] || {
    tint: "var(--hair-2)",
    ink: "var(--ink-2)",
  };

  const { data: person, error: personErr } = await supabase
    .from("people")
    .insert({
      name: sub.name,
      first_name: sub.first_name,
      last_name: sub.last_name,
      legal_name: sub.legal_name,
      preferred_name: sub.preferred_name,
      role: sub.role,
      email: sub.email,
      phone: sub.phone,
      instagram: sub.instagram,
      location: sub.location,
      specialty: sub.specialty,
      bio: sub.message,
      initials: deriveInitials(sub.name),
      tint,
      ink,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (personErr) {
    console.error("approveSubmission: failed to create person", personErr);
    return;
  }

  await supabase
    .from("submissions")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      converted_person_id: person!.id,
    })
    .eq("id", id);

  revalidatePath("/inbox");
  revalidatePath("/people");
  redirect(`/people/${person!.id}`);
}

export async function archiveSubmission(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const id = s(form, "id");
  if (!id) return;
  await supabase
    .from("submissions")
    .update({
      status: "archived",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/inbox");
  redirect("/inbox");
}

// ─── Event notes ───
export async function addEventNote(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const eventId = s(form, "event_id");
  const body = s(form, "body");
  if (!eventId || !body) return;
  await supabase
    .from("event_notes")
    .insert({ event_id: eventId, body, created_by: user.id });
  revalidatePath(`/events/${eventId}`);
}

export async function deleteEventNote(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  if (!id) return;
  await supabase.from("event_notes").delete().eq("id", id);
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function markPortalMessagesRead() {
  cookies().set("portal_read_at", new Date().toISOString(), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
