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

      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Signed by</div>
          <h1>{sig.signed_name}</h1>
          <div className="sub">
            {c.title}
            {event ? ` · ${event.name}` : ""}
            {event ? ` · ${fmtDateFull(event.date)}` : ""}
          </div>
        </div>
        <div className="page-head-actions">
          <PrintButton />
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="sign-block signed" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Signature</div>
          <div className="sign-strip">
            {sig.signature_url && (
              <img
                src={sig.signature_url}
                alt={`Signature of ${sig.signed_name}`}
                className="sign-image"
              />
            )}
            <div>
              <div className="sign-name">{sig.signed_name}</div>
              <div className="sign-when">
                {sig.signer_email ? `${sig.signer_email} · ` : ""}
                {fmtDateFull(sig.signed_at.slice(0, 10))} (
                {relTime(sig.signed_at)})
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
        </div>

        <div className="card elev" style={{ padding: 22, marginBottom: 24 }}>
          {bodyMd.trim() !== "" && (
            <div
              className="sign-body"
              style={{ padding: 0, border: "none", background: "transparent" }}
              dangerouslySetInnerHTML={{ __html: mdToHtml(bodyMd) }}
            />
          )}
          {c.pdf_url && (
            <div style={{ marginTop: bodyMd.trim() !== "" ? 16 : 0 }}>
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
      </div>
    </div>
  );
}
