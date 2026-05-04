"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { sendContract } from "@/app/contracts-actions";

export function ContractsBlock({
  participantId,
  recipientName,
  participantRate,
  templates,
}: {
  participantId: string;
  recipientName: string;
  participantRate: number;
  templates: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [title, setTitle] = useState(`Booking agreement — ${recipientName}`);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; url: string; id: string; isDraft: boolean }
    | { kind: "err"; msg: string }
    | null
  >(null);

  function close() {
    setOpen(false);
    setTemplateId("");
    setTitle(`Booking agreement — ${recipientName}`);
    setPaymentRequired(false);
    setPaymentAmount("");
    setSaveAsDraft(false);
    setResult(null);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const f = new FormData();
    f.set("participant_id", participantId);
    if (templateId) f.set("template_id", templateId);
    f.set("title", title);
    if (saveAsDraft) f.set("save_as_draft", "on");
    if (paymentRequired) {
      f.set("payment_required", "on");
      if (paymentAmount) f.set("payment_amount", paymentAmount);
    }
    start(async () => {
      const r = await sendContract(f);
      if (!r.ok) {
        setResult({ kind: "err", msg: r.error });
        return;
      }
      setResult({
        kind: "ok",
        url: r.url,
        id: r.id,
        isDraft: r.isDraft,
      });
      router.refresh();
    });
  }

  function copy(u: string) {
    navigator.clipboard.writeText(u);
  }

  return (
    <>
      <button
        type="button"
        className="btn block"
        onClick={() => setOpen(true)}
      >
        <Icon.doc /> Send a new contract
      </button>
      <Sheet open={open} onClose={close} title="Send contract">
        {result?.kind === "ok" ? (
          <div className="form-grid" style={{ paddingTop: 8 }}>
            <div className="notice">
              {result.isDraft
                ? "Draft saved — open it to review and send."
                : "Signing link generated."}
            </div>
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a className="btn primary" href={`/contracts/${result.id}`}>
                {result.isDraft ? "Open draft" : "Open contract"}
              </a>
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
                Preview signing
              </a>
            </div>
            <p
              className="muted"
              style={{ fontSize: 12, lineHeight: 1.5 }}
            >
              {result.isDraft
                ? "The link is reserved but the participant can't sign until you flip the draft to Sent."
                : "Send this link directly to the participant. The contract status on their booking is now Sent."}
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
              <label className="form-label">Contract title</label>
              <input
                required
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
                Merge fields are filled in from the participant + event before
                the link is generated.
              </p>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 12,
                border: "1px solid var(--hair)",
                borderRadius: "var(--r-2)",
                background: "var(--paper)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={paymentRequired}
                onChange={(e) => {
                  setPaymentRequired(e.target.checked);
                  if (e.target.checked && !paymentAmount) {
                    setPaymentAmount(String(participantRate || ""));
                  }
                }}
                style={{ marginTop: 2 }}
              />
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  Show a payment page after signing
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  After they sign, the page shows a Pay with Venmo button.
                  Skip this for comp bookings or anyone already paid.
                </span>
                {paymentRequired && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--ink-3)",
                      }}
                    >
                      $
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      className="input"
                      style={{ flex: 1 }}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={String(participantRate || 0)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </span>
                )}
              </span>
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: 12,
                border: "1px solid var(--hair)",
                borderRadius: "var(--r-2)",
                background: "var(--paper)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={saveAsDraft}
                onChange={(e) => setSaveAsDraft(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  Save as draft first
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    color: "var(--ink-3)",
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}
                >
                  Review and edit the rendered body before sending.
                </span>
              </span>
            </label>

            {result?.kind === "err" && (
              <div className="notice warn">{result.msg}</div>
            )}
            <div className="sheet-footer">
              <button
                className="btn primary block"
                type="submit"
                disabled={pending}
              >
                {pending
                  ? "Generating…"
                  : saveAsDraft
                    ? "Save draft"
                    : "Generate signing link"}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
