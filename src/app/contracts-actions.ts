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
import { sendNotificationEmail, sendEmail, escapeHtml } from "@/lib/notify";
import { contractReadyEmail } from "@/emails/contract-ready";
import { contractSignedEmail } from "@/emails/contract-signed";
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
  const pdfUrl = nullable(form, "pdf_url");
  const { data, error } = await supabase
    .from("contract_templates")
    .insert({
      name,
      description: nullable(form, "description"),
      // If a PDF is attached, the markdown body is optional;
      // otherwise fall back to the default boilerplate.
      body_md:
        s(form, "body_md") || (pdfUrl ? "" : DEFAULT_TEMPLATE_BODY),
      pdf_url: pdfUrl,
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = s(form, "id");
  if (!id) return;
  const { data, error } = await supabase
    .from("contract_templates")
    .update({
      name: s(form, "name"),
      description: nullable(form, "description"),
      body_md: s(form, "body_md"),
      pdf_url: nullable(form, "pdf_url"),
    })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  if (!data) throw new Error("Template save did not update a row.");

  revalidatePath("/contracts/templates");
  revalidatePath(`/contracts/templates/${id}`);
  redirect(`/contracts/templates/${id}?saved=1`);
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
): Promise<
  | { ok: true; url: string; id: string; isDraft: boolean }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const participantId = s(form, "participant_id");
  const templateId = nullable(form, "template_id");
  const title = s(form, "title") || "Booking Agreement";
  const customBody = nullable(form, "body_md");
  // 'save_as_draft' = "on" → status starts as 'draft' so the user can
  // review/edit before flipping it to 'sent'.
  const isDraft = form.get("save_as_draft") === "on";
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
  let pdfUrl: string | null = null;
  if (templateId) {
    const { data: tpl } = await supabase
      .from("contract_templates")
      .select("body_md, pdf_url")
      .eq("id", templateId)
      .maybeSingle();
    if (tpl) {
      pdfUrl = tpl.pdf_url ?? null;
      if (!templateBody) templateBody = tpl.body_md ?? null;
    }
  }
  // No body and no PDF → fall back to the default markdown boilerplate.
  if (!templateBody && !pdfUrl) templateBody = DEFAULT_TEMPLATE_BODY;

  const role = part.role as RoleKind;
  const renderedBody = templateBody
    ? renderMerge(templateBody, {
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
      })
    : "";

  const token = generateShareToken();

  const paymentRequired = form.get("payment_required") === "on";
  const paymentAmountRaw = s(form, "payment_amount");
  const paymentAmount = paymentRequired
    ? paymentAmountRaw !== ""
      ? Number(paymentAmountRaw)
      : Number(part.rate)
    : null;

  const { data: contract, error } = await supabase
    .from("contracts")
    .insert({
      event_id: part.event_id,
      participant_id: participantId,
      template_id: templateId,
      title,
      body_md: renderedBody,
      pdf_url: pdfUrl,
      status: isDraft ? "draft" : "sent",
      share_token: token,
      sent_at: isDraft ? null : new Date().toISOString(),
      payment_required: paymentRequired,
      payment_amount: paymentAmount,
      created_by: user.id,
    })
    .select("id, share_token")
    .single();
  if (error) {
    console.error("sendContract failed", error);
    return { ok: false, error: error.message };
  }

  if (!isDraft) {
    // Flip participant.contract to 'sent' to reflect status across the app.
    await supabase
      .from("participants")
      .update({ contract: "sent" })
      .eq("id", participantId);
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_EVENTS_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";
  const link = `${siteUrl}/sign/${contract!.share_token}`;

  if (!isDraft) {
    const recipientName = person.preferred_name || person.name;
    // Email the vendor/client directly with their signing link.
    if (person.email) {
      await sendEmail({
        to: person.email,
        subject: `Your agreement for ${event.name} is ready to sign`,
        ...(await contractReadyEmail({
          recipientName,
          eventName: event.name,
          signingUrl: link,
        })),
      });
    }
    // Notify the team that the contract was sent.
    await sendNotificationEmail({
      subject: `Contract sent to ${person.name} — ${event.name}`,
      html: `
        <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;color:#1a1814;max-width:560px;margin:0 auto;padding:24px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross</div>
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:6px 0 18px;">Contract sent — ${escapeHtml(event.name)}</h1>
          <p style="font-size:14px;color:#3d3a35;line-height:1.55;margin:0 0 18px;">A signing link was emailed to <strong>${escapeHtml(person.name)}</strong>${person.email ? ` (${escapeHtml(person.email)})` : ""}.</p>
          <p><a href="${link}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">Preview signing page</a></p>
        </div>
      `,
      text: `Contract sent to ${person.name} — ${event.name}\nSigning link: ${link}`,
    });

  }

  revalidatePath(`/events/${part.event_id}`);
  revalidatePath(`/events/${part.event_id}/participants/${participantId}`);
  revalidatePath("/contracts");
  return { ok: true, url: link, id: contract!.id, isDraft };
}

// ─── Edit / lifecycle ───
export async function updateContract(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return { ok: false, error: "Missing id." };
  const { data: row } = await supabase
    .from("contracts")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, error: "Contract not found." };
  if (row.status === "signed" || row.status === "void") {
    return {
      ok: false,
      error: `Can't edit a ${row.status} contract — recall or void first.`,
    };
  }
  const paymentRequired = form.get("payment_required") === "on";
  const paymentAmountRaw = s(form, "payment_amount");
  const updates: Record<string, unknown> = {
    title: s(form, "title"),
    body_md: s(form, "body_md"),
    pdf_url: nullable(form, "pdf_url"),
    payment_required: paymentRequired,
    payment_amount: paymentRequired
      ? paymentAmountRaw !== ""
        ? Number(paymentAmountRaw)
        : null
      : null,
  };
  const { error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  return { ok: true };
}

export async function sendDraftContract(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const { data: row } = await supabase
    .from("contracts")
    .select("id, status, participant_id, event_id")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.status !== "draft") return;
  await supabase
    .from("contracts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  await supabase
    .from("participants")
    .update({ contract: "sent" })
    .eq("id", row.participant_id);
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath(`/events/${row.event_id}`);
}

export async function recallContract(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const { data: row } = await supabase
    .from("contracts")
    .select("id, status, participant_id, event_id")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.status !== "sent") return;
  await supabase
    .from("contracts")
    .update({ status: "draft" })
    .eq("id", id);
  await supabase
    .from("participants")
    .update({ contract: "unsent" })
    .eq("id", row.participant_id);
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath(`/events/${row.event_id}`);
}

