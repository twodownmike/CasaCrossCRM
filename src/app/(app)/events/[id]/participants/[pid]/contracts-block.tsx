"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { sendContract } from "@/app/contracts-actions";

export function ContractsBlock({
  participantId,
  recipientName,
  templates,
}: {
  participantId: string;
  recipientName: string;
  templates: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string>("");
  const [title, setTitle] = useState(`Booking agreement — ${recipientName}`);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<
    | { kind: "ok"; url: string }
    | { kind: "err"; msg: string }
    | null
  >(null);

  function close() {
    setOpen(false);
    setTemplateId("");
    setTitle(`Booking agreement — ${recipientName}`);
    setResult(null);
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
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
        type="button"
        className="btn block"
        onClick={() => setOpen(true)}
      >
        <Icon.doc /> Send a new contract
      </button>
      <Sheet open={open} onClose={close} title="Send contract">
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
              Send this link directly to the participant via text, email, or
              DM. They&apos;ll sign on this same page. The contract status on
              their booking is now <strong>Sent</strong>.
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
            {result?.kind === "err" && (
              <div className="notice warn">{result.msg}</div>
            )}
            <div className="sheet-footer">
              <button className="btn primary block" type="submit" disabled={pending}>
                {pending ? "Generating…" : "Generate signing link"}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
