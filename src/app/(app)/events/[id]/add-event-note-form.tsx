"use client";

import { useState, useTransition } from "react";
import { addEventNote } from "@/app/actions";
import { Icon } from "@/components/icons";

export function AddEventNoteForm({ eventId }: { eventId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = body.trim();
    if (!v) return;
    const f = new FormData();
    f.set("event_id", eventId);
    f.set("body", v);
    start(async () => {
      await addEventNote(f);
      setBody("");
    });
  }

  return (
    <form onSubmit={submit} className="form-grid" style={{ marginTop: 12 }}>
      <textarea
        className="input textarea"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note about this event…"
        rows={3}
      />
      <button
        className="btn primary block"
        type="submit"
        disabled={pending || !body.trim()}
      >
        <Icon.plus /> {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}
