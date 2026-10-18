import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StatusPill } from "@/components/pill";
import { fmtDateFull, relTime } from "@/lib/format";
import { mdToHtml } from "@/lib/contracts";
import { ContractEditor } from "./contract-editor";

export const dynamic = "force-dynamic";

export default async function ContractDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!c) notFound();

  const isOpen = c.kind === "open";

  const [{ data: event }, { data: participant }, { data: signatures }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, name, date")
        .eq("id", c.event_id)
        .maybeSingle(),
      c.participant_id
        ? supabase
            .from("participants")
            .select("id, person_id")
            .eq("id", c.participant_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      isOpen
        ? supabase
            .from("contract_signatures")
            .select("*")
            .eq("contract_id", c.id)
            .order("signed_at", { ascending: false })
        : Promise.resolve({ data: null }),
    ]);
  const { data: person } = participant
    ? await supabase
        .from("people")
        .select("id, name, email")
        .eq("id", participant.person_id)
        .maybeSingle()
    : { data: null };

  const siteUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_EVENTS_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";
  const link = `${siteUrl}/sign/${c.share_token}`;

  const editable = c.status === "draft" || c.status === "sent";
  const isSigned = c.status === "signed";

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/contracts">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Contract
        </div>
        <a
          className="icon-btn"
          href={`/sign/${c.share_token}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open signing page"
        >
          <Icon.share />
        </a>
      </header>

      <div className="page-head">
        <div className="page-head-text">
          <div
            className="eyebrow"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <StatusPill
              status={contractDisplayStatus(c)}
              label={
                c.status === "draft"
                  ? "Draft"
                  : c.status === "void"
                    ? "Voided"
                    : isOpen && c.status === "sent"
                      ? "Open for signatures"
                      : undefined
              }
            />
          </div>
          <h1>{c.title}</h1>
          <div className="sub">
            {isOpen ? (
              <>
                Shared link — <strong>anyone with the link can sign</strong>
              </>
            ) : (
              <>
                For <strong>{person?.name || "Unknown"}</strong>
              </>
            )}
            {event ? ` · ${event.name}` : ""}
            {event && c.show_event_date ? ` · ${fmtDateFull(event.date)}` : ""}
          </div>
        </div>
      </div>

      {(c.status === "sent" || c.status === "draft") && (
        <div style={{ padding: "0 var(--s-5) var(--s-5)" }}>
          {c.opened_at && (
            <div className="notice" style={{ marginBottom: 12 }}>
              Opened {relTime(c.opened_at)}
            </div>
          )}
          <div
            className="card elev"
            style={{
              padding: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: 12,
                background: "var(--hair-2)",
                padding: "8px 12px",
                borderRadius: 8,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "ui-monospace, Menlo, monospace",
                color: "var(--ink-2)",
              }}
            >
              {link}
            </code>
            <CopyButton text={link} />
          </div>
        </div>
      )}

      {isOpen && (
        <div style={{ padding: "0 var(--s-5) var(--s-5)" }}>
          <div className="card elev" style={{ padding: 18 }}>
            <div
              className="muted"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Signatures · {(signatures ?? []).length}
            </div>
            {(signatures ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
                No one has signed yet. Share the link above — everyone who
                signs will appear here.
              </div>
            ) : (
              (signatures ?? []).map((sig) => (
                <Link
                  key={sig.id}
                  href={`/contracts/${c.id}/signatures/${sig.id}`}
                  className="sign-strip"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 0",
                    borderTop: "1px solid var(--hair-2)",
                  }}
                  title="View the signed document"
                >
                  {sig.signature_url && (
                    <img
                      src={sig.signature_url}
                      alt={`Signature of ${sig.signed_name}`}
                      className="sign-image"
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sign-name">{sig.signed_name}</div>
                    <div className="sign-when">
                      {sig.signer_email ? `${sig.signer_email} · ` : ""}
                      {relTime(sig.signed_at)}
                    </div>
                    {sig.signer_ip && (
                      <div
                        className="sign-when"
                        style={{ marginTop: 4, color: "var(--ink-4)" }}
                      >
                        IP {sig.signer_ip}
                      </div>
                    )}
                  </div>
                  <Icon.chev style={{ color: "var(--ink-4)" }} />
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {isSigned && c.signed_name && (
        <div style={{ padding: "0 var(--s-5) var(--s-5)" }}>
          <div className="sign-block signed">
            <div className="eyebrow">Signed</div>
            <div className="sign-strip">
              {c.signature_url && (
                <img
                  src={c.signature_url}
                  alt={`Signature of ${c.signed_name}`}
                  className="sign-image"
                />
              )}
              <div>
                <div className="sign-name">{c.signed_name}</div>
                <div className="sign-when">
                  {c.signed_at && relTime(c.signed_at)}
                </div>
                {c.signer_ip && (
                  <div
                    className="sign-when"
                    style={{ marginTop: 4, color: "var(--ink-4)" }}
                  >
                    IP {c.signer_ip}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "0 var(--s-5)" }}>
        {editable ? (
          <ContractEditor
            id={c.id}
            title={c.title}
            bodyMd={c.body_md}
            pdfUrl={c.pdf_url}
            status={c.status}
            isOpen={isOpen}
            paymentRequired={!!c.payment_required}
            showEventDate={c.show_event_date !== false}
            paymentAmount={
              c.payment_amount != null ? Number(c.payment_amount) : null
            }
          />
        ) : (
          <div
            className="card elev"
            style={{ padding: 22, marginBottom: 16 }}
          >
            <div
              className="muted"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Body (read-only)
            </div>
            {c.body_md && c.body_md.trim() !== "" && (
              <div
                className="sign-body"
                style={{ padding: 0, border: "none", background: "transparent" }}
                dangerouslySetInnerHTML={{
                  __html: mdToHtml(c.body_md),
                }}
              />
            )}
            {c.pdf_url && (
              <div style={{ marginTop: 16 }}>
                <a
                  href={c.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  View attached PDF
                </a>
              </div>
            )}
            <div
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTop: "1px solid var(--hair-2)",
              }}
            >
              <DangerZone id={c.id} status={c.status} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function contractDisplayStatus(contract: {
  status: string;
  opened_at?: string | null;
}) {
  if (contract.status === "signed") return "signed";
  if (contract.status === "sent" && contract.opened_at) return "opened";
  if (contract.status === "sent") return "sent";
  if (contract.status === "void") return "wrapped";
  return "unsent";
}

import { CopyButton } from "./copy-button";
import { DangerZone } from "./danger-zone";
