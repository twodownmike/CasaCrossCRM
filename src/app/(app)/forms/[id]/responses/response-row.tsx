"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteFormResponse } from "@/app/forms-actions";

export function ResponseRow({ id, formId }: { id: string; formId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function remove() {
    if (!confirm("Delete this response?")) return;
    const f = new FormData();
    f.set("id", id);
    f.set("form_id", formId);
    start(async () => {
      await deleteFormResponse(f);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      style={{
        background: "none",
        border: "none",
        color: "var(--ink-4)",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: "pointer",
        padding: 0,
      }}
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
