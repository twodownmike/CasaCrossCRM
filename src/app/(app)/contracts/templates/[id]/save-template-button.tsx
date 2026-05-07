"use client";

import { useFormStatus } from "react-dom";

export function SaveTemplateButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn primary block" type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}
