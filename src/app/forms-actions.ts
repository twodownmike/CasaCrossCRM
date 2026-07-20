"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes, randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, sendNotificationEmail, escapeHtml } from "@/lib/notify";
import { isFormFieldVisible } from "@/lib/form-conditions";
import type {
  FormConditionOperator,
  FormField,
  FormFieldType,
  FormResponseStatus,
} from "@/lib/types";

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

function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    process.env.NEXT_PUBLIC_EVENTS_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  );
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
  "multiselect",
  "checkbox",
  "section",
];

const VALID_CONDITION_OPERATORS: FormConditionOperator[] = [
  "equals",
  "not_equals",
  "contains",
  "not_empty",
];

const VALID_RESPONSE_STATUSES: FormResponseStatus[] = [
  "new",
  "reviewing",
  "follow_up",
  "qualified",
  "closed",
];

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isAnswerableField(field: { type: string }) {
  return field.type !== "section";
}

function displayFormValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
  return String(value);
}

function findRespondentEmail(
  fields: FormField[],
  data: Record<string, unknown>,
) {
  const emailField = fields.find(
    (field) =>
      field.type === "email" &&
      isFormFieldVisible(field, fields, data) &&
      typeof data[field.field_key] === "string",
  );
  const email = emailField ? String(data[emailField.field_key]).trim() : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function recordFormAnalyticsEvent(
  formId: string,
  eventType: "view" | "start",
  sessionId: string,
) {
  if (!isUuid(formId) || !isUuid(sessionId)) return;
  const supabase = createClient();
  const { error } = await supabase.rpc("record_form_analytics_event", {
    form_id_value: formId,
    event_type_value: eventType,
    session_id_value: sessionId,
  });
  if (error) console.error("recordFormAnalyticsEvent failed", error);
}

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
    .insert({
      title,
      description: nullable(form, "description"),
      created_by: user.id,
    })
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
  if (form.has("description"))
    updates.description = nullable(form, "description");
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

async function conditionValues(
  form: FormData,
  formId: string,
  type: FormFieldType,
  targetId?: string,
) {
  const emptyCondition = {
    show_if_previous_yes: false,
    condition_field_id: null,
    condition_operator: null,
    condition_value: null,
  };
  if (type === "section") return emptyCondition;

  const conditionFieldId = s(form, "condition_field_id");
  const operator = s(form, "condition_operator") as FormConditionOperator;
  if (
    !conditionFieldId ||
    !VALID_CONDITION_OPERATORS.includes(operator) ||
    conditionFieldId === targetId
  ) {
    return emptyCondition;
  }

  const supabase = createClient();
  const { data: source } = await supabase
    .from("form_fields")
    .select("id, position, type")
    .eq("id", conditionFieldId)
    .eq("form_id", formId)
    .maybeSingle();
  if (!source || source.type === "section") return emptyCondition;

  if (targetId) {
    const { data: target } = await supabase
      .from("form_fields")
      .select("position")
      .eq("id", targetId)
      .eq("form_id", formId)
      .maybeSingle();
    if (!target || source.position >= target.position) return emptyCondition;
  }

  const conditionValue =
    operator === "not_empty" ? null : nullable(form, "condition_value");
  if (operator !== "not_empty" && !conditionValue) return emptyCondition;

  return {
    show_if_previous_yes: false,
    condition_field_id: source.id,
    condition_operator: operator,
    condition_value: conditionValue,
  };
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
    typeRaw === "select" || typeRaw === "multiselect"
      ? optionsRaw
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;
  const condition = await conditionValues(form, formId, typeRaw);

  await supabase.from("form_fields").insert({
    form_id: formId,
    position: await nextPosition(formId),
    field_key: fieldKey,
    label,
    type: typeRaw,
    options,
    required: typeRaw !== "section" && form.get("required") === "on",
    placeholder: typeRaw === "section" ? null : nullable(form, "placeholder"),
    helper: nullable(form, "helper"),
    ...condition,
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
    typeRaw === "select" || typeRaw === "multiselect"
      ? optionsRaw
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;
  const condition = await conditionValues(form, formId, typeRaw, id);

  await supabase
    .from("form_fields")
    .update({
      label,
      type: typeRaw,
      options,
      required: typeRaw !== "section" && form.get("required") === "on",
      placeholder: typeRaw === "section" ? null : nullable(form, "placeholder"),
      helper: nullable(form, "helper"),
      ...condition,
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
    show_if_previous_yes: source.show_if_previous_yes,
    condition_field_id: source.condition_field_id,
    condition_operator: source.condition_operator,
    condition_value: source.condition_value,
  });
  revalidatePath(`/forms/${formId}/edit`);
}

export async function reorderFormFields(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const formId = s(form, "form_id");
  const orderedIds = form
    .getAll("field_ids[]")
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!formId || orderedIds.length === 0) {
    return { ok: false, error: "Missing form order." };
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { ok: false, error: "The form order contains duplicate fields." };
  }

  const { data: existing, error: readError } = await supabase
    .from("form_fields")
    .select("id, condition_field_id")
    .eq("form_id", formId);
  if (readError) return { ok: false, error: readError.message };

  const existingIds = new Set((existing ?? []).map((field) => field.id));
  if (
    existingIds.size !== orderedIds.length ||
    orderedIds.some((id) => !existingIds.has(id))
  ) {
    return { ok: false, error: "The form changed. Refresh and try again." };
  }

  const results = await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from("form_fields").update({ position }).eq("id", id),
    ),
  );
  const updateError = results.find((result) => result.error)?.error;
  if (updateError) return { ok: false, error: updateError.message };

  const positions = new Map(orderedIds.map((id, position) => [id, position]));
  const invalidConditions = (existing ?? []).filter((field) => {
    if (!field.condition_field_id) return false;
    const sourcePosition = positions.get(field.condition_field_id);
    const fieldPosition = positions.get(field.id);
    return (
      sourcePosition === undefined ||
      fieldPosition === undefined ||
      sourcePosition >= fieldPosition
    );
  });
  const conditionResults = await Promise.all(
    invalidConditions.map((field) =>
      supabase
        .from("form_fields")
        .update({
          condition_field_id: null,
          condition_operator: null,
          condition_value: null,
        })
        .eq("id", field.id),
    ),
  );
  const conditionError = conditionResults.find((result) => result.error)?.error;
  if (conditionError) return { ok: false, error: conditionError.message };

  revalidatePath(`/forms/${formId}/edit`);
  return { ok: true };
}

