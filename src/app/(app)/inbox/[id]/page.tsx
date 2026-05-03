import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { RolePill, StatusPill } from "@/components/pill";
import { relTime } from "@/lib/format";
import { approveSubmission, archiveSubmission } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SubmissionDetail({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: sub } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!sub) notFound();

  const isPending = sub.status === "pending";

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/inbox">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Application
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div
        style={{
          padding: "var(--s-7) var(--s-5) var(--s-5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <RolePill role={sub.role} />
          {sub.status !== "pending" && (
            <StatusPill
              status={sub.status === "approved" ? "confirmed" : "wrapped"}
              label={
                sub.status === "approved" ? "Approved" : "Archived"
              }
            />
          )}
        </div>
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: "-0.01em",
            margin: "8px 0 4px",
          }}
        >
          {sub.preferred_name || sub.name}
        </h1>
        {sub.legal_name &&
          sub.legal_name !== (sub.preferred_name || sub.name) && (
            <div
              className="muted"
              style={{ fontSize: 12, marginBottom: 2 }}
            >
              Legal: {sub.legal_name}
            </div>
          )}
        <div className="muted" style={{ fontSize: 12 }}>
          Submitted {relTime(sub.created_at)}
          {sub.location ? ` · ${sub.location}` : ""}
        </div>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {sub.email && (
            <div className="card-row" style={{ cursor: "default" }}>
              <Icon.mail style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>
                <a href={`mailto:${sub.email}`}>{sub.email}</a>
              </div>
            </div>
          )}
          {sub.phone && (
            <div className="card-row" style={{ cursor: "default" }}>
              <Icon.phone style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>
                <a href={`tel:${sub.phone}`}>{sub.phone}</a>
              </div>
            </div>
          )}
          {sub.instagram && (
            <div className="card-row" style={{ cursor: "default" }}>
              <Icon.ig style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>{sub.instagram}</div>
            </div>
          )}
          {sub.portfolio_url && (
            <div className="card-row" style={{ cursor: "default" }}>
              <Icon.doc style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>
                <a
                  href={sub.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {sub.portfolio_url}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {sub.specialty && (
        <div style={{ padding: "20px var(--s-5) 0" }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 8,
            }}
          >
            Specialty
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ink-2)",
            }}
          >
            {sub.specialty}
          </div>
        </div>
      )}

      {sub.message && (
        <div style={{ padding: "20px var(--s-5) 0" }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontWeight: 500,
              fontSize: 15,
              marginBottom: 8,
            }}
          >
            Their note
          </div>
          <div
            className="card elev"
            style={{
              padding: 16,
              fontFamily: "var(--serif)",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--ink-2)",
              whiteSpace: "pre-wrap",
            }}
          >
            {sub.message}
          </div>
        </div>
      )}

      <div
        style={{
          padding: "24px var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {isPending ? (
          <>
            <form action={approveSubmission}>
              <input type="hidden" name="id" value={sub.id} />
              <button className="btn primary block" type="submit">
                <Icon.plus /> Approve & add to People
              </button>
            </form>
            <form action={archiveSubmission}>
              <input type="hidden" name="id" value={sub.id} />
              <button
                className="btn block"
                type="submit"
                style={{ color: "var(--ink-3)" }}
              >
                Archive
              </button>
            </form>
          </>
        ) : sub.converted_person_id ? (
          <Link
            className="btn primary block"
            href={`/people/${sub.converted_person_id}`}
          >
            View their profile
          </Link>
        ) : null}
      </div>
    </div>
  );
}
