import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { mdToHtml } from "@/lib/contracts";
import { fmtDateFull, fmtMoney } from "@/lib/format";
import { SignPad } from "./sign-pad";
import type { ContractTokenView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Review & sign — Casa Cross" };

export default async function SignPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_contract_by_token", {
    token: params.token,
  });
  if (error) {
    console.error("get_contract_by_token failed", error);
  }
  const contract = (data as ContractTokenView | null) || null;
  if (!contract) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: isTeamMember } = user
    ? await supabase.rpc("is_team_member")
    : { data: false };
  if (!isTeamMember && !contract.opened_at && contract.status === "sent") {
    await supabase.rpc("mark_contract_opened", { token: params.token });
  }

  const html = mdToHtml(contract.body_md);
  const signed = contract.status === "signed";
  const isVoid = contract.status === "void";
  const hasPdf = !!contract.pdf_url;

  return (
    <div className="sign-shell">
      <header className="sign-header">
        <Logo variant="header" />
        <span
          className={`pill ${signed ? "confirmed" : isVoid ? "wrapped" : "planning"}`}
        >
          <span className="dot" />
          {signed ? "Signed" : isVoid ? "Voided" : "Awaiting signature"}
        </span>
      </header>

      <article className="sign-doc">
        <div className="sign-meta">
          <div>
            <div className="eyebrow">For</div>
            <div className="ival">{contract.recipient_name}</div>
          </div>
          <div>
            <div className="eyebrow">Event</div>
            <div className="ival">{contract.event_name}</div>
          </div>
          <div>
            <div className="eyebrow">Date</div>
            <div className="ival">{fmtDateFull(contract.event_date)}</div>
          </div>
        </div>

        <h1 className="sign-title">{contract.title}</h1>

        {contract.body_md && contract.body_md.trim() !== "" && (
          <div
            className="sign-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {hasPdf && (
          <div
            className="sign-pdf-wrap"
            style={{ marginTop: contract.body_md ? 18 : 0 }}
          >
            <iframe
              src={contract.pdf_url!}
              title={contract.title}
              className="sign-pdf"
            />
            <div className="sign-pdf-actions">
              <a
                href={contract.pdf_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="btn sm"
              >
                Open PDF in new tab
              </a>
              <a href={contract.pdf_url!} download className="btn sm">
                Download
              </a>
            </div>
          </div>
        )}

        {signed ? (
          <>
            <div className="sign-block signed">
              <div className="eyebrow">Signed</div>
              <div className="sign-strip">
                {contract.signature_url && (
                  <img
                    src={contract.signature_url}
                    alt={`Signature of ${contract.signed_name}`}
                    className="sign-image"
                  />
                )}
                <div>
                  <div className="sign-name">{contract.signed_name}</div>
                  <div className="sign-when">
                    {contract.signed_at &&
                      fmtDateFull(contract.signed_at.slice(0, 10))}
                  </div>
                </div>
              </div>
            </div>
            {contract.payment_required && contract.studio_venmo_url && (
              <div
                className="sign-block"
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--hair)",
                  textAlign: "center",
                  padding: 28,
                }}
              >
                <div
                  className="eyebrow"
                  style={{ marginBottom: 14 }}
                >
                  One last thing
                </div>
                <h2
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "var(--serif-display)",
                    fontWeight: 400,
                    fontSize: 28,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Send your payment
                </h2>
                {contract.payment_amount != null && (
                  <div
                    className="money"
                    style={{
                      fontSize: 36,
                      margin: "10px 0 6px",
                    }}
                  >
                    {fmtMoney(Number(contract.payment_amount))}
                  </div>
                )}
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    margin: "0 0 22px",
                    color: "var(--ink-3)",
                    fontFamily: "var(--serif)",
                  }}
                >
                  Pay {contract.studio_name || "Casa Cross Events"} via
                  Venmo to confirm your booking.
                </p>
                <a
                  className="btn primary"
                  href={contract.studio_venmo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#3D95CE",
                    borderColor: "#3D95CE",
                    padding: "14px 28px",
                    fontSize: 15,
                  }}
                >
                  Pay with Venmo
                </a>
                <p
                  className="muted"
                  style={{ fontSize: 11, marginTop: 16, lineHeight: 1.5 }}
                >
                  Opens venmo.com — please include the event name in the
                  note so we can match it to your booking.
                </p>
              </div>
            )}
          </>
        ) : isVoid ? (
          <div className="notice warn" style={{ marginTop: 24 }}>
            This contract has been voided and is no longer available to sign.
          </div>
        ) : (
          <SignPad token={params.token} />
        )}
      </article>

      <footer className="sign-footer">
        <span>© {new Date().getFullYear()} Casa Cross Events</span>
      </footer>
    </div>
  );
}
