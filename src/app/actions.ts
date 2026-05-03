"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deriveInitials } from "@/lib/format";
import { sendNotificationEmail, escapeHtml } from "@/lib/notify";
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

// ─── Submissions (public intake form) ───
export async function submitApplication(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const role = s(form, "role") as RoleKind;
  const legalName = s(form, "legal_name");
  const preferredName = s(form, "preferred_name");
  // Backward compat: older form used a single 'name' field.
  const fallbackName = s(form, "name");
  const displayName = preferredName || legalName || fallbackName;
  if (!role || !displayName) {
    return { ok: false, error: "Legal name and role are required." };
  }
  const payload = {
    role,
    name: displayName,
    legal_name: legalName || null,
    preferred_name: preferredName || null,
    email: nullable(form, "email"),
    phone: nullable(form, "phone"),
    instagram: nullable(form, "instagram"),
    location: nullable(form, "location"),
    specialty: nullable(form, "specialty"),
    portfolio_url: nullable(form, "portfolio_url"),
    message: nullable(form, "message"),
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
  const rows: Array<[string, string | null]> = [
    ["Role", roleLabel],
    ["Name", payload.name],
    ["Email", payload.email],
    ["Phone", payload.phone],
    ["Instagram", payload.instagram],
    ["Location", payload.location],
    ["Specialty", payload.specialty],
    ["Portfolio", payload.portfolio_url],
  ];
  const detailRows = rows
    .filter(([, v]) => v && v.trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#6b665e;font-size:13px;">${k}</td><td style="padding:6px 0;font-size:13px;color:#1a1814;">${escapeHtml(
          v!,
        )}</td></tr>`,
    )
    .join("");
  const messageBlock = payload.message
    ? `<div style="margin-top:18px;padding:14px 16px;background:#f4efe5;border-radius:10px;font-family:Georgia,serif;font-size:14px;line-height:1.55;color:#3d3a35;white-space:pre-wrap;">${escapeHtml(
        payload.message,
      )}</div>`
    : "";
  const html = `
    <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;color:#1a1814;max-width:560px;margin:0 auto;padding:24px;">
      <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross</div>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:6px 0 18px;letter-spacing:-0.01em;">
        New application
      </h1>
      <p style="font-size:14px;color:#3d3a35;line-height:1.55;margin:0 0 18px;">
        Someone just submitted the public intake form. Details below — open the inbox to approve or archive.
      </p>
      <table style="border-collapse:collapse;">${detailRows}</table>
      ${messageBlock}
      <div style="margin-top:24px;">
        <a href="${inboxUrl}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">Open inbox</a>
      </div>
      <p style="font-size:11px;color:#9a948a;margin-top:32px;">Sent from your Casa Cross CRM.</p>
    </div>
  `;
  const text = [
    subject,
    "",
    ...rows
      .filter(([, v]) => v && v.trim() !== "")
      .map(([k, v]) => `${k}: ${v}`),
    payload.message ? `\nNote: ${payload.message}` : "",
    `\nReview: ${inboxUrl}`,
  ].join("\n");

  await sendNotificationEmail({ subject, html, text });

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
  if (!sub || sub.status !== "pending") return;

  const { tint, ink } = ROLE_TINTS_FOR_SUBMISSION[sub.role as RoleKind] || {
    tint: "var(--hair-2)",
    ink: "var(--ink-2)",
  };

  const { data: person, error: personErr } = await supabase
    .from("people")
    .insert({
      name: sub.name,
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

// ─── Mood images ───
export async function addMoodImage(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const eventId = s(form, "event_id");
  const url = s(form, "url");
  if (!eventId || !url) return;
  await supabase.from("mood_images").insert({
    event_id: eventId,
    url,
    caption: nullable(form, "caption"),
    created_by: user.id,
  });
  revalidatePath(`/events/${eventId}`);
}

export async function removeMoodImage(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const eventId = s(form, "event_id");
  if (!id) return;
  await supabase.from("mood_images").delete().eq("id", id);
  if (eventId) revalidatePath(`/events/${eventId}`);
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
