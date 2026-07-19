"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitFormResponse } from "@/app/forms-actions";
import { normalizeFormFieldOptions } from "@/lib/form-fields";
import type { FormField } from "@/lib/types";

export function PublicFormRenderer({
  formId,
  slug,
  fields,
  assignmentToken,
}: {
  formId: string;
  slug: string;
  fields: FormField[];
  assignmentToken?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  function updateAnswers(e: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget);
    const nextAnswers: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.type === "section") continue;
      if (field.type === "multiselect") {
        nextAnswers[field.field_key] = formData.getAll(field.field_key);
      } else if (field.type === "checkbox") {
        nextAnswers[field.field_key] = formData.has(field.field_key);
      } else {
        nextAnswers[field.field_key] = formData.get(field.field_key);
      }
    }
    setAnswers(nextAnswers);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    f.set("form_id", formId);
    if (assignmentToken) f.set("assignment_token", assignmentToken);
    start(async () => {
      const result = await submitFormResponse(f);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/f/${slug}/thanks`);
    });
  }

  if (fields.length === 0) {
    return (
      <div className="muted" style={{ fontSize: 13, marginTop: 18 }}>
        This form doesn&apos;t have any fields yet.
      </div>
    );
  }

  return (
    <form onSubmit={submit} onChange={updateAnswers} className="form-grid">
      {fields.map((field, index) => {
        const previousField = fields
          .slice(0, index)
          .reverse()
          .find((candidate) => candidate.type !== "section");
        const visible =
          !field.show_if_previous_yes ||
          !previousField ||
          isYesAnswer(answers[previousField.field_key]);
        return <FieldInput key={field.id} field={field} visible={visible} />;
      })}
      {error && <div className="notice warn">{error}</div>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}

function isYesAnswer(value: unknown) {
  if (value === true) return true;
  if (Array.isArray(value)) {
    return value.some(
      (item) => typeof item === "string" && item.trim().toLowerCase() === "yes",
    );
  }
  return typeof value === "string" && value.trim().toLowerCase() === "yes";
}

function FieldInput({
  field,
  visible,
}: {
  field: FormField;
  visible: boolean;
}) {
  if (!visible) return null;

  if (field.type === "section") {
    return (
      <section
        style={{
          borderTop: "1px solid var(--hair)",
          paddingTop: 20,
          marginTop: 8,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: 21,
            fontWeight: 500,
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {field.label}
        </h2>
        {field.helper && (
          <p
            className="muted"
            style={{ fontSize: 13, lineHeight: 1.5, margin: "6px 0 0" }}
          >
            {field.helper}
          </p>
        )}
      </section>
    );
  }

  const required = field.required || undefined;
  if (field.type === "textarea") {
    return (
      <div>
        <label className="form-label">
          {field.label}
          {field.required && <RequiredMark />}
        </label>
        <textarea
          name={field.field_key}
          className="input textarea"
          required={required}
          placeholder={field.placeholder || undefined}
        />
        {field.helper && <Helper>{field.helper}</Helper>}
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="form-label">
          {field.label}
          {field.required && <RequiredMark />}
        </label>
        <select
          name={field.field_key}
          className="input"
          required={required}
          defaultValue=""
        >
          <option value="" disabled>
            Pick one
          </option>
          {normalizeFormFieldOptions(field.options).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {field.helper && <Helper>{field.helper}</Helper>}
      </div>
    );
  }
  if (field.type === "multiselect") {
    return <MultiSelectInput field={field} />;
  }
  if (field.type === "checkbox") {
    return (
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: 12,
          border: "1px solid var(--hair)",
          borderRadius: "var(--r-2)",
          background: "var(--paper)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          name={field.field_key}
          required={required}
          style={{ marginTop: 2 }}
        />
        <span style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {field.label}
            {field.required && <RequiredMark />}
          </span>
          {field.helper && (
            <span
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 4,
              }}
            >
              {field.helper}
            </span>
          )}
        </span>
      </label>
    );
  }
  const inputType: Record<string, string> = {
    text: "text",
    email: "email",
    phone: "tel",
    url: "url",
    number: "number",
    date: "date",
  };
  return (
    <div>
      <label className="form-label">
        {field.label}
        {field.required && <RequiredMark />}
      </label>
      <input
        type={inputType[field.type] || "text"}
        name={field.field_key}
        className="input"
        required={required}
        placeholder={field.placeholder || undefined}
      />
      {field.helper && <Helper>{field.helper}</Helper>}
    </div>
  );
}

function MultiSelectInput({ field }: { field: FormField }) {
  const [selected, setSelected] = useState<string[]>([]);
  const options = normalizeFormFieldOptions(field.options);

  return (
    <div>
      <label className="form-label">
        {field.label}
        {field.required && <RequiredMark />}
      </label>
      <details
        aria-required={field.required}
        style={{
          border: "1px solid var(--hair)",
          borderRadius: "var(--r-2)",
          background: "var(--paper)",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            padding: "12px 14px",
            fontSize: 14,
            color: selected.length ? "var(--ink-2)" : "var(--ink-4)",
          }}
        >
          {selected.length === 0
            ? "Select one or more"
            : selected.length === 1
              ? selected[0]
              : `${selected.length} selected`}
        </summary>
        <div style={{ borderTop: "1px solid var(--hair)", padding: 8 }}>
          {options.map((option) => (
            <label
              key={option}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 8px",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                name={field.field_key}
                value={option}
                checked={selected.includes(option)}
                onChange={(e) =>
                  setSelected((current) =>
                    e.target.checked
                      ? [...current, option]
                      : current.filter((item) => item !== option),
                  )
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </details>
      {field.helper && <Helper>{field.helper}</Helper>}
    </div>
  );
}

function RequiredMark() {
  return <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>;
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="muted"
      style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
    >
      {children}
    </p>
  );
}