// ─── Responses ───
export async function submitFormResponse(
  form: FormData,
): Promise<{ ok: true; slug?: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const formId = s(form, "form_id");
  const assignmentToken = s(form, "assignment_token");
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

  const typedFields = (fields ?? []) as FormField[];
  const data: Record<string, unknown> = {};
  for (const f of typedFields) {
    if (!isAnswerableField(f)) continue;
    const isVisible = isFormFieldVisible(f, typedFields, data);
    if (!isVisible) {
      data[f.field_key] = null;
      continue;
    }
    const raw = form.get(f.field_key);
    let value: unknown;
    if (f.type === "checkbox") {
      value = raw === "on" || raw === "true";
    } else if (f.type === "multiselect") {
      value = form
        .getAll(f.field_key)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (typeof raw === "string") {
      value = raw.trim() || null;
    } else {
      value = null;
    }
    if (
      f.required &&
      (value === null ||
        value === false ||
        value === "" ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return { ok: false, error: `"${f.label}" is required.` };
    }
    data[f.field_key] = value;
  }

  const responseId = randomUUID();
  const { error } = await supabase
    .from("form_responses")
    .insert({ id: responseId, form_id: formId, data });
  if (error) {
    console.error("submitFormResponse failed", error);
    return { ok: false, error: error.message };
  }

  if (assignmentToken) {
    const { error: assignmentError } = await supabase.rpc(
      "complete_form_assignment",
      {
        assignment_token: assignmentToken,
        response_id_value: responseId,
      },
    );
    if (assignmentError) {
      console.error("complete_form_assignment failed", assignmentError);
    }
  }

  // Notify team (fire-and-forget)
  const siteUrl =
    process.env.NEXT_PUBLIC_CRM_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const formUrl = siteUrl ? `${siteUrl}/forms/${formId}/responses` : "";
  const detailRows = (fields ?? [])
    .filter(isAnswerableField)
    .map((f) => {
      const v = data[f.field_key];
      const display = displayFormValue(v);
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
    text:
      `New response — ${meta.title}\n\n` +
      (fields ?? [])
        .filter(isAnswerableField)
        .map((f) => {
          const v = data[f.field_key];
          return `${f.label}: ${displayFormValue(v)}`;
        })
        .join("\n") +
      (formUrl ? `\n\n${formUrl}` : ""),
  });

  const respondentEmail = findRespondentEmail(typedFields, data);
  if (respondentEmail) {
    await sendEmail({
      to: respondentEmail,
      subject: `We received your ${meta.title} response`,
      html: `
        <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#1a1814;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross Events</div>
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:8px 0 16px;line-height:1.2;">Your response is in.</h1>
          <p style="font-size:15px;line-height:1.65;color:#4f4941;margin:0 0 16px;">Thank you for completing <strong>${escapeHtml(meta.title)}</strong>. We received your submission successfully and our team will review it.</p>
          <div style="border-top:1px solid #e8e2d9;margin-top:24px;padding-top:18px;font-size:13px;line-height:1.6;color:#777168;">There is nothing else you need to do right now. Keep this email as confirmation of your submission.</div>
        </div>
      `,
      text: `Your response is in.\n\nThank you for completing ${meta.title}. We received your submission successfully and our team will review it. There is nothing else you need to do right now.`,
    });
  }

  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/forms/${formId}/responses`);
  revalidatePath("/portal");
  return { ok: true, slug: meta.slug };
}

export async function updateFormResponseWorkflow(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to update this response." };

  const id = s(form, "id");
  const formId = s(form, "form_id");
  const status = s(form, "status") as FormResponseStatus;
  const assignedTo = nullable(form, "assigned_to");
  if (!id || !formId || !VALID_RESPONSE_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid workflow update." };
  }
  if (assignedTo && !isUuid(assignedTo)) {
    return { ok: false, error: "Invalid owner." };
  }
  if (assignedTo) {
    const { data: owner } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("user_id", assignedTo)
      .maybeSingle();
    if (!owner) return { ok: false, error: "Choose a current team member." };
  }

  const tags = s(form, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
  const { data: updated, error } = await supabase
    .from("form_responses")
    .update({
      status,
      assigned_to: assignedTo,
      internal_notes: nullable(form, "internal_notes"),
      tags,
    })
    .eq("id", id)
    .eq("form_id", formId)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Response not found." };

  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/forms/${formId}/responses`);
  revalidatePath(`/forms/${formId}/analytics`);
  return { ok: true };
}

export async function bulkSendForms(
  form: FormData,
): Promise<
  | { ok: true; sent: number; assigned: number; skipped: number }
  | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const eventId = s(form, "event_id");
  const formId = s(form, "form_id");
  const participantIds = form
    .getAll("participant_ids[]")
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!eventId || !formId || participantIds.length === 0) {
    return { ok: false, error: "Choose a form and at least one participant." };
  }

  const [{ data: formRow }, { data: event }, { data: participants }] =
    await Promise.all([
      supabase
        .from("forms")
        .select("id, title, description, is_published")
        .eq("id", formId)
        .maybeSingle(),
      supabase
        .from("events")
        .select("id, name, date")
        .eq("id", eventId)
        .maybeSingle(),
      supabase
        .from("participants")
        .select("id, person_id, people(id, name, email)")
        .eq("event_id", eventId)
        .in("id", participantIds),
    ]);
  if (!formRow || !formRow.is_published) {
    return { ok: false, error: "Publish the form before sending it." };
  }
  if (!event) return { ok: false, error: "Event not found." };

  let assigned = 0;
  let sent = 0;
  let skipped = 0;
  const siteUrl = publicSiteUrl();

  for (const participant of participants ?? []) {
    const person = Array.isArray(participant.people)
      ? participant.people[0]
      : participant.people;
    const token = randomBytes(24).toString("base64url");
    const { data: assignment, error } = await supabase
      .from("form_assignments")
      .upsert(
        {
          form_id: formId,
          event_id: eventId,
          participant_id: participant.id,
          person_id: participant.person_id,
          share_token: token,
          sent_at: new Date().toISOString(),
          assigned_by: user.id,
        },
        { onConflict: "form_id,participant_id" },
      )
      .select("share_token")
      .single();
    if (error) {
      skipped += 1;
      console.error("bulkSendForms assignment failed", error);
      continue;
    }
    assigned += 1;

    const email = person?.email;
    if (!email || !siteUrl) {
      skipped += 1;
      continue;
    }
    const formUrl = `${siteUrl}/fa/${assignment?.share_token || token}`;
    const recipientName = person?.name || email;
    await sendEmail({
      to: email,
      subject: `${formRow.title} — ${event.name}`,
      html: `
        <div style="font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1814;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a948a;font-weight:500;">Casa Cross</div>
          <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;margin:6px 0 12px;letter-spacing:-0.01em;">${escapeHtml(formRow.title)}</h1>
          <p style="font-size:14px;line-height:1.55;color:#4f4941;">Hi ${escapeHtml(recipientName)}, please complete this form for <strong>${escapeHtml(event.name)}</strong>.</p>
          ${formRow.description ? `<p style="font-size:14px;line-height:1.55;color:#6b665e;">${escapeHtml(formRow.description)}</p>` : ""}
          <div style="margin-top:24px;"><a href="${formUrl}" style="display:inline-block;background:#1a1814;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:500;">Open form</a></div>
        </div>
      `,
      text: `Hi ${recipientName}, please complete ${formRow.title} for ${event.name}.\n\n${formUrl}`,
    });
    sent += 1;
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/portal");
  revalidatePath(`/portal/events/${eventId}`);
  return { ok: true, sent, assigned, skipped };
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
