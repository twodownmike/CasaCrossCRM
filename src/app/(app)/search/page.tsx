import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { RolePill, StatusPill } from "@/components/pill";
import { Icon } from "@/components/icons";
import { fmtDate, relTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const supabase = createClient();

  type EventHit = {
    id: string;
    name: string;
    date: string;
    location: string | null;
    cover: string | null;
    cover_image_url: string | null;
    status: string;
  };
  type PersonHit = {
    id: string;
    name: string;
    role: string;
    specialty: string | null;
    location: string | null;
    initials: string | null;
    tint: string | null;
    ink: string | null;
  };
  type SubmissionHit = {
    id: string;
    name: string;
    role: string;
    specialty: string | null;
    status: string;
    created_at: string;
  };

  let events: EventHit[] = [];
  let people: PersonHit[] = [];
  let submissions: SubmissionHit[] = [];

  if (q.length >= 2) {
    const escaped = `%${q.replace(/[%_]/g, (c) => "\\" + c)}%`;
    const [eRes, pRes, sRes] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, date, location, cover, cover_image_url, status")
        .or(
          `name.ilike.${escaped},subtitle.ilike.${escaped},location.ilike.${escaped},description.ilike.${escaped}`,
        )
        .order("date", { ascending: false })
        .limit(20),
      supabase
        .from("people")
        .select("id, name, role, specialty, location, initials, tint, ink")
        .or(
          `name.ilike.${escaped},specialty.ilike.${escaped},location.ilike.${escaped},email.ilike.${escaped},instagram.ilike.${escaped}`,
        )
        .order("name", { ascending: true })
        .limit(20),
      supabase
        .from("submissions")
        .select("id, name, role, specialty, status, created_at")
        .or(
          `name.ilike.${escaped},specialty.ilike.${escaped},email.ilike.${escaped},message.ilike.${escaped}`,
        )
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    events = (eRes.data ?? []) as EventHit[];
    people = (pRes.data ?? []) as PersonHit[];
    submissions = (sRes.data ?? []) as SubmissionHit[];
  }

  const totalHits = events.length + people.length + submissions.length;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Search</div>
          <h1>
            {q ? (
              <>
                Results for <em>“{q}”</em>
              </>
            ) : (
              <>
                Find <em>anything</em>
              </>
            )}
          </h1>
          {q && (
            <div className="sub">
              {totalHits} match{totalHits === 1 ? "" : "es"}
            </div>
          )}
        </div>
      </div>

      <SearchBar initialQ={q} />

      {q.length < 2 ? (
        <div
          className="muted"
          style={{ padding: "20px var(--s-5)", fontSize: 13 }}
        >
          Type at least 2 characters to search across events, people, and
          applications.
        </div>
      ) : totalHits === 0 ? (
        <div className="empty">
          <h3>No matches</h3>
          <div>Try a different search.</div>
        </div>
      ) : (
        <>
          {events.length > 0 && (
            <>
              <div className="section-label">
                <h2>Events</h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {events.length}
                </span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {events.map((e) => (
                    <Link
                      key={e.id}
                      href={`/events/${e.id}`}
                      className="card-row"
                    >
                      <div
                        className={
                          e.cover_image_url
                            ? ""
                            : `cover-${e.cover || "modern"}`
                        }
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          flexShrink: 0,
                          backgroundImage: e.cover_image_url
                            ? `url(${e.cover_image_url})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {e.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-3)",
                            marginTop: 2,
                          }}
                        >
                          {fmtDate(e.date, { short: true })}
                          {e.location ? ` · ${e.location}` : ""}
                        </div>
                      </div>
                      <StatusPill status={e.status} />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {people.length > 0 && (
            <>
              <div className="section-label">
                <h2>People</h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {people.length}
                </span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {people.map((p) => (
                    <Link
                      key={p.id}
                      href={`/people/${p.id}`}
                      className="card-row"
                      style={{ alignItems: "flex-start" }}
                    >
                      <Avatar
                        person={{
                          name: p.name,
                          initials: p.initials,
                          tint: p.tint,
                          ink: p.ink,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            {p.name}
                          </span>
                          <RolePill
                            role={p.role as Parameters<typeof RolePill>[0]["role"]}
                          />
                        </div>
                        {(p.specialty || p.location) && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink-3)",
                              marginTop: 4,
                            }}
                          >
                            {p.specialty || p.location}
                          </div>
                        )}
                      </div>
                      <Icon.chev style={{ color: "var(--ink-4)" }} />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          {submissions.length > 0 && (
            <>
              <div className="section-label">
                <h2>Applications</h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {submissions.length}
                </span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {submissions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/inbox/${s.id}`}
                      className="card-row"
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
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            {s.name}
                          </span>
                          <RolePill
                            role={s.role as Parameters<typeof RolePill>[0]["role"]}
                          />
                          {s.status !== "pending" && (
                            <span
                              className="muted"
                              style={{ fontSize: 11.5 }}
                            >
                              · {s.status}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-3)",
                            marginTop: 4,
                          }}
                        >
                          {s.specialty || relTime(s.created_at)}
                        </div>
                      </div>
                      <Icon.chev style={{ color: "var(--ink-4)" }} />
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

import { SearchBar } from "./search-bar";
