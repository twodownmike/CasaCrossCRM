"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFormMeta } from "@/app/forms-actions";

export function FormMetaEditor({
  id,
  title,
  description,
  thankYou,
}: {
  id: string;
  title: string;
  description: string | null;
  thankYou: string | null;
}) {
  const router = useRouter();
  const [t, setT] = useState(title);
  const [d, setD] = useState(description || "");
  const [ty, setTy] = useState(thankYou || "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState<null | "ok" | "error">(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setSaved(null);
    const f = new FormData();
    f.set("id", id);
    f.set("title", t);
    f.set("description", d);
    f.set("thank_you_message", ty);
    start(async () => {
      try {
        await updateFormMeta(f);
        setSaved("ok");
        router.refresh();
      } catch {
        setSaved("error");
      }
    });
  }

  return (
    <form onSubmit={save} className="form-grid">
      <div>
        <label className="form-label">Title</label>
        <input
          required
          className="input"
          value={t}
          onChange={(e) => setT(e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea
          className="input textarea"
          value={d}
          onChange={(e) => setD(e.target.value)}
          placeholder="Shown above the form so people know what they're filling out."
        />
      </div>
      <div>
        <label className="form-label">Thank-you message</label>
        <textarea
          className="input textarea"
          value={ty}
          onChange={(e) => setTy(e.target.value)}
          placeholder="Optional — shown after they submit."
        />
      </div>
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : saved === "ok" ? "Saved ✓" : "Save details"}
      </button>
    </form>
  );
}
