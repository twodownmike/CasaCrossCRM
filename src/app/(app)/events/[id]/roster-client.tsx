"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { StatusPill } from "@/components/pill";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { fmtMoney } from "@/lib/format";
import { ROLE_META, ROLE_ORDER, type RoleKind } from "@/lib/types";
import { bulkMarkPaid, bulkRemoveParticipants } from "@/app/actions";
import { bulkSendContracts } from "@/app/contracts-actions";
import { grantPortalAccess } from "@/app/portal-actions";
import { bulkSendForms } from "@/app/forms-actions";

type RosterPart = {
  id: string;
  role: RoleKind;
  rate: number;
  paid: number;
  status: string;
  contract: string;
  role_note: string | null;
  person: {
    id: string;
    name: string;
    initials: string | null;
    tint: string | null;
    ink: string | null;
    email: string | null;
    specialty: string | null;
  };
  portal: "active" | "setup" | "invited" | "expired" | "none";
  contract_required: boolean;
  payment_required: boolean;
  portal_required: boolean;
};

export function RosterClient({
  eventId,
  participants,
  templates,
  forms,
}: {
  eventId: string;
  participants: RosterPart[];
  templates: Array<{ id: string; name: string }>;
  forms: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [contractOpen, setContractOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<
    | { kind: "ok"; sent: number; urls: string[] }
    | { kind: "err"; msg: string }
    | null
  >(null);
  const [formResult, setFormResult] = useState<
    | { kind: "ok"; sent: number; assigned: number; skipped: number }
    | { kind: "err"; msg: string }
    | null
  >(null);

  const byRole = useMemo(() => {
    const m: Partial<Record<RoleKind, RosterPart[]>> = {};
    for (const p of participants) {
      (m[p.role] ||= []).push(p);
    }
    return m;
  }, [participants]);

  function toggleSelectMode() {
    setSelecting((on) => !on);
    setSelectedIds(new Set());
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllUnpaid() {
    setSelectedIds(
      new Set(
        participants
          .filter((p) => Number(p.rate) > 0 && p.paid < p.rate)
          .map((p) => p.id),
      ),
    );
  }
  function selectAllUnsentContract() {
    setSelectedIds(
      new Set(
        participants.filter((p) => p.contract === "unsent").map((p) => p.id),
      ),
    );
  }
  function selectAll() {
    setSelectedIds(new Set(participants.map((p) => p.id)));
  }

  function doMarkPaid() {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Mark ${selectedIds.size} participant${selectedIds.size === 1 ? "" : "s"} as fully paid?`,
      )
    )
      return;
    const f = new FormData();
    f.set("event_id", eventId);
    selectedIds.forEach((id) => f.append("ids[]", id));
    start(async () => {
      await bulkMarkPaid(f);
      setSelectedIds(new Set());
      setSelecting(false);
      router.refresh();
    });
  }

  function doRemove() {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Remove ${selectedIds.size} participant${selectedIds.size === 1 ? "" : "s"} from this event?`,
      )
    )
      return;
    const f = new FormData();
    f.set("event_id", eventId);
    selectedIds.forEach((id) => f.append("ids[]", id));
    start(async () => {
      await bulkRemoveParticipants(f);
      setSelectedIds(new Set());
      setSelecting(false);
      router.refresh();
    });
  }

  return (
    <div>
      <div
        style={{
          padding: "16px var(--s-5) 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div className="muted" style={{ fontSize: 13 }}>
          {selecting
            ? `${selectedIds.size} selected`
            : `${participants.length} participants`}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {selecting ? (
            <>
              <button
                type="button"
                className="btn sm"
                onClick={selectAll}
                disabled={pending}
              >
                All
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={selectAllUnsentContract}
                disabled={pending}
                title="Select everyone whose contract hasn't been sent"
              >
                Unsent
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={selectAllUnpaid}
                disabled={pending}
                title="Select everyone with money still owed"
              >
                Unpaid
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={toggleSelectMode}
                disabled={pending}
              >
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn sm" onClick={toggleSelectMode}>
              <Icon.check /> Select
            </button>
          )}
        </div>
      </div>

      {ROLE_ORDER.filter((r) => byRole[r]).map((role) => (
        <div key={role}>
          <div className="section-label" style={{ marginTop: 24 }}>
            <h2>{ROLE_META[role].plural}</h2>
            <span className="muted" style={{ fontSize: 12 }}>
              {byRole[role]!.length}
            </span>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <div className="card elev">
              {byRole[role]!.map((part) => (
                <Row
                  key={part.id}
                  part={part}
                  eventId={eventId}
                  selecting={selecting}
                  selected={selectedIds.has(part.id)}
                  onToggle={() => toggle(part.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ))}

      {selecting && selectedIds.size > 0 && (
        <div className="bulk-bar">
          <div className="bulk-bar-inner">
            <button
              className="btn primary sm"
              type="button"
              onClick={() => setContractOpen(true)}
              disabled={pending}
            >
              <Icon.doc /> Send contract
              {selectedIds.size > 1 ? `s (${selectedIds.size})` : ""}
            </button>
            <button
              className="btn sm"
              type="button"
              onClick={() => setFormOpen(true)}
              disabled={pending}
            >
              <Icon.doc /> Send form
              {selectedIds.size > 1 ? `s (${selectedIds.size})` : ""}
            </button>
            <button
              className="btn sm"
              type="button"
              onClick={doMarkPaid}
              disabled={pending}
            >
              <Icon.check /> Mark paid
            </button>
            <button
              className="btn sm"
              type="button"
              onClick={doRemove}
              disabled={pending}
              style={{ color: "var(--terracotta)" }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <Sheet
        open={contractOpen}
        onClose={() => {
          setContractOpen(false);
          setBulkResult(null);
        }}
        title={`Send ${selectedIds.size} contract${selectedIds.size === 1 ? "" : "s"}`}
      >
        <BulkContractForm
          eventId={eventId}
          participantIds={Array.from(selectedIds)}
          templates={templates}
          result={bulkResult}
          onResult={setBulkResult}
          onDone={() => {
            setContractOpen(false);
            setBulkResult(null);
            setSelectedIds(new Set());
            setSelecting(false);
            router.refresh();
          }}
        />
      </Sheet>
      <Sheet
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormResult(null);
        }}
        title={`Send ${selectedIds.size} form${selectedIds.size === 1 ? "" : "s"}`}
      >
        <BulkFormForm
          eventId={eventId}
          participantIds={Array.from(selectedIds)}
          forms={forms}
          result={formResult}
          onResult={setFormResult}
          onDone={() => {
            setFormOpen(false);
            setFormResult(null);
            setSelectedIds(new Set());
            setSelecting(false);
            router.refresh();
          }}
        />
      </Sheet>
    </div>
  );
}

function Row({
  part,
  eventId,
  selecting,
  selected,
  onToggle,
}: {
  part: RosterPart;
  eventId: string;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const note = part.role_note || part.person.specialty;
  const inner = (
    <>
      {selecting && (
        <span
          className="row-checkbox"
          aria-hidden
          style={{
            background: selected ? "var(--ink)" : "transparent",
            color: "white",
            borderColor: selected ? "var(--ink)" : "var(--ink-4)",
          }}
        >
          {selected && <Icon.check />}
        </span>
      )}
      <Avatar person={part.person} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
          {part.person.name}
        </div>
        {note && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 2,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {note}
          </div>
        )}
        <div
          style={{
            fontSize: 11.5,
            color: "var(--ink-3)",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {Number(part.rate) > 0 ? (
            <span className="tabnums">{fmtMoney(Number(part.rate))}</span>
          ) : (
            <span>Comp</span>
          )}
          <span>·</span>
          <span
            className="muted"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Contract
          </span>
          <StatusPill status={part.contract} />
          <span>·</span>
          <span
            className="muted"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Portal
          </span>
          <PortalStatus status={part.portal} />
        </div>
        <div className="roster-requirements">
          {part.contract_required && <span>Contract required</span>}
          {part.payment_required && <span>Payment required</span>}
          {part.portal_required && <span>Portal required</span>}
          {!part.contract_required &&
            !part.payment_required &&
            !part.portal_required && <span>No readiness requirements</span>}
        </div>
      </div>
      {!selecting && part.portal !== "active" && part.person.email && (
        <form action={grantPortalAccess} onClick={(e) => e.stopPropagation()}>
          <input type="hidden" name="person_id" value={part.person.id} />
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="email" value={part.person.email} />
          <input type="hidden" name="display_name" value={part.person.name} />
          <button className="btn sm" type="submit">
            Invite
          </button>
        </form>
      )}
      {Number(part.rate) > 0 && <StatusPill status={part.status} />}
    </>
  );

  if (selecting) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="card-row"
        style={{
          alignItems: "flex-start",
          paddingTop: 14,
          paddingBottom: 14,
          background: selected ? "var(--bg)" : undefined,
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <div
      className="card-row"
      style={{ alignItems: "flex-start", paddingTop: 14, paddingBottom: 14 }}
    >
      {inner}
      <Link
        className="btn sm"
        href={`/events/${eventId}/participants/${part.id}`}
      >
        Edit
      </Link>
    </div>
  );
}

function PortalStatus({ status }: { status: RosterPart["portal"] }) {
  const label = {
    active: "Active",
    setup: "Setup",
    invited: "Invited",
    expired: "Expired",
    none: "None",
  }[status];
  const color =
    status === "active"
      ? "var(--sage)"
      : status === "expired"
        ? "var(--terracotta)"
        : "var(--ink-3)";
  const background =
    status === "active"
      ? "var(--sage-tint)"
      : status === "expired"
        ? "var(--terracotta-tint)"
        : "var(--hair-2)";
  return (
    <span
      className="pill"
      style={{
        background,
        color,
        fontSize: 10.5,
        padding: "3px 7px",
      }}
    >
      {label}
    </span>
  );
}

function BulkContractForm({
  eventId,
  participantIds,
  templates,
  result,
  onResult,
  onDone,
}: {
  eventId: string;
  participantIds: string[];
  templates: Array<{ id: string; name: string }>;
  result:
    | { kind: "ok"; sent: number; urls: string[] }
    | { kind: "err"; msg: string }
    | null;
  onResult: (
    r:
      | { kind: "ok"; sent: number; urls: string[] }
      | { kind: "err"; msg: string }
      | null,
  ) => void;
  onDone: () => void;
}) {
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("Booking Agreement");
  const [pending, start] = useTransition();

  function copyAll(urls: string[]) {
    navigator.clipboard.writeText(urls.join("\n"));
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    onResult(null);
    const f = new FormData();
    f.set("event_id", eventId);
    participantIds.forEach((id) => f.append("participant_ids[]", id));
    if (templateId) f.set("template_id", templateId);
    f.set("title", title);
    start(async () => {
      const r = await bulkSendContracts(f);
      if (!r.ok) {
        onResult({ kind: "err", msg: r.errors.join("; ") || "Failed" });
        return;
      }
      onResult({ kind: "ok", sent: r.sent, urls: r.urls });
    });
  }

  if (result?.kind === "ok") {
    return (
      <div className="form-grid" style={{ paddingTop: 8 }}>
        <div className="notice">
          {result.sent} signing link{result.sent === 1 ? "" : "s"} generated.
        </div>
        <div
          style={{
            background: "var(--hair-2)",
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            fontFamily: "ui-monospace, Menlo, monospace",
            color: "var(--ink-2)",
            maxHeight: 240,
            overflowY: "auto",
            whiteSpace: "pre",
          }}
        >
          {result.urls.join("\n")}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => copyAll(result.urls)}
        >
          Copy all links
        </button>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Send each link to the matching participant. Their booking statuses are
          now <strong>Sent</strong>.
        </p>
        <div className="sheet-footer">
          <button className="btn primary block" type="button" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="form-grid" style={{ paddingTop: 8 }}>
      <div className="muted" style={{ fontSize: 13 }}>
        Sending one contract per selected participant ({participantIds.length}{" "}
        total). Each gets their own personalized signing link.
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
          disabled={pending || participantIds.length === 0}
        >
          {pending
            ? "Generating…"
            : `Generate ${participantIds.length} link${participantIds.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </form>
  );
}

function BulkFormForm({
  eventId,
  participantIds,
  forms,
  result,
  onResult,
  onDone,
}: {
  eventId: string;
  participantIds: string[];
  forms: Array<{ id: string; title: string }>;
  result:
    | { kind: "ok"; sent: number; assigned: number; skipped: number }
    | { kind: "err"; msg: string }
    | null;
  onResult: (
    r:
      | { kind: "ok"; sent: number; assigned: number; skipped: number }
      | { kind: "err"; msg: string }
      | null,
  ) => void;
  onDone: () => void;
}) {
  const [formId, setFormId] = useState(forms[0]?.id ?? "");
  const [pending, start] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    onResult(null);
    const f = new FormData();
    f.set("event_id", eventId);
    f.set("form_id", formId);
    participantIds.forEach((id) => f.append("participant_ids[]", id));
    start(async () => {
      const r = await bulkSendForms(f);
      if (!r.ok) {
        onResult({ kind: "err", msg: r.error });
        return;
      }
      onResult({
        kind: "ok",
        sent: r.sent,
        assigned: r.assigned,
        skipped: r.skipped,
      });
    });
  }

  if (result?.kind === "ok") {
    return (
      <div className="form-grid" style={{ paddingTop: 8 }}>
        <div className="notice">
          {result.assigned} portal form assignment
          {result.assigned === 1 ? "" : "s"} created.
        </div>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          {result.sent} email{result.sent === 1 ? "" : "s"} sent.{" "}
          {result.skipped > 0
            ? `${result.skipped} participant${result.skipped === 1 ? "" : "s"} could not be emailed.`
            : "Each participant can also complete the form from their portal."}
        </p>
        <div className="sheet-footer">
          <button className="btn primary block" type="button" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="form-grid" style={{ paddingTop: 8 }}>
      <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
        This creates one portal to-do per selected participant and emails a
        secure form link when the participant has an email address.
      </div>
      <div>
        <label className="form-label">Form</label>
        <select
          className="input"
          required
          value={formId}
          onChange={(e) => setFormId(e.target.value)}
        >
          {forms.length === 0 && <option value="">No published forms</option>}
          {forms.map((form) => (
            <option key={form.id} value={form.id}>
              {form.title}
            </option>
          ))}
        </select>
      </div>
      {result?.kind === "err" && (
        <div className="notice warn">{result.msg}</div>
      )}
      <div className="sheet-footer">
        <button
          className="btn primary block"
          type="submit"
          disabled={pending || participantIds.length === 0 || !formId}
        >
          {pending
            ? "Sending..."
            : `Send to ${participantIds.length} participant${participantIds.length === 1 ? "" : "s"}`}
        </button>
      </div>
    </form>
  );
}
