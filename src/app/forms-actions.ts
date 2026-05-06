"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendNotificationEmail, escapeHtml } from "@/lib/notify";
import type { FormFieldType } from "@/lib/types";

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function nullable(form: FormData, key: string) {
  const v = s(form, key);
  return v === "" ? null : v;
}

function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

const VALID_TYPES: FormFieldType[] = [
  "text",
  "email",
  "phone",
  "url",
  "number",
  "date",
  "textarea",
  "select",
  "checkbox",
];

// ─── Forms ───
export async function createForm(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = s(form, "title");
  if (!title) return;
  const { data, error } = await supabase
    .from("forms")
    .insert({ title, description: nullable(form, "description"), created_by: user.id })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/forms");
  redirect(`/forms/${data!.id}/edit`);
}

export async function updateFormMeta(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  const updates: Record<string, unknown> = {};
  if (form.has("title")) updates.title = s(form, "title");
  if (form.has("description")) updates.description = nullable(form, "description");
  if (form.has("thank_you_message"))
    updates.thank_you_message = nullable(form, "thank_you_message");
  if (form.has("is_published"))
    updates.is_published = form.get("is_published") === "on";
  await supabase.from("forms").update(updates).eq("id", id);
  revalidatePath(`/forms/${id}`);
  revalidatePath(`/forms/${id}/edit`);
  revalidatePath("/forms");
}

export async function deleteForm(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  if (!id) return;
  await supabase.from("forms").delete().eq("id", id);
  revalidatePath("/forms");
  redirect("/forms");
}

// ─── Fields ───
async function nextPosition(formId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("form_fields")
    .select("position")
    .eq("form_id", formId)
    .order("position", { ascending: false })
    .limit(1);
  return ((data?.[0]?.position as number) ?? -1) + 1;
}

