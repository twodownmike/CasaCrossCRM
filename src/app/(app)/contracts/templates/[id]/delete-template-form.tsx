"use client";

import { deleteTemplate } from "@/app/contracts-actions";

export function DeleteTemplateForm({ id }: { id: string }) {
  return (
    <form
      action={deleteTemplate}
      style={{ marginTop: 14 }}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this template? Existing contracts that used it stay intact.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="btn block"
        type="submit"
        style={{ color: "var(--terracotta)" }}
      >
        Delete template
      </button>
    </form>
  );
}
