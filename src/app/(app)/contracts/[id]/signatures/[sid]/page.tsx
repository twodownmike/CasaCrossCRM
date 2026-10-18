import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { mdToHtml, fillSignerName } from "@/lib/contracts";
import { fmtDateFull, relTime } from "@/lib/format";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Signed document — Casa Cross" };

export default async function SignedDocumentPage({
  params,
}: {
  params: { id: string; sid: string };
}) {
  const supabase = createClient();
  const [{ data: c }, { data: sig }] = await Promise.all([
    supabase.from("contracts").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("contract_signatures")
      .select("*")
      .eq("id", params.sid)
      .maybeSingle(),
  ]);
  if (!c || !sig || sig.contract_id !== c.id) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, date")
    .eq("id", c.event_id)
    .maybeSingle();

  // Signatures made before snapshots existed fall back to the current
  // contract body with the signer's name filled in.
  const bodyMd =
    sig.body_md_snapshot ?? fillSignerName(c.body_md, sig.signed_name);

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/contracts/${c.id}`}>
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Signed document
        </div>
        <span />
      </header>

      <div className="page-head print-hide">
        <div className="page-head-text">
          <div className="eyebrow">Signed by</div>
          <h1>{sig.signed_name}</h1>
          <div className="sub">
            {c.title}
            {event ? ` · ${event.name}` : ""}
          </div>
        </div>
        <div className="page-head-actions">
          <PrintButton />
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <article className="card elev signed-doc" style={{ padding: 32, marginBottom: 24 }}>
          <header
            style={{
              textAlign: "center",
              paddingBottom: 20,
              marginBottom: 24,
              borderBottom: "1px solid var(--hair)",
            }}
          >
            <div
              className="eyebrow"
              style={{ marginBottom: 8 }}
            >
              Casa Cross Events
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--serif-display)",
                fontWeight: 400,
                fontSize: 30,
                letterSpacing: "-0.01em",
              }}
            >
              {c.title}
            </h1>
            {event && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "var(--ink-3)",
                  fontFamily: "var(--serif)",
                }}
              >
                {event.name}{c.show_event_date ? ` · ${fmtDateFull(event.date)}` : ""}
              </div>
            )}
          </header>

          {bodyMd.trim() !== "" && (
            <div
              className="sign-body"
              style={{ padding: 0, border: "none", background: "transparent" }}
              dangerouslySetInnerHTML={{ __html: mdToHtml(bodyMd) }}
            />
          )}
          {c.pdf_url && (
            <div className="print-hide" style={{ marginTop: bodyMd.trim() !== "" ? 16 : 0 }}>
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
            className="signed-doc-signature"
            style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: "1px solid var(--hair)",
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Signed
            </div>
            <div className="sign-strip">
              {sig.signature_url && (
                <img
                  src={sig.signature_url}
                  alt={`Signature of ${sig.signed_name}`}
                  className="sign-image"
                  style={{ background: "white" }}
                />
              )}
              <div>
                <div className="sign-name">{sig.signed_name}</div>
                <div className="sign-when">
                  {sig.signer_email ? `${sig.signer_email} · ` : ""}
                  {fmtDateFull(sig.signed_at.slice(0, 10))}{" "}
                  <span className="print-hide">({relTime(sig.signed_at)})</span>
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
            </div>
            <p
              style={{
                marginTop: 18,
                marginBottom: 0,
                fontSize: 10.5,
                lineHeight: 1.5,
                color: "var(--ink-4)",
              }}
            >
              Signed electronically via casacross.org. Document ID {sig.id} ·
              Recorded {new Date(sig.signed_at).toISOString()}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