async function uniqueFieldKey(
  formId: string,
  base: string,
  excludeId?: string,
): Promise<string> {
  const supabase = createClient();
  let candidate = base || "field";
  let i = 1;
  while (true) {
    const q = supabase
      .from("form_fields")
      .select("id")
      .eq("form_id", formId)
      .eq("field_key", candidate)
      .limit(1);
    const { data } = await q;
    const exists = (data ?? []).some((row) => row.id !== excludeId);
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}_${i}`;
  }
}

export async function addFormField(form: FormData) {
  const supabase = createClient();
  const formId = s(form, "form_id");
  const label = s(form, "label");
  const typeRaw = s(form, "type") as FormFieldType;
  if (!formId || !label || !VALID_TYPES.includes(typeRaw)) return;

  const fieldKey = await uniqueFieldKey(formId, slugifyKey(label));
  const optionsRaw = s(form, "options");
  const options =
    typeRaw === "select"
      ? optionsRaw.split("\n").map((o) => o.trim()).filter(Boolean)
      : null;

  await supabase.from("form_fields").insert({
    form_id: formId,
    position: await nextPosition(formId),
    field_key: fieldKey,
    label,
    type: typeRaw,
    options,
    required: form.get("required") === "on",
    placeholder: nullable(form, "placeholder"),
    helper: nullable(form, "helper"),
  });
  revalidatePath(`/forms/${formId}/edit`);
}

export async function updateFormField(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const formId = s(form, "form_id");
  const label = s(form, "label");
  const typeRaw = s(form, "type") as FormFieldType;
  if (!id || !formId || !label || !VALID_TYPES.includes(typeRaw)) return;

  const optionsRaw = s(form, "options");
  const options =
    typeRaw === "select"
      ? optionsRaw.split("\n").map((o) => o.trim()).filter(Boolean)
      : null;

  await supabase
    .from("form_fields")
    .update({
      label,
      type: typeRaw,
      options,
      required: form.get("required") === "on",
      placeholder: nullable(form, "placeholder"),
      helper: nullable(form, "helper"),
    })
    .eq("id", id);
  revalidatePath(`/forms/${formId}/edit`);
}

export async function deleteFormField(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const formId = s(form, "form_id");
  if (!id) return;
  await supabase.from("form_fields").delete().eq("id", id);
  if (formId) revalidatePath(`/forms/${formId}/edit`);
}

export async function duplicateFormField(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const formId = s(form, "form_id");
  if (!id || !formId) return;

  const { data: source } = await supabase
    .from("form_fields")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!source) return;

  const label = `${source.label} copy`;
  const fieldKey = await uniqueFieldKey(formId, slugifyKey(label));
  await supabase.from("form_fields").insert({
    form_id: formId,
    position: await nextPosition(formId),
    field_key: fieldKey,
    label,
    type: source.type,
    options: source.options,
    required: source.required,
    placeholder: source.placeholder,
    helper: source.helper,
  });
  revalidatePath(`/forms/${formId}/edit`);
}

export async function moveFormField(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const formId = s(form, "form_id");
  const direction = s(form, "direction"); // "up" | "down"
  if (!id || !formId) return;
  const { data: row } = await supabase
    .from("form_fields")
    .select("position")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  const op = direction === "up" ? "lt" : "gt";
  const order = direction === "up" ? "desc" : "asc";
  const { data: neighbor } = await supabase
    .from("form_fields")
    .select("id, position")
    .eq("form_id", formId)
    [op as "lt" | "gt"]("position", row.position)
    .order("position", { ascending: order === "asc" })
    .limit(1)
    .maybeSingle();
  if (!neighbor) return;
  // Swap positions
  await supabase
    .from("form_fields")
    .update({ position: neighbor.position })
    .eq("id", id);
  await supabase
    .from("form_fields")
    .update({ position: row.position })
    .eq("id", neighbor.id);
  revalidatePath(`/forms/${formId}/edit`);
}

// ─── Responses ───
export async function submitFormResponse(
  form: FormData,
): Promise<{ ok: true; slug?: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const formId = s(form, "form_id");
  if (!formId) return { ok: false, error: "Missing form id." };

  // Pull the live field schema so we only persist known keys & enforce required.
  const { data: meta } = await supabase
    .from("forms")
    .select("id, slug, title, is_published")
    .eq("id", formId)
    .maybeSingle();
  if (!meta || !meta.is_published) {
    return { ok: false, error: "This form is not accepting responses." };
  }
  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", formId)
    .order("position", { ascending: true });

  const data: Record<string, unknown> = {};
  for (const f of fields ?? []) {
    const raw = form.get(f.field_key);
    let value: unknown;
    if (f.type === "checkbox") {
      value = raw === "on" || raw === "true";
    } else if (typeof raw === "string") {
      value = raw.trim() || null;
    } else {
      value = null;
    }
    if (f.required && (value === null || value === false || value === "")) {
      return { ok: false, error: `"${f.label}" is required.` };
    }
    data[f.field_key] = value;
  }

  const { error } = await supabase
    .from("form_responses")
    .insert({ form_id: formId, data });
  if (error) {
    console.error("submitFormResponse failed", error);
    return { ok: false, error: error.message };
  }

  // Notify team (fire-and-forget)
  const siteUrl =
    process.env.NEXT_PUBLIC_CRM_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const formUrl = siteUrl ? `${siteUrl}/forms/${formId}/responses` : "";
  const detailRows = (fields ?? [])
    .map((f) => {
      const v = data[f.field_key];
      const display =
        v === null || v === undefined
          ? "—"
          : typeof v === "boolean"
            ? v ? "Yes" : "No"
            : String(v);
      return `<tr><td style="padding:6px 14px 6px 0;color:#6b665e;font-size:13px;">${escapeHtml(
        f.label,
      )}</td><td style="padding:6px 0;font-size:13px;color:#1a1814;">${escapeHtml(
        display,
      )}</td></tr>`;
    })
    .join("");
  await sendNotificationEmail({
    subject: `New response — ${meta.title}`,
    html: `
      <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1814;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross</div>
        <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:6px 0 16px;letter-spacing:-0.01em;">New response — ${escapeHtml(meta.title)}</h1>
        <table style="border-collapse:collapse;">${detailRows}</table>
        ${formUrl ? `<div style="margin-top:24px;"><a href="${formUrl}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">View responses</a></div>` : ""}
      </div>
    `,
    text: `New response — ${meta.title}\n\n` +
      (fields ?? [])
        .map((f) => {
          const v = data[f.field_key];
          return `${f.label}: ${v === null || v === undefined ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : v}`;
        })
        .join("\n") +
      (formUrl ? `\n\n${formUrl}` : ""),
  });

  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/forms/${formId}/responses`);
  return { ok: true, slug: meta.slug };
}

export async function deleteFormResponse(form: FormData) {
  const supabase = createClient();
  const id = s(form, "id");
  const formId = s(form, "form_id");
  if (!id) return;
  await supabase.from("form_responses").delete().eq("id", id);
  if (formId) {
    revalidatePath(`/forms/${formId}`);
    revalidatePath(`/forms/${formId}/responses`);
  }
}
