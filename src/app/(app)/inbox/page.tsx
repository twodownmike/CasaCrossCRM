import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { RolePill } from "@/components/pill";
import { relTime } from "@/lib/format";
import { InboxTabs } from "./inbox-tabs";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = searchParams.filter || "pending";
  const supabase = createClient();
  const { data: subs } = await supabase
    .from("submissions")
    .select("*")
    .eq("status", filter)
    .order("created_at", { ascending: false });

  const { count: pendingCount } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Intake</div>
          <h1>
            Inbox <em>·</em>{" "}
            <span style={{ fontStyle: "normal" }}>
              {pendingCount ?? 0} pending
            </span>
          </h1>
          <div className="sub">
            People who&apos;ve filled out the public application form.
          </div>
        </div>
        <div className="page-head-actions">
          <ShareApplyLinkButton />
        </div>
      </div>

      <InboxTabs filter={filter} />

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {(subs ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/inbox/${s.id}`}
              className="card-row"
              style={{
                alignItems: "flex-start",
                paddingTop: 14,
                paddingBottom: 14,
              }}
            >
              <span
                className="avatar"
                style={{
                  background: "var(--terracotta-tint)",
                  color: "var(--terracotta)",
                }}
              >
                <Icon.mail />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {s.name}
                  </span>
                  <RolePill role={s.role} />
                </div>
                {s.specialty && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--ink-3)",
                      marginTop: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {s.specialty}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-4)",
                    marginTop: 6,
                  }}
                >
                  {relTime(s.created_at)}
                  {s.location ? ` · ${s.location}` : ""}
                </div>
              </div>
              <Icon.chev style={{ color: "var(--ink-4)", marginTop: 8 }} />
            </Link>
          ))}
          {(subs ?? []).length === 0 && (
            <div
              style={{
                padding: 36,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              {filter === "pending"
                ? "No new applications. Share your apply link to start receiving them."
                : `No ${filter} applications.`}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function ShareApplyLinkButton() {
  return (
    <a
      className="btn"
      href="/apply"
      target="_blank"
      rel="noopener noreferrer"
    >
      View public form ↗
    </a>
  );
}
