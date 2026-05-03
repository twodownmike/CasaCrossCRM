"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { FieldForm } from "./field-list";

export function AddFieldButton({ formId }: { formId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="btn block"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Icon.plus /> Add field
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Add field">
        <FieldForm
          formId={formId}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Sheet>
    </>
  );
}
