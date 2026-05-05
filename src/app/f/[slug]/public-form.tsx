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
}: {
  formId: string;
  slug: string;
  fields: FormField[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    f.set("form_id", formId);
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
    <form onSubmit={submit} className="form-grid">
      {fields.map((field) => (
        <FieldInput key={field.id} field={field} />
      ))}
      {error && <div className="notice warn">{error}</div>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}

function FieldInput({ field }: { field: FormField }) {
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

function RequiredMark() {
  return (
    <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>
  );
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
