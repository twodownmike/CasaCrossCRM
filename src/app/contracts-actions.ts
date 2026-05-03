"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  renderMerge,
  generateShareToken,
  DEFAULT_TEMPLATE_BODY,
} from "@/lib/contracts";
import { sendNotificationEmail, escapeHtml } from "@/lib/notify";
import { ROLE_META } from "@/lib/types";
import type { RoleKind } from "@/lib/types";

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function nullable(form: FormData, key: string) {
  const v = s(form, key);
  return v === "" ? null : v;
}

// ─── Templates ───
export async function createTemplate(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name = s(form, "name");
  if (!name) return;
  const { data, error } = await supabase
    .from("contract_templates")
    .insert({
      name,
      description: nullable(form, "description"),
      body_md: s(form, "body_md") || DEFAULT_TEMPLATE_BODY,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/contracts/templates");
  redirect(`/contracts/templates/${data!.id}`);
}

export async function updateTemplate(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase
    .from("contract_templates")
    .update({
      name: s(form, "name"),
      description: nullable(form, "description"),
      body_md: s(form, "body_md"),
    })
    .eq("id", id);
  revalidatePath("/contracts/templates");
  revalidatePath(`/contracts/templates/${id}`);
}

export async function deleteTemplate(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase.from("contract_templates").delete().eq("id", id);
  revalidatePath("/contracts/templates");
  redirect("/contracts/templates");
}

// ─── Contracts ───
export async function sendContract(
  form: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const participantId = s(form, "participant_id");
  const templateId = nullable(form, "template_id");
  const title = s(form, "title") || "Booking Agreement";
  const customBody = nullable(form, "body_md");
  if (!participantId) {
    return { ok: false, error: "Missing participant." };
  }

  const { data: part } = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .maybeSingle();
  if (!part) return { ok: false, error: "Participant not found." };

  const [{ data: person }, { data: event }] = await Promise.all([
    supabase.from("people").select("*").eq("id", part.person_id).maybeSingle(),
    supabase.from("events").select("*").eq("id", part.event_id).maybeSingle(),
  ]);
  if (!person || !event) {
    return { ok: false, error: "Could not load participant context." };
  }

  let templateBody = customBody;
  if (!templateBody && templateId) {
    const { data: tpl } = await supabase
      .from("contract_templates")
      .select("body_md")
      .eq("id", templateId)
      .maybeSingle();
    templateBody = tpl?.body_md ?? null;
  }
  if (!templateBody) templateBody = DEFAULT_TEMPLATE_BODY;

  const role = part.role as RoleKind;
  const renderedBody = renderMerge(templateBody, {
    participantName:
      person.preferred_name || person.legal_name || person.name,
    participantLegalName: person.legal_name || person.name,
    participantEmail: person.email,
    participantPhone: person.phone,
    role: ROLE_META[role]?.label || role,
    rate: Number(part.rate),
    ratePaid: Number(part.paid),
    eventName: event.name,
    eventDate: event.date,
    eventTime: event.time_label,
    eventLocation: event.location,
  });

  const token = generateShareToken();

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      event_id: part.event_id,
      participant_id: participantId,
      template_id: templateId,
      title,
      body_md: renderedBody,
      status: "sent",
      share_token: token,
      sent_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select("id, share_token")
    .single();
  if (error) {
    console.error("sendContract failed", error);
    return { ok: false, error: error.message };
  }

  // Flip participant.contract to 'sent' to reflect status across the app.
  await supabase
    .from("participants")
    .update({ contract: "sent" })
    .eq("id", participantId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const link = `${siteUrl}/sign/${contract!.share_token}`;

  // Email the recipient if we have an address and Resend is set up.
  if (person.email) {
    await sendNotificationEmail({
      subject: `Please review and sign — ${event.name}`,
      // The participant gets the email, not the team — so we override
      // the recipient list via NOTIFICATION_EMAILS env, which only the
      // team has. To send to the participant we'd need a separate path.
      // For MVP we email both: the team gets a copy, and the participant
      // receives a forwarded copy if their email is in NOTIFICATION_EMAILS.
      // Simpler: for now log the link so the team can copy it manually.
      html: `
        <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;color:#1a1814;max-width:560px;margin:0 auto;padding:24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross</div>
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:6px 0 18px;letter-spacing:-0.01em;">Contract sent — ${escapeHtml(event.name)}</h1>
          <p style="font-size:14px;color:#3d3a35;line-height:1.55;margin:0 0 18px;">A signing link was generated for <strong>${escapeHtml(person.name)}</strong>. Forward the link below to them, or copy it to share via text/DM.</p>
          <p><a href="${link}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">Open signing page</a></p>
          <p style="font-size:11px;color:#9a948a;word-break:break-all;">${link}</p>
        </div>
      `,
      text: `Contract sent — ${event.name}\n\nSigning link for ${person.name}:\n${link}`,
    });
  }

  revalidatePath(`/events/${part.event_id}`);
  revalidatePath(`/events/${part.event_id}/participants/${participantId}`);
  revalidatePath("/contracts");
  return { ok: true, url: link };
}

export async function voidContract(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase
    .from("contracts")
    .update({ status: "void" })
    .eq("id", id);
  revalidatePath("/contracts");
}

export async function deleteContract(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase.from("contracts").delete().eq("id", id);
  revalidatePath("/contracts");
}

// ─── Public sign action (called from /sign/[token]) ───
export async function signContract(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const token = s(form, "token");
  const signedName = s(form, "signed_name");
  const signatureDataUrl = s(form, "signature_url");
  if (!token) return { ok: false, error: "Missing token." };
  if (!signedName) return { ok: false, error: "Please type your full legal name." };
  if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/")) {
    return { ok: false, error: "Please draw your signature." };
  }
  if (signatureDataUrl.length > 800_000) {
    return { ok: false, error: "Signature image is too large." };
  }

  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    null;
  const ua = h.get("user-agent") || null;

  const { data, error } = await supabase.rpc("sign_contract", {
    token,
    signer_name: signedName,
    signature_url_in: signatureDataUrl,
    signer_ip_in: ip,
    signer_ua_in: ua,
  });
  if (error) {
    console.error("sign_contract rpc failed", error);
    return { ok: false, error: error.message };
  }
  const result = data as { ok: boolean; error?: string } | null;
  if (!result?.ok) {
    return { ok: false, error: result?.error || "Could not sign contract." };
  }
  return { ok: true };
}
