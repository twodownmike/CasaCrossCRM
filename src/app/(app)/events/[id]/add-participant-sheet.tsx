"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { ROLE_META, ROLE_ORDER } from "@/lib/types";
import type { Person, RoleKind } from "@/lib/types";
import { addParticipant } from "@/app/actions";

export function AddParticipantSheet({
  eventId,
  available,
}: {
  eventId: string;
  available: Person[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Person | null>(null);
  const [role, setRole] = useState<RoleKind>("vendor");
  const [roleNote, setRoleNote] = useState("");
  const [rate, setRate] = useState("");
  const [due, setDue] = useState("");
  const [pending, start] = useTransition();

  function pick(p: Person) {
    setChosen(p);
    setRole(p.role);
    setRoleNote(p.specialty || "");
  }

  function close() {
    setOpen(false);
    setChosen(null);
    setRole("vendor");
    setRoleNote("");
    setRate("");
    setDue("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return;
    const f = new FormData();
    f.set("event_id", eventId);
    f.set("person_id", chosen.id);
    f.set("role", role);
    if (roleNote) f.set("role_note", roleNote);
    f.set("rate", rate);
    if (due) f.set("due_date", due);
    start(async () => {
      await addParticipant(f);
      close();
      router.refresh();
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
            {available.map((p) => {
              const sub = p.specialty || ROLE_META[p.role as RoleKind]?.label;
              return (
                <button
                  key={p.id}
                  className="card-row"
                  style={{
                    borderBottom: "1px solid var(--hair-2)",
                    alignItems: "flex-start",
                    paddingTop: 12,
                    paddingBottom: 12,
                  }}
                  onClick={() => pick(p)}
                >
                  <Avatar person={p} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {p.name}
                      </span>
                      <span className={`pill role-${p.role}`}>
                        {ROLE_META[p.role as RoleKind]?.label}
                      </span>
                    </div>
                    {sub && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-3)",
                          marginTop: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {sub}
                      </div>
                    )}
                  </div>
                  <Icon.plus
                    style={{ color: "var(--ink-3)", marginTop: 8 }}
                  />
                </button>
              );
            })}
            {available.length === 0 && (
              <div className="empty">
                <h3>Everyone&apos;s already on this event</h3>
                <div>Add someone new from the People tab.</div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="form-grid" style={{ paddingTop: 8 }}>
            <div
              className="card-row"
              style={{
                cursor: "default",
                alignItems: "flex-start",
                paddingTop: 12,
                paddingBottom: 12,
              }}
            >
              <Avatar person={chosen} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {chosen.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 2,
                  }}
                >
                  {ROLE_META[chosen.role as RoleKind]?.label}
                  {chosen.location ? ` · ${chosen.location}` : ""}
                </div>
                {chosen.specialty && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-2)",
                      marginTop: 6,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    “{chosen.specialty}”
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Role on this event</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleKind)}
              >
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">What they&apos;re doing</label>
              <input
                className="input"
                value={roleNote}
                onChange={(e) => setRoleNote(e.target.value)}
                placeholder="e.g. Ceremony arch + reception centerpieces"
              />
              <p
                className="muted"
                style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
              >
                {chosen.specialty
                  ? "Pre-filled from their specialty — edit if it's different for this shoot."
                  : "Optional — adds a per-event description so you remember their scope."}
              </p>
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
