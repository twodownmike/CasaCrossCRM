"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitFormResponse } from "@/app/forms-actions";
import { isFormFieldVisible } from "@/lib/form-conditions";
import { normalizeFormFieldOptions } from "@/lib/form-fields";
import type { FormField } from "@/lib/types";

type FormStep = {
  id: string;
  title: string;
  description: string | null;
  named: boolean;
  fields: FormField[];
};

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
  const formRef = useRef<HTMLFormElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [draftReady, setDraftReady] = useState(false);
  const steps = useMemo(() => buildFormSteps(fields), [fields]);
  const reviewStepIndex = steps.length;
  const currentStepIndex = Math.min(stepIndex, reviewStepIndex);
  const isReviewStep = currentStepIndex === reviewStepIndex;
  const currentStep = isReviewStep ? undefined : steps[currentStepIndex];
  const totalSteps = steps.length + 1;
  const storageKey = `casa-cross-form-draft:${assignmentToken || formId}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          answers?: Record<string, unknown>;
          stepIndex?: number;
        };
        if (parsed.answers && typeof parsed.answers === "object") {
          setAnswers(parsed.answers);
        }
        if (
          typeof parsed.stepIndex === "number" &&
          Number.isInteger(parsed.stepIndex) &&
          parsed.stepIndex >= 0
        ) {
          setStepIndex(parsed.stepIndex);
        }
      }
    } catch (draftError) {
      console.warn("Unable to restore form draft", draftError);
    } finally {
      setDraftReady(true);
    }
  }, [storageKey]);

  function persistAnswers(
    nextAnswers: Record<string, unknown>,
    nextStepIndex = stepIndex,
  ) {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers: nextAnswers,
          stepIndex: nextStepIndex,
          updatedAt: Date.now(),
        }),
      );
    } catch (draftError) {
      console.warn("Unable to save form draft", draftError);
    }
  }

  function storeAnswers(nextAnswers: Record<string, unknown>) {
    setAnswers(nextAnswers);
    persistAnswers(nextAnswers);
  }

  function updateAnswers(e: React.FormEvent<HTMLFormElement>) {
    const target = e.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    if (!target.name) return;
    const field = fields.find(
      (candidate) => candidate.field_key === target.name,
    );
    if (!field) return;
    setError(null);
    const formData = new FormData(e.currentTarget);
    const value =
      field.type === "multiselect"
        ? formData.getAll(field.field_key)
        : field.type === "checkbox"
          ? (target as HTMLInputElement).checked
          : target.value;
    setAnswers((current) => {
      const nextAnswers = { ...current, [field.field_key]: value };
      persistAnswers(nextAnswers);
      return nextAnswers;
    });
  }

  function captureCurrentStepAnswers() {
    const formElement = formRef.current;
    if (!formElement || !currentStep) return answers;
    const formData = new FormData(formElement);
    const nextAnswers = { ...answers };
    for (const field of currentStep.fields) {
      if (field.type === "multiselect") {
        nextAnswers[field.field_key] = formData.getAll(field.field_key);
      } else if (field.type === "checkbox") {
        nextAnswers[field.field_key] = formData.has(field.field_key);
      } else {
        const value = formData.get(field.field_key);
        nextAnswers[field.field_key] = typeof value === "string" ? value : "";
      }
    }
    storeAnswers(nextAnswers);
    return nextAnswers;
  }

  function validateCurrentStep(latestAnswers: Record<string, unknown>) {
    if (!formRef.current?.reportValidity()) return false;
    const missingMultiSelect = currentStep?.fields.find((field) => {
      const value = latestAnswers[field.field_key];
      return (
        field.type === "multiselect" &&
        field.required &&
        isFormFieldVisible(field, fields, latestAnswers) &&
        (!Array.isArray(value) || value.length === 0)
      );
    });
    if (missingMultiSelect) {
      setError(`“${missingMultiSelect.label}” is required.`);
      return false;
    }
    setError(null);
    return true;
  }

  function goToStep(
    nextStep: number,
    latestAnswers: Record<string, unknown> = answers,
  ) {
    setStepIndex(nextStep);
    persistAnswers(latestAnswers, nextStep);
    requestAnimationFrame(() =>
      progressRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const latestAnswers = isReviewStep ? answers : captureCurrentStepAnswers();
    if (!isReviewStep && !validateCurrentStep(latestAnswers)) return;
    if (!isReviewStep) {
      goToStep(currentStepIndex + 1, latestAnswers);
      return;
    }
    const f = new FormData();
    for (const field of fields) {
      if (field.type === "section") continue;
      const value = latestAnswers[field.field_key];
      if (field.type === "multiselect" && Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string") f.append(field.field_key, item);
        });
      } else if (field.type === "checkbox") {
        if (value === true) f.set(field.field_key, "on");
      } else if (typeof value === "string") {
        f.set(field.field_key, value);
      }
    }
    f.set("form_id", formId);
    if (assignmentToken) f.set("assignment_token", assignmentToken);
    start(async () => {
      const result = await submitFormResponse(f);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.localStorage.removeItem(storageKey);
      router.push(`/f/${slug}/thanks`);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || isReviewStep) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.tagName === "BUTTON" ||
      target.closest("details") ||
      (target instanceof HTMLInputElement && target.type === "checkbox")
    ) {
      return;
    }
    e.preventDefault();
    formRef.current?.requestSubmit();
  }

  if (fields.length === 0) {
    return (
      <div className="muted" style={{ fontSize: 13, marginTop: 18 }}>
        This form doesn&apos;t have any fields yet.
      </div>
    );
  }

  if (!draftReady || (!currentStep && !isReviewStep)) {
    return <div style={{ minHeight: 180 }} aria-hidden="true" />;
  }

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      onChange={updateAnswers}
      onKeyDown={handleKeyDown}
      className="form-grid public-stepped-form"
    >
      <div ref={progressRef} className="public-form-progress">
        {totalSteps > 1 && (
          <>
            <div className="public-form-progress-meta">
              <span>
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className="public-form-progress-track"
              role="progressbar"
              aria-label="Form progress"
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-valuenow={currentStepIndex + 1}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
        {isReviewStep ? (
          <div className="public-form-step-heading">
            <h2>Review your answers</h2>
            <p>Check everything before sending your response.</p>
          </div>
        ) : currentStep?.named ? (
          <div className="public-form-step-heading">
            <h2>{currentStep.title}</h2>
            {currentStep.description && <p>{currentStep.description}</p>}
          </div>
        ) : null}
      </div>

      {isReviewStep ? (
        <FormReview
          steps={steps}
          fields={fields}
          answers={answers}
          onEdit={(index) => goToStep(index)}
        />
      ) : (
        <div className="form-grid" key={currentStep!.id}>
          {currentStep!.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              visible={isFormFieldVisible(field, fields, answers)}
              savedValue={answers[field.field_key]}
            />
          ))}
        </div>
      )}
      {error && (
        <div className="notice warn" role="alert">
          {error}
        </div>
      )}
      <div className="public-form-actions">
        {currentStepIndex > 0 && (
          <button
            className="btn"
            type="button"
            disabled={pending}
            onClick={() => goToStep(currentStepIndex - 1)}
          >
            Back
          </button>
        )}
        {isReviewStep ? (
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Submit"}
          </button>
        ) : (
          <button className="btn primary" type="submit" disabled={pending}>
            Continue
          </button>
        )}
      </div>
    </form>
  );
}

function buildFormSteps(fields: FormField[]): FormStep[] {
  const steps: FormStep[] = [];
  let current: FormStep = {
    id: "form-details",
    title: "Details",
    description: null,
    named: false,
    fields: [],
  };

  for (const field of fields) {
    if (field.type === "section") {
      if (current.fields.length > 0) steps.push(current);
      current = {
        id: field.id,
        title: field.label,
        description: field.helper,
        named: true,
        fields: [],
      };
    } else {
      current.fields.push(field);
    }
  }
  if (current.fields.length > 0) steps.push(current);
  return steps.length > 0 ? steps : [{ ...current, fields: [] }];
}

function FormReview({
  steps,
  fields,
  answers,
  onEdit,
}: {
  steps: FormStep[];
  fields: FormField[];
  answers: Record<string, unknown>;
  onEdit: (stepIndex: number) => void;
}) {
  return (
    <div className="public-form-review">
      {steps.map((step, index) => {
        const visibleFields = step.fields.filter((field) =>
          isFormFieldVisible(field, fields, answers),
        );
        if (visibleFields.length === 0) return null;
        return (
          <section className="public-form-review-section" key={step.id}>
            <div className="public-form-review-heading">
              <h3>{step.title}</h3>
              <button
                className="cancel-link"
                type="button"
                onClick={() => onEdit(index)}
              >
                Edit
              </button>
            </div>
            <dl>
              {visibleFields.map((field) => (
                <div key={field.id}>
                  <dt>{field.label}</dt>
                  <dd>{displayAnswer(answers[field.field_key])}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function displayAnswer(value: unknown) {
  if (Array.isArray(value))
    return value.length > 0 ? value.join(", ") : "Not answered";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.trim()) return value;
  return "Not answered";
}

function FieldInput({
  field,
  visible,
  savedValue,
}: {
  field: FormField;
  visible: boolean;
  savedValue: unknown;
}) {
  if (!visible) return null;

  const required = field.required || undefined;
  const inputId = `field-${field.id}`;
  if (field.type === "textarea") {
    return (
      <div>
        <label className="form-label" htmlFor={inputId}>
          {field.label}
          {field.required && <RequiredMark />}
        </label>
        <textarea
          id={inputId}
          name={field.field_key}
          className="input textarea"
          required={required}
          placeholder={field.placeholder || undefined}
          defaultValue={typeof savedValue === "string" ? savedValue : ""}
        />
        {field.helper && <Helper>{field.helper}</Helper>}
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="form-label" htmlFor={inputId}>
          {field.label}
          {field.required && <RequiredMark />}
        </label>
        <select
          id={inputId}
          name={field.field_key}
          className="input"
          required={required}
          defaultValue={typeof savedValue === "string" ? savedValue : ""}
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
    return (
      <MultiSelectInput
        field={field}
        initialSelected={Array.isArray(savedValue) ? savedValue : []}
      />
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
          defaultChecked={savedValue === true}
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
      <label className="form-label" htmlFor={inputId}>
        {field.label}
        {field.required && <RequiredMark />}
      </label>
      <input
        id={inputId}
        type={inputType[field.type] || "text"}
        name={field.field_key}
        className="input"
        required={required}
        placeholder={field.placeholder || undefined}
        defaultValue={typeof savedValue === "string" ? savedValue : ""}
      />
      {field.helper && <Helper>{field.helper}</Helper>}
    </div>
  );
}

function MultiSelectInput({
  field,
  initialSelected,
}: {
  field: FormField;
  initialSelected: unknown[];
}) {
  const [selected, setSelected] = useState<string[]>(
    initialSelected.filter((item): item is string => typeof item === "string"),
  );
  const options = normalizeFormFieldOptions(field.options);
  const labelId = `field-label-${field.id}`;

  return (
    <div>
      <div className="form-label" id={labelId}>
        {field.label}
        {field.required && <RequiredMark />}
      </div>
      <details
        aria-labelledby={labelId}
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