export async function bulkSendContracts(
  form: FormData,
): Promise<{ ok: true; sent: number; urls: string[]; errors: string[] }> {
  const ids = form
    .getAll("participant_ids[]")
    .filter((v): v is string => typeof v === "string");
  const templateId = nullable(form, "template_id");
  const title = s(form, "title") || "Booking Agreement";

  const urls: string[] = [];
  const errors: string[] = [];

  for (const pid of ids) {
    const f = new FormData();
    f.set("participant_id", pid);
    if (templateId) f.set("template_id", templateId);
    f.set("title", title);
    const r = await sendContract(f);
    if (r.ok) urls.push(r.url);
    else errors.push(r.error);
  }

  return { ok: true, sent: urls.length, urls, errors };
}

export async function voidContract(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const { data: row } = await supabase
    .from("contracts")
    .select("id, participant_id, event_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("contracts")
    .update({ status: "void" })
    .eq("id", id);
  await supabase
    .from("participants")
    .update({ contract: "unsent" })
    .eq("id", row.participant_id);
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath(`/events/${row.event_id}`);
}

export async function deleteContract(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const { data: row } = await supabase
    .from("contracts")
    .select("event_id, participant_id")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("contracts").delete().eq("id", id);
  if (row) {
    revalidatePath(`/events/${row.event_id}`);
  }
  revalidatePath("/contracts");
  redirect("/contracts");
}

export async function saveContractAsTemplate(
  form: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const name = s(form, "name");
  const bodyMd = s(form, "body_md");
  const pdfUrl = nullable(form, "pdf_url");
  if (!name) return { ok: false, error: "Template needs a name." };
  if (!bodyMd && !pdfUrl)
    return { ok: false, error: "Empty body — nothing to save." };
  const { data, error } = await supabase
    .from("contract_templates")
    .insert({
      name,
      body_md: bodyMd,
      pdf_url: pdfUrl,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/contracts/templates");
  return { ok: true, id: data!.id };
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

  // Notify the team that the contract was signed.
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, title, event_id")
    .eq("share_token", token)
    .maybeSingle();
  if (contract) {
    const { data: event } = await supabase
      .from("events")
      .select("name")
      .eq("id", contract.event_id)
      .maybeSingle();
    const siteUrl =
      process.env.NEXT_PUBLIC_CRM_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "";
    await sendNotificationEmail({
      subject: `${signedName} signed ${contract.title} — ${event?.name ?? "your event"}`,
      ...(await contractSignedEmail({
        signerName: signedName,
        contractTitle: contract.title,
        eventName: event?.name ?? "your event",
        contractUrl: `${siteUrl}/contracts/${contract.id}`,
      })),
    });
  }

  return { ok: true };
}
