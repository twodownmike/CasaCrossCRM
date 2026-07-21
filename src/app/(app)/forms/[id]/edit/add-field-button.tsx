"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import {
  FIELD_TYPE_LABELS,
  type FormField,
  type FormFieldType,
} from "@/lib/types";
import { FieldForm } from "./field-list";

const TYPE_CHOICES: Array<{
  type: FormFieldType;
  label: string;
  detail: string;
  icon: keyof typeof Icon;
}> = [
  { type: "section", label: "Section header", detail: "Start a new group", icon: "doc" },
  { type: "text", label: "Short answer", detail: "Name or brief response", icon: "chat" },
  { type: "textarea", label: "Long answer", detail: "Detailed response", icon: "chat" },
  { type: "select", label: "Dropdown", detail: "Choose one option", icon: "chev" },
  { type: "multiselect", label: "Multi-select", detail: "Choose several options", icon: "check" },
  { type: "checkbox", label: "Yes or no", detail: "Single confirmation", icon: "check" },
  { type: "email", label: "Email", detail: "Validated email address", icon: "mail" },
  { type: "phone", label: "Phone", detail: "Phone number", icon: "phone" },
  { type: "date", label: "Date", detail: "Calendar date", icon: "calendar" },
  { type: "file", label: "File upload", detail: "Image or document", icon: "plus" },
];

export function AddFieldButton({
  formId,
  availableConditionFields,
}: {
  formId: string;
  availableConditionFields: FormField[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FormFieldType | null>(null);

  function close() {
    setOpen(false);
    setSelectedType(null);
  }

  return (
    <>
      <button className="btn primary" type="button" onClick={() => setOpen(true)}>
        <Icon.plus /> Add question
      </button>
      <Sheet
        open={open}
        onClose={close}
        title={selectedType ? `Add ${FIELD_TYPE_LABELS[selectedType].toLowerCase()}` : "Add to form"}
      >
        {selectedType ? (
          <div>
            <button
              className="cancel-link form-builder-type-back"
              type="button"
              onClick={() => setSelectedType(null)}
            >
              <Icon.back /> Choose a different type
            </button>
            <FieldForm
              key={selectedType}
              formId={formId}
              initialType={selectedType}
              availableConditionFields={availableConditionFields}
              onSaved={() => {
                close();
                router.refresh();
              }}
            />
          </div>
        ) : (
          <div className="form-type-grid">
            {TYPE_CHOICES.map((choice) => {
              const ChoiceIcon = Icon[choice.icon];
              return (
                <button
                  key={choice.type}
                  type="button"
                  className={`form-type-choice${choice.type === "section" ? " section" : ""}`}
                  onClick={() => setSelectedType(choice.type)}
                >
                  <span><ChoiceIcon /></span>
                  <strong>{choice.label}</strong>
                  <small>{choice.detail}</small>
                </button>
              );
            })}
          </div>
        )}
      </Sheet>
    </>
  );
}
