"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail, sendEmail } from "@/lib/notify";
import { portalInviteEmail } from "@/emails/portal-invite";
import { portalMessageToTeamEmail, portalMessageToVendorEmail } from "@/emails/portal-message";

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function nullable(form: FormData, key: string) {
  const v = s(form, key);
  return v === "" ? null : v;
}

function publicSiteUrl() {
  return process.env.NEXT_PUBLIC_EVENTS_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
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

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error: inviteErr } = await supabase.from("portal_invites").insert({
    person_id: personId,
    email,
    token,
    expires_at: expiresAt,
    created_by: user.id,
  });
  if (inviteErr) throw inviteErr;

  const siteUrl = publicSiteUrl();
  const recipientName = displayName || email.split("@")[0];
  await sendEmail({
    to: email,
    subject: "You've been invited to the Casa Cross portal",
    ...(await portalInviteEmail({
      recipientName,
      portalUrl: `${siteUrl}/portal/signup?token=${token}`,
    })),
  });

  revalidatePath(`/people/${personId}`);
}

export async function acceptPortalInvite(
  form: FormData,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const token = s(form, "token");
  const firstName = s(form, "first_name");
  const lastName = s(form, "last_name");
  const phone = nullable(form, "phone");
  const displayName = nullable(form, "display_name");
  const communicationOptIn = form.get("communication_opt_in") === "on";
  if (!token || !firstName || !lastName) {
    return { ok: false, error: "First and last name are required." };
  }

  const { data: accepted, error: acceptErr } = await supabase.rpc(
    "accept_portal_invite",
    {
      invite_token: token,
      first_name_value: firstName,
      last_name_value: lastName,
      phone_value: phone || "",
      display_name_value: displayName || `${firstName} ${lastName}`,
      communication_opt_in_value: communicationOptIn,
    },
  );
  if (acceptErr) return { ok: false, error: acceptErr.message };

  const email = accepted?.[0]?.email;
  if (!email) {
    return { ok: false, error: "This portal invite could not be accepted." };
  }

  const siteUrl = publicSiteUrl();
  const next = `/portal/setup?invite=${encodeURIComponent(token)}`;
  const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error: authErr } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });
  if (authErr) return { ok: false, error: authErr.message };

  return { ok: true, email };
}

export async function completePortalSetup(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login?next=/portal/setup");

  const firstName = s(form, "first_name");
  const lastName = s(form, "last_name");
  if (!firstName || !lastName) return;
  const displayName = nullable(form, "display_name") || `${firstName} ${lastName}`;
  const { error } = await supabase
    .from("portal_users")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: nullable(form, "phone"),
      display_name: displayName,
      communication_opt_in: form.get("communication_opt_in") === "on",
      setup_completed_at: new Date().toISOString(),
    })
    .eq("active", true)
    .eq("email", user.email.toLowerCase());
  if (error) throw error;

  revalidatePath("/portal");
  redirect("/portal");
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
  const siteUrl = process.env.NEXT_PUBLIC_CRM_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const portalTabUrl = `${siteUrl}/events/${eventId}?tab=portal`;
  await sendNotificationEmail({
    subject: `New message from ${person?.name ?? user.email} — ${event?.name ?? "your event"}`,
    ...(await portalMessageToTeamEmail({
      senderName: person?.name ?? user.email ?? "Someone",
      eventName: event?.name ?? "an event",
      body,
      replyUrl: portalTabUrl,
    })),
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
  const [{ data: portalUser }, { data: person }, { data: event }] = await Promise.all([
    supabase
      .from("portal_users")
      .select("email, display_name")
      .eq("person_id", personId)
      .eq("active", true)
      .maybeSingle(),
    supabase.from("people").select("name, email").eq("id", personId).maybeSingle(),
    supabase.from("events").select("name").eq("id", eventId).maybeSingle(),
  ]);
  const recipientEmail = portalUser?.email ?? person?.email;
  console.log("[portal-reply] person_id:", personId, "portalUser:", portalUser?.email ?? "not found", "people.email:", person?.email ?? "not found", "sending to:", recipientEmail ?? "nobody");
  const siteUrl = publicSiteUrl();
  const portalUrl = `${siteUrl}/portal/events/${eventId}`;
  if (recipientEmail) {
    const recipientName = portalUser?.display_name ?? person?.name ?? recipientEmail;
    await sendEmail({
      to: recipientEmail,
      subject: `New message from Casa Cross — ${event?.name ?? "your event"}`,
      ...(await portalMessageToVendorEmail({
        recipientName,
        eventName: event?.name ?? "your event",
        body,
        portalUrl,
      })),
    });
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/portal/events/${eventId}`);
}
