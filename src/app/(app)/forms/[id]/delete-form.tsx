"use client";

import { deleteForm } from "@/app/forms-actions";

export function DeleteForm({ id }: { id: string }) {
  return (
    <div style={{ padding: "var(--s-7) var(--s-5)" }}>
      <form
        action={deleteForm}
        onSubmit={(e) => {
          if (
            !confirm(
              "Delete this form and all of its responses? This can't be undone.",
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          className="btn block"
          style={{ color: "var(--terracotta)" }}
          type="submit"
        >
          Delete form
        </button>
      </form>
    </div>
  );
}
