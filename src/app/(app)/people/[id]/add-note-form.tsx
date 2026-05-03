"use client";

import { useState, useTransition } from "react";
import { addNote } from "@/app/actions";
import { Icon } from "@/components/icons";

export function AddNoteForm({ personId }: { personId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = body.trim();
    if (!v) return;
    const f = new FormData();
    f.set("person_id", personId);
    f.set("body", v);
    start(async () => {
      await addNote(f);
      setBody("");
    });
  }

  return (
    <form onSubmit={submit} className="form-grid" style={{ marginTop: 12 }}>
      <textarea
        className="input textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note about this contact…"
      />
      <button className="btn primary block" type="submit" disabled={pending}>
        <Icon.plus /> {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
