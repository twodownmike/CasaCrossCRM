"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { normalizeFormFieldOptions } from "@/lib/form-fields";
import {
  addFormField,
  updateFormField,
  deleteFormField,
  duplicateFormField,
  moveFormField,
} from "@/app/forms-actions";
import {
  FIELD_TYPE_LABELS,
  type FormField,
  type FormFieldType,
} from "@/lib/types";

export function FieldList({
  formId,
  fields,
}: {
  formId: string;
  fields: FormField[];
}) {
  return (
    <div className="card elev">
      {fields.map((f, i) => (
        <FieldRow
          key={f.id}
          field={f}
          formId={formId}
          isFirst={i === 0}
          isLast={i === fields.length - 1}
          previousQuestionLabel={
            fields
              .slice(0, i)
              .reverse()
              .find((candidate) => candidate.type !== "section")?.label
          }
        />
      ))}
    </div>
  );
}

function FieldRow({
  field,
  formId,
  isFirst,
  isLast,
  previousQuestionLabel,
}: {
  field: FormField;
  formId: string;
  isFirst: boolean;
  isLast: boolean;
  previousQuestionLabel?: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [pending, start] = useTransition();

  function move(direction: "up" | "down") {
    const f = new FormData();
    f.set("id", field.id);
    f.set("form_id", formId);
    f.set("direction", direction);
    start(async () => {
      await moveFormField(f);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete field "${field.label}"?`)) return;
    const f = new FormData();
    f.set("id", field.id);
    f.set("form_id", formId);
    start(async () => {
      await deleteFormField(f);
      router.refresh();
    });
  }

  function duplicate() {
    const f = new FormData();
    f.set("id", field.id);
    f.set("form_id", formId);
    start(async () => {
      await duplicateFormField(f);
      router.refresh();
    });
  }

  return (
    <div
      className="card-row"
      style={{
        cursor: "default",
        alignItems: "flex-start",
        opacity: pending ? 0.6 : 1,
      }}
    >
      <span
        className="pill"
        style={{
          background: "var(--hair-2)",
          color: "var(--ink-3)",
          marginTop: 2,
        }}
      >
        {FIELD_TYPE_LABELS[field.type]}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span>{field.label}</span>
          {field.required && (
            <span
              className="muted"
              style={{ fontSize: 11, color: "var(--terracotta)" }}
            >
              required
            </span>
          )}
          {field.show_if_previous_yes && (
            <span className="muted" style={{ fontSize: 11 }}>
              conditional
            </span>
          )}
        </div>
        {field.helper && (
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {field.helper}
          </div>
        )}
        {(field.type === "select" || field.type === "multiselect") && (
          <OptionCount options={field.options} />
        )}
        {field.show_if_previous_yes && previousQuestionLabel && (
          <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 4 }}>
            Shown when “{previousQuestionLabel}” is Yes
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button
          className="icon-btn"
          aria-label="Move up"
          onClick={() => move("up")}
          disabled={isFirst || pending}
          style={{ opacity: isFirst ? 0.4 : 1 }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
        <button
          className="icon-btn"
          aria-label="Move down"
          onClick={() => move("down")}
          disabled={isLast || pending}
          style={{ opacity: isLast ? 0.4 : 1 }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          className="icon-btn"
          aria-label="Edit"
          onClick={() => setEditOpen(true)}
        >
          <Icon.doc />
        </button>
        <button
          className="icon-btn"
          aria-label="Duplicate"
          onClick={duplicate}
          disabled={pending}
        >
          <Icon.plus />
        </button>
        <button
          className="icon-btn"
          aria-label="Delete"
          onClick={remove}
          style={{ color: "var(--terracotta)" }}
        >
          <Icon.close />
        </button>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit field"
      >
        <FieldForm
          formId={formId}
          field={field}
          previousQuestionLabel={previousQuestionLabel}
          onSaved={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}

export function FormPreview({
  title,
  description,
  fields,
}: {
  title: string;
  description: string | null;
  fields: FormField[];
}) {
  return (
    <div
      className="card elev"
      style={{
        padding: 18,
        background: "var(--paper)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 21,
          lineHeight: 1.2,
          color: "var(--ink)",
          marginBottom: description ? 6 : 16,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--ink-3)",
            marginBottom: 16,
          }}
        >
          {description}
        </div>
      )}
      {fields.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--hair)",
            borderRadius: "var(--r-2)",
            color: "var(--ink-4)",
            fontSize: 13,
            padding: 18,
            textAlign: "center",
          }}
        >
          Add fields to see the public form preview.
        </div>
      ) : (
        <div className="form-grid">
          {fields.map((field) => (
            <PreviewField key={field.id} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  if (field.type === "section") {
    return (
      <div
        style={{
          borderTop: "1px solid var(--hair)",
          paddingTop: 18,
          marginTop: 6,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--serif)",
            fontSize: 18,
            fontWeight: 500,
            margin: 0,
          }}
        >
          {field.label}
        </h3>
        {field.helper && <PreviewHelper>{field.helper}</PreviewHelper>}
      </div>
    );
  }

  const label = (
    <label className="form-label">
      {field.label}
      {field.required && (
        <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>
      )}
    </label>
  );

  if (field.type === "textarea") {
    return (
      <div>
        {label}
        <textarea
          className="input textarea"
          disabled
          placeholder={field.placeholder || undefined}
        />
        {field.helper && <PreviewHelper>{field.helper}</PreviewHelper>}
      </div>
    );
  }

  if (field.type === "select") {
    const options = normalizeFormFieldOptions(field.options);
    return (
      <div>
        {label}
        <select className="input" disabled defaultValue="">
          <option value="" disabled>
            Pick one
          </option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        {field.helper && <PreviewHelper>{field.helper}</PreviewHelper>}
      </div>
    );
  }

  if (field.type === "multiselect") {
    const options = normalizeFormFieldOptions(field.options);
    return (
      <div>
        {label}
        <div className="input" style={{ color: "var(--ink-4)" }}>
          Select one or more ({options.length} options)
        </div>
        {field.helper && <PreviewHelper>{field.helper}</PreviewHelper>}
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
        }}
      >
        <input type="checkbox" disabled style={{ marginTop: 2 }} />
        <span style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {field.label}
            {field.required && (
              <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>
                *
              </span>
            )}
          </span>
          {field.helper && <PreviewHelper>{field.helper}</PreviewHelper>}
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
      {label}
      <input
        className="input"
        disabled
        type={inputType[field.type] || "text"}
        placeholder={field.placeholder || undefined}
      />
      {field.helper && <PreviewHelper>{field.helper}</PreviewHelper>}
    </div>
  );
}

function PreviewHelper({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="muted"
      style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
    >
      {children}
    </p>
  );
}

export function FieldForm({
  formId,
  field,
  previousQuestionLabel,
  onSaved,
}: {
  formId: string;
  field?: FormField;
  previousQuestionLabel?: string;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(field?.label || "");
  const [type, setType] = useState<FormFieldType>(field?.type || "text");
  const [required, setRequired] = useState<boolean>(field?.required || false);
  const [showIfPreviousYes, setShowIfPreviousYes] = useState(
    field?.show_if_previous_yes || false,
  );
  const [placeholder, setPlaceholder] = useState(field?.placeholder || "");
  const [helper, setHelper] = useState(field?.helper || "");
  const [options, setOptions] = useState(
    normalizeFormFieldOptions(field?.options).join("\n"),
  );
  const [pending, start] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const f = new FormData();
    if (field) f.set("id", field.id);
    f.set("form_id", formId);
    f.set("label", label);
    f.set("type", type);
    if (type !== "section" && required) f.set("required", "on");
    if (type !== "section" && previousQuestionLabel && showIfPreviousYes) {
      f.set("show_if_previous_yes", "on");
    }
    f.set("placeholder", placeholder);
    f.set("helper", helper);
    if (type === "select" || type === "multiselect") f.set("options", options);
    start(async () => {
      const action = field ? updateFormField : addFormField;
      await action(f);
      onSaved();
    });
  }

  return (
    <form onSubmit={save} className="form-grid" style={{ paddingTop: 8 }}>
      <div>
        <label className="form-label">
          {type === "section" ? "Section title" : "Label"}
        </label>
        <input
          required
          autoFocus
          className="input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={type === "section" ? "Contact details" : "Phone number"}
        />
      </div>
      <div>
        <label className="form-label">Type</label>
        <select
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value as FormFieldType)}
        >
          {(
            Object.entries(FIELD_TYPE_LABELS) as Array<[FormFieldType, string]>
          ).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      {(type === "select" || type === "multiselect") && (
        <div>
          <label className="form-label">Options (one per line)</label>
          <textarea
            className="input textarea"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder={"Yes\nNo\nMaybe"}
          />
        </div>
      )}
      {type !== "checkbox" && type !== "section" && (
        <div>
          <label className="form-label">Placeholder</label>
          <input
            className="input"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
          />
        </div>
      )}
      <div>
        <label className="form-label">
          {type === "section" ? "Section description" : "Helper text"}
        </label>
        <input
          className="input"
          value={helper}
          onChange={(e) => setHelper(e.target.value)}
          placeholder={
            type === "section"
              ? "Optional introduction for this section"
              : "Small note shown under the field"
          }
        />
      </div>
      {type !== "section" && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            border: "1px solid var(--hair)",
            borderRadius: "var(--r-2)",
            background: "var(--paper)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Required</span>
        </label>
      )}
      {type !== "section" && (
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: 12,
            border: "1px solid var(--hair)",
            borderRadius: "var(--r-2)",
            background: "var(--paper)",
            cursor: previousQuestionLabel ? "pointer" : "not-allowed",
            opacity: previousQuestionLabel ? 1 : 0.55,
          }}
        >
          <input
            type="checkbox"
            checked={showIfPreviousYes}
            disabled={!previousQuestionLabel}
            onChange={(e) => setShowIfPreviousYes(e.target.checked)}
          />
          <span>
            <span style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
              Show only after a Yes answer
            </span>
            <span
              style={{
                display: "block",
                fontSize: 11.5,
                color: "var(--ink-3)",
                marginTop: 3,
              }}
            >
              {previousQuestionLabel
                ? `Uses the previous question: “${previousQuestionLabel}”`
                : "Add an answerable question before this field."}
            </span>
          </span>
        </label>
      )}
      <div className="sheet-footer">
        <button className="btn primary block" type="submit" disabled={pending}>
          {pending ? "Saving…" : field ? "Save field" : "Add field"}
        </button>
      </div>
    </form>
  );
}

function OptionCount({ options }: { options: unknown }) {
  const count = normalizeFormFieldOptions(options).length;
  return (
    <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 4 }}>
      {count} option{count === 1 ? "" : "s"}
    </div>
  );
}
