"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icons";
import { ROLE_META, ROLE_ORDER } from "@/lib/types";
import type { Person, RoleKind } from "@/lib/types";
import { addParticipant, bulkAddParticipants } from "@/app/actions";

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
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [bulkStep, setBulkStep] = useState<"pick" | "details">("pick");
  const [roleMode, setRoleMode] = useState<"person" | RoleKind>("person");
  const [role, setRole] = useState<RoleKind>("vendor");
  const [roleNote, setRoleNote] = useState("");
  const [rate, setRate] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pick(p: Person) {
    setChosen(p);
    setRole(p.role);
    setRoleNote(p.specialty || "");
  }

  function close() {
    setOpen(false);
    setChosen(null);
    setBulkMode(false);
    setSelectedPeople(new Set());
    setBulkStep("pick");
    setRoleMode("person");
    setRole("vendor");
    setRoleNote("");
    setRate("");
    setDue("");
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!chosen) return;
    setError(null);
    const f = new FormData();
    f.set("event_id", eventId);
    f.set("person_id", chosen.id);
    f.set("role", role);
    if (roleNote) f.set("role_note", roleNote);
    f.set("rate", rate);
    if (due) f.set("due_date", due);
    start(async () => {
      const result = await addParticipant(f);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function togglePerson(id: string) {
    setSelectedPeople((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    if (selectedPeople.size === 0) return;
    setError(null);
    const f = new FormData();
    f.set("event_id", eventId);
    selectedPeople.forEach((id) => f.append("person_ids[]", id));
    if (roleMode !== "person") f.set("role", roleMode);
    if (roleNote) f.set("role_note", roleNote);
    f.set("rate", rate);
    if (due) f.set("due_date", due);
    start(async () => {
      const result = await bulkAddParticipants(f);
      if (!result.ok) {
        setError(result.error);
        return;
      }
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
        title={
          chosen
            ? `Add ${chosen.name}`
            : bulkMode
              ? "Bulk add participants"
              : "Add participant"
        }
      >
        {!chosen && !bulkMode ? (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <div className="muted" style={{ fontSize: 13 }}>
                Pick someone from your roster.
              </div>
              {available.length > 1 && (
                <button
                  className="btn sm"
                  type="button"
                  onClick={() => setBulkMode(true)}
                >
                  <Icon.users /> Bulk add
                </button>
              )}
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
        ) : bulkMode ? (
          bulkStep === "pick" ? (
            <div style={{ paddingTop: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div className="muted" style={{ fontSize: 13 }}>
                  {selectedPeople.size} selected
                </div>
                <button
                  className="cancel-link"
                  type="button"
                  onClick={() => setBulkMode(false)}
                >
                  Single add
                </button>
              </div>

              {available.map((p) => {
                const checked = selectedPeople.has(p.id);
                const sub = p.specialty || ROLE_META[p.role as RoleKind]?.label;
                return (
                  <button
                    key={p.id}
                    className="card-row"
                    type="button"
                    style={{
                      borderBottom: "1px solid var(--hair-2)",
                      alignItems: "flex-start",
                      paddingTop: 12,
                      paddingBottom: 12,
                      background: checked ? "var(--hair-2)" : undefined,
                    }}
                    onClick={() => togglePerson(p.id)}
                  >
                    <span
                      className="row-checkbox"
                      aria-hidden
                      style={{
                        marginTop: 8,
                        background: checked ? "var(--ink)" : "transparent",
                        color: "white",
                        borderColor: checked ? "var(--ink)" : "var(--ink-4)",
                      }}
                    >
                      {checked && <Icon.check />}
                    </span>
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
                  </button>
                );
              })}

              {available.length === 0 && (
                <div className="empty">
                  <h3>Everyone&apos;s already on this event</h3>
                  <div>Add someone new from the People tab.</div>
                </div>
              )}

              {error && <div className="notice warn">{error}</div>}
              <div className="sheet-footer">
                <button
                  className="btn primary block"
                  type="button"
                  disabled={selectedPeople.size === 0}
                  onClick={() => setBulkStep("details")}
                >
                  Continue with {selectedPeople.size}
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submitBulk}
              className="form-grid"
              style={{ paddingTop: 8 }}
            >
              <div className="notice">
                Adding {selectedPeople.size} participant
                {selectedPeople.size === 1 ? "" : "s"} to this event.
              </div>

              <div>
                <label className="form-label">Role on this event</label>
                <select
                  className="input"
                  value={roleMode}
                  onChange={(e) =>
                    setRoleMode(e.target.value as "person" | RoleKind)
                  }
                >
                  <option value="person">Use each contact&apos;s role</option>
                  {ROLE_ORDER.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_META[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Shared scope note</label>
                <input
                  className="input"
                  value={roleNote}
                  onChange={(e) => setRoleNote(e.target.value)}
                  placeholder="Optional note applied to everyone"
                />
                <p
                  className="muted"
                  style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
                >
                  Leave blank to use each contact&apos;s specialty when available.
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

              <button
                type="button"
                className="cancel-link"
                onClick={() => setBulkStep("pick")}
              >
                Back to selected people
              </button>

              {error && <div className="notice warn">{error}</div>}
              <div className="sheet-footer">
                <button
                  className="btn primary block"
                  type="submit"
                  disabled={pending}
                >
                  {pending
                    ? "Adding..."
                    : `Add ${selectedPeople.size} to event`}
                </button>
              </div>
            </form>
          )
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
              <Avatar person={chosen!} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {chosen!.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 2,
                  }}
                >
                  {ROLE_META[chosen!.role as RoleKind]?.label}
                  {chosen!.location ? ` · ${chosen!.location}` : ""}
                </div>
                {chosen!.specialty && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-2)",
                      marginTop: 6,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    “{chosen!.specialty}”
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
                {chosen!.specialty
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
            {error && <div className="notice warn">{error}</div>}
            <div className="sheet-footer">
              <button
                className="btn primary block"
                type="submit"
                disabled={pending}
              >
                {pending ? "Adding…" : "Add to event"}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
