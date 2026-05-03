"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { sendContract } from "@/app/contracts-actions";
import { ROLE_META, type RoleKind } from "@/lib/types";
import { fmtDate } from "@/lib/format";

type PickerEvent = {
  id: string;
  name: string;
  date: string;
  participants: Array<{ id: string; name: string; role: RoleKind }>;
};

export function NewContractButton({
  events,
  templates,
}: {
  events: PickerEvent[];
  templates: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState<string>(
    events[0]?.id ?? "",
  );
  const [participantId, setParticipantId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [title, setTitle] = useState("Booking Agreement");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; url: string }
    | { kind: "err"; msg: string }
    | null
  >(null);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === eventId) || null,
    [events, eventId],
  );

  function close() {
    setOpen(false);
    setEventId(events[0]?.id ?? "");
    setParticipantId("");
    setTemplateId("");
    setTitle("Booking Agreement");
    setResult(null);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    if (!participantId) {
      setResult({ kind: "err", msg: "Pick a participant first." });
      return;
    }
    const f = new FormData();
    f.set("participant_id", participantId);
    if (templateId) f.set("template_id", templateId);
    f.set("title", title);
    start(async () => {
      const r = await sendContract(f);
      if (!r.ok) {
        setResult({ kind: "err", msg: r.error });
        return;
      }
      setResult({ kind: "ok", url: r.url });
      router.refresh();
    });
  }

  function copy(u: string) {
    navigator.clipboard.writeText(u);
  }

  return (
    <>
      <button
        className="btn primary"
        type="button"
        onClick={() => setOpen(true)}
        disabled={events.length === 0}
        title={events.length === 0 ? "Add a participant to an event first" : undefined}
      >
        <Icon.plus /> New contract
      </button>

      <Sheet open={open} onClose={close} title="New contract">
        {result?.kind === "ok" ? (
          <div className="form-grid" style={{ paddingTop: 8 }}>
            <div className="notice">Signing link generated.</div>
            <code
              style={{
                background: "var(--hair-2)",
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                wordBreak: "break-all",
                color: "var(--ink-2)",
                fontFamily: "ui-monospace, Menlo, monospace",
              }}
            >
              {result.url}
            </code>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => copy(result.url)}
              >
                Copy link
              </button>
              <a
                className="btn"
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
            </div>
            <p
              className="muted"
              style={{ fontSize: 12, lineHeight: 1.5 }}
            >
              Send this link to the participant directly via text, email, or
              DM. The participant&apos;s contract status is now{" "}
              <strong>Sent</strong> in their booking.
            </p>
            <div className="sheet-footer">
              <button
                className="btn primary block"
                type="button"
                onClick={close}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="form-grid" style={{ paddingTop: 8 }}>
            <div>
              <label className="form-label">Event</label>
              <select
                className="input"
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setParticipantId("");
                }}
              >
                {events.length === 0 ? (
                  <option value="">No events with participants yet</option>
                ) : (
                  events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} · {fmtDate(ev.date, { short: true })}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="form-label">Participant</label>
              <select
                className="input"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Pick someone
                </option>
                {(activeEvent?.participants ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {ROLE_META[p.role]?.label || p.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Template</label>
              <select
                className="input"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Default booking agreement</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p
                className="muted"
                style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
              >
                Merge fields are filled from the participant + event before the
                link is generated.
              </p>
            </div>

            <div>
              <label className="form-label">Contract title</label>
              <input
                required
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {result?.kind === "err" && (
              <div className="notice warn">{result.msg}</div>
            )}

            <div className="sheet-footer">
              <button
                className="btn primary block"
                type="submit"
                disabled={pending}
              >
                {pending ? "Generating…" : "Generate signing link"}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
