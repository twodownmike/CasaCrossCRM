"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail, sendEmail, escapeHtml } from "@/lib/notify";

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function requireTeam() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isTeamMember } = await supabase.rpc("is_team_member");
  if (!isTeamMember) redirect("/portal");
  return { supabase, user };
}

export async function grantPortalAccess(form: FormData) {
  const { supabase, user } = await requireTeam();
  const personId = s(form, "person_id");
  const email = s(form, "email").toLowerCase();
  const displayName = s(form, "display_name");
  if (!personId || !email) return;

  await supabase.from("portal_users").upsert(
    {
      person_id: personId,
      email,
      display_name: displayName || null,
      active: true,
      created_by: user.id,
    },
    { onConflict: "person_id,email" },
  );

  revalidatePath(`/people/${personId}`);
}

export async function revokePortalAccess(form: FormData) {
  const { supabase } = await requireTeam();
  const id = s(form, "id");
  const personId = s(form, "person_id");
  if (!id) return;

  await supabase.from("portal_users").update({ active: false }).eq("id", id);
  if (personId) revalidatePath(`/people/${personId}`);
}

export async function sendPortalMessage(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal");

  const eventId = s(form, "event_id");
  const body = s(form, "body");
  if (!eventId || !body) return;

  const { data: personId } = await supabase.rpc("portal_person_id");
  if (!personId) redirect("/portal");

  await supabase.from("portal_messages").insert({
    event_id: eventId,
    person_id: personId,
    sender_kind: "portal",
    sender_user_id: user.id,
    sender_name: user.email,
    body,
  });

  // Notify the team of the incoming message.
  const [{ data: person }, { data: event }] = await Promise.all([
    supabase.from("people").select("name").eq("id", personId).maybeSingle(),
    supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const portalTabUrl = `${siteUrl}/events/${eventId}?tab=portal`;
  await sendNotificationEmail({
    subject: `New message from ${person?.name ?? user.email} — ${event?.name ?? "your event"}`,
    html: `
      <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;color:#1a1814;max-width:560px;margin:0 auto;padding:24px;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross</div>
        <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:6px 0 12px;">New portal message</h1>
        <p style="font-size:14px;color:#6b665e;margin:0 0 16px;"><strong style="color:#1a1814;">${escapeHtml(person?.name ?? user.email ?? "Someone")}</strong> sent a message about <strong style="color:#1a1814;">${escapeHtml(event?.name ?? "an event")}</strong>:</p>
        <div style="padding:14px 16px;background:#f4efe5;border-radius:10px;font-size:14px;line-height:1.55;color:#3d3a35;white-space:pre-wrap;">${escapeHtml(body)}</div>
        <div style="margin-top:20px;">
          <a href="${portalTabUrl}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">Reply in Portal tab</a>
        </div>
      </div>
    `,
    text: `New message from ${person?.name ?? user.email} about ${event?.name ?? "an event"}:\n\n${body}\n\nReply: ${portalTabUrl}`,
  });

  revalidatePath(`/portal/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
}

export async function sendTeamPortalMessage(form: FormData) {
  const { supabase, user } = await requireTeam();
  const eventId = s(form, "event_id");
  const personId = s(form, "person_id");
  const body = s(form, "body");
  if (!eventId || !personId || !body) return;

  await supabase.from("portal_messages").insert({
    event_id: eventId,
    person_id: personId,
    sender_kind: "team",
    sender_user_id: user.id,
    sender_name: user.email,
    body,
  });

  // Email the portal user so they know there's a reply waiting.
  const [{ data: portalUser }, { data: event }] = await Promise.all([
    supabase
      .from("portal_users")
      .select("email, display_name")
      .eq("person_id", personId)
      .eq("active", true)
      .maybeSingle(),
    supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const portalUrl = `${siteUrl}/portal/events/${eventId}`;
  if (portalUser?.email) {
    const recipientName = portalUser.display_name ?? portalUser.email;
    await sendEmail({
      to: portalUser.email,
      subject: `New message from Casa Cross — ${event?.name ?? "your event"}`,
      html: `
        <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;color:#1a1814;max-width:560px;margin:0 auto;padding:24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross Events</div>
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:6px 0 12px;">Hi ${escapeHtml(recipientName)},</h1>
          <p style="font-size:14px;color:#3d3a35;line-height:1.6;margin:0 0 16px;">
            You have a new message about <strong>${escapeHtml(event?.name ?? "your event")}</strong>:
          </p>
          <div style="padding:14px 16px;background:#f4efe5;border-radius:10px;font-size:14px;line-height:1.55;color:#3d3a35;white-space:pre-wrap;margin-bottom:20px;">${escapeHtml(body)}</div>
          <a href="${portalUrl}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-size:14px;font-weight:500;">View &amp; Reply</a>
          <p style="font-size:11px;color:#b0aa9e;margin-top:32px;">Casa Cross Events · Reply at ${portalUrl}</p>
        </div>
      `,
      text: `Hi ${recipientName},\n\nNew message about ${event?.name ?? "your event"}:\n\n${body}\n\nView and reply: ${portalUrl}\n\n— Casa Cross Events`,
    });
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/portal/events/${eventId}`);
}
