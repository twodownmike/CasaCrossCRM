"use client";

import Link from "next/link";
import {
  updateParticipant,
  removeParticipant,
  markPaid,
} from "@/app/actions";
import type { Participant } from "@/lib/types";
import { ROLE_META, ROLE_ORDER } from "@/lib/types";

const PAY_OPTS = ["paid", "partial", "due", "comp"] as const;
const CONTRACT_OPTS = ["unsent", "sent", "signed"] as const;

export function ParticipantForm({
  participant,
  eventId,
  personSpecialty,
}: {
  participant: Participant;
  eventId: string;
  personSpecialty?: string | null;
}) {
  return (
    <div className="form-grid">
      <form action={updateParticipant} className="form-grid">
        <input type="hidden" name="id" value={participant.id} />
        <input type="hidden" name="event_id" value={eventId} />

        <div>
          <label className="form-label">Role on this event</label>
          <select
            name="role"
            className="input"
            defaultValue={participant.role}
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
            name="role_note"
            className="input"
            defaultValue={participant.role_note || ""}
            placeholder={
              personSpecialty
                ? personSpecialty
                : "e.g. Ceremony arch + reception centerpieces"
            }
          />
          <p
            className="muted"
            style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
          >
            Per-event description, shown right on the roster.
          </p>
        </div>

        <div className="form-row">
          <div>
            <label className="form-label">Rate (USD)</label>
            <input
              name="rate"
              type="number"
              step="1"
              min="0"
              className="input"
              defaultValue={Number(participant.rate)}
            />
          </div>
          <div>
            <label className="form-label">Paid (USD)</label>
            <input
              name="paid"
              type="number"
              step="1"
              min="0"
              className="input"
              defaultValue={Number(participant.paid)}
            />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label className="form-label">Payment status</label>
            <select
              name="status"
              className="input"
              defaultValue={participant.status}
            >
              {PAY_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Contract</label>
            <select
              name="contract"
              className="input"
              defaultValue={participant.contract}
            >
              {CONTRACT_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s === "unsent"
                    ? "Not sent yet"
                    : s === "sent"
                      ? "Sent — awaiting signature"
                      : "Signed"}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Payment due date</label>
          <input
            name="due_date"
            type="date"
            className="input"
            defaultValue={participant.due_date || ""}
          />
        </div>
        <button className="btn primary block" type="submit">
          Save changes
        </button>
      </form>

      <form action={markPaid}>
        <input type="hidden" name="id" value={participant.id} />
        <input type="hidden" name="event_id" value={eventId} />
        <button className="btn block" type="submit">
          Mark fully paid
        </button>
      </form>

      <form
        action={removeParticipant}
        onSubmit={(e) => {
          if (!confirm("Remove this person from the event?"))
            e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={participant.id} />
        <input type="hidden" name="event_id" value={eventId} />
        <button
          className="btn block"
          style={{ color: "var(--terracotta)" }}
          type="submit"
        >
          Remove from event
        </button>
      </form>

      <Link
        href={`/events/${eventId}?tab=roster`}
        className="cancel-link"
        style={{ textAlign: "center" }}
      >
        Cancel
      </Link>
    </div>
  );
}
