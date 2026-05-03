"use client";

import { useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { ROLE_META } from "@/lib/types";
import type { Person, RoleKind } from "@/lib/types";
import { addParticipant } from "@/app/actions";

export function AddParticipantSheet({
  eventId,
  available,
}: {
  eventId: string;
  available: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Person | null>(null);
  const [rate, setRate] = useState("");
  const [due, setDue] = useState("");
  const [pending, start] = useTransition();

  function close() {
    setOpen(false);
    setChosen(null);
    setRate("");
    setDue("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return;
    const f = new FormData();
    f.set("event_id", eventId);
    f.set("person_id", chosen.id);
    f.set("role", chosen.role);
    f.set("rate", rate);
    if (due) f.set("due_date", due);
    start(async () => {
      await addParticipant(f);
      close();
    });
  }

  return (
    <>
      <button className="btn block" onClick={() => setOpen(true)}>
        <Icon.plus /> Add participant
      </button>
      <Sheet
        open={open}
        onClose={close}
        title={chosen ? `Add ${chosen.name}` : "Add participant"}
      >
        {!chosen ? (
          <div style={{ paddingTop: 8 }}>
            <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              Pick someone from your roster.
            </div>
            {available.map((p) => (
              <button
                key={p.id}
                className="card-row"
                style={{ borderBottom: "1px solid var(--hair-2)" }}
                onClick={() => setChosen(p)}
              >
                <Avatar person={p} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {ROLE_META[p.role as RoleKind]?.label}
                    {p.location ? ` · ${p.location}` : ""}
                  </div>
                </div>
                <Icon.plus style={{ color: "var(--ink-3)" }} />
              </button>
            ))}
            {available.length === 0 && (
              <div className="empty">
                <h3>Everyone&apos;s already on this event</h3>
                <div>Add someone new from the People tab.</div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="form-grid" style={{ paddingTop: 8 }}>
            <div className="card-row" style={{ cursor: "default" }}>
              <Avatar person={chosen} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {chosen.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {ROLE_META[chosen.role as RoleKind]?.label}
                </div>
              </div>
            </div>
            <div>
              <label className="form-label">Rate (USD)</label>
              <input
                type="number"
                step="1"
                min="0"
                className="input"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0 for comp"
              />
            </div>
            <div>
              <label className="form-label">Payment due</label>
              <input
                type="date"
                className="input"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
            <div className="row gap-2">
              <button
                type="button"
                className="cancel-link"
                onClick={() => setChosen(null)}
              >
                ← Pick someone else
              </button>
            </div>
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add to event"}
            </button>
          </form>
        )}
      </Sheet>
    </>
  );
}
