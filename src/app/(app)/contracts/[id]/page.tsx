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

  const [{ data: event }, { data: participant }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, date")
      .eq("id", c.event_id)
      .maybeSingle(),
    supabase
      .from("participants")
      .select("id, person_id")
      .eq("id", c.participant_id)
      .maybeSingle(),
  ]);
  const { data: person } = participant
    ? await supabase
        .from("people")
        .select("id, name, email")
        .eq("id", participant.person_id)
        .maybeSingle()
    : { data: null };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
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
              status={
                c.status === "signed"
                  ? "signed"
                  : c.status === "sent"
                    ? "sent"
                    : c.status === "void"
                      ? "wrapped"
                      : "unsent"
              }
              label={
                c.status === "draft"
                  ? "Draft"
                  : c.status === "void"
                    ? "Voided"
                    : undefined
              }
            />
          </div>
          <h1>{c.title}</h1>
          <div className="sub">
            For <strong>{person?.name || "Unknown"}</strong>
            {event ? ` · ${event.name}` : ""}
            {event ? ` · ${fmtDateFull(event.date)}` : ""}
          </div>
        </div>
      </div>

      {(c.status === "sent" || c.status === "draft") && (
        <div style={{ padding: "0 var(--s-5) var(--s-5)" }}>
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
            paymentRequired={!!c.payment_required}
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
          </div>
        )}
      </div>
    </div>
  );
}

import { CopyButton } from "./copy-button";
