import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson } from "@/lib/queries";
import { fmtMoney, fmtDate, relTime } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { StatusPill, RolePill } from "@/components/pill";
import { Icon } from "@/components/icons";
import { PersonTabs } from "./person-tabs";
import { AddNoteForm } from "./add-note-form";
import { createClient } from "@/lib/supabase/server";
import {
  grantPortalAccess,
  resendPortalInvite,
  revokePortalAccess,
} from "@/app/portal-actions";
import { CopyInviteLink } from "./copy-invite-link";

export const dynamic = "force-dynamic";

export default async function PersonDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const data = await getPerson(params.id);
  if (!data) notFound();
  const { person: p, events, notes } = data;
  const tab = searchParams.tab || "about";

  let totalRate = 0;
  let totalPaid = 0;
  events.forEach((e) => {
    const part = e.participants.find((x) => x.person_id === p.id);
    if (part) {
      totalRate += Number(part.rate);
      totalPaid += Number(part.paid);
    }
  });

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/people">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Contact
        </div>
        <Link className="icon-btn" href={`/people/${p.id}/edit`}>
          <Icon.doc />
        </Link>
      </header>

      <div
        style={{
          padding: "var(--s-7) var(--s-5) var(--s-5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Avatar person={p} size="xl" />
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 400,
            fontSize: 28,
            letterSpacing: "-0.01em",
            margin: "16px 0 6px",
          }}
        >
          {p.name}
        </h1>
        <div style={{ marginBottom: 10 }}>
          <RolePill role={p.role} />
        </div>
        {p.specialty && (
          <div
            style={{
              fontSize: 13.5,
              color: "var(--ink-2)",
              fontWeight: 500,
              marginBottom: p.bio ? 8 : 0,
              maxWidth: 320,
            }}
          >
            {p.specialty}
          </div>
        )}
        {p.bio && (
          <div
            className="muted"
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              maxWidth: 320,
              fontFamily: "var(--serif)",
              fontStyle: "italic",
            }}
          >
            {p.bio}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          {p.phone && (
            <a className="btn sm" href={`tel:${p.phone}`}>
              <Icon.phone /> Call
            </a>
          )}
          {p.email && (
            <a className="btn sm" href={`mailto:${p.email}`}>
              <Icon.mail /> Email
            </a>
          )}
        </div>
      </div>

      <PersonTabs personId={p.id} active={tab} eventCount={events.length} />

      {tab === "about" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="card elev">
            {p.source_submission_id && (p.first_name || p.last_name) && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.people
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--ink-4)",
                  }}
                />
                <div style={{ flex: 1, fontSize: 14 }}>
                  {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                  <div
                    style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}
                  >
                    First and last name from application
                  </div>
                </div>
              </div>
            )}
            {p.legal_name && p.legal_name !== p.name && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.doc style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, fontSize: 14 }}>
                  {p.legal_name}
                  <div
                    style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}
                  >
                    Legal name
                  </div>
                </div>
              </div>
            )}
            {p.preferred_name && p.preferred_name !== p.name && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.check style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, fontSize: 14 }}>
                  {p.preferred_name}
                  <div
                    style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}
                  >
                    Preferred or business name
                  </div>
                </div>
              </div>
            )}
            {p.email && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.mail style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, fontSize: 14 }}>{p.email}</div>
              </div>
            )}
            {p.phone && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.phone style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, fontSize: 14 }}>{p.phone}</div>
              </div>
            )}
            {p.instagram && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.ig style={{ color: "var(--ink-4)" }} />
                <div style={{ flex: 1, fontSize: 14 }}>{p.instagram}</div>
              </div>
            )}
            {p.location && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.pin
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--ink-4)",
                  }}
                />
                <div style={{ flex: 1, fontSize: 14 }}>{p.location}</div>
              </div>
            )}
            {p.joined_at && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.clock
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--ink-4)",
                  }}
                />
                <div style={{ flex: 1, fontSize: 14 }}>
                  Joined {fmtDate(p.joined_at)}
                </div>
              </div>
            )}
            {p.source_submission_id && (
              <div className="card-row" style={{ cursor: "default" }}>
                <Icon.check
                  style={{
                    width: 16,
                    height: 16,
                    color: p.future_projects_opt_in
                      ? "var(--sage)"
                      : "var(--ink-4)",
                  }}
                />
                <div style={{ flex: 1, fontSize: 14 }}>
                  Future events: {p.future_projects_opt_in ? "Yes" : "No"}
                  <div
                    style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}
                  >
                    Created from application form
                  </div>
                </div>
              </div>
            )}
          </div>
          <PortalAccessPanel
            personId={p.id}
            personName={p.name}
            defaultEmail={p.email}
          />
        </div>
      )}

      {tab === "events" && (
        <div
          className="fade-in"
          style={{
            padding: "var(--s-5)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {events.map((e) => {
            const part = e.participants.find((x) => x.person_id === p.id);
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="card elev"
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "1px solid var(--hair)",
                  padding: 0,
                  background: "var(--paper)",
                  display: "block",
                }}
              >
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div
                    className={e.cover_image_url ? "" : `cover-${e.cover || "modern"}`}
                    style={{
                      width: 70,
                      flexShrink: 0,
                      backgroundImage: e.cover_image_url
                        ? `url(${e.cover_image_url})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div style={{ flex: 1, padding: 14 }}>
                    <div className="row between">
                      <div
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-4)",
                          fontWeight: 500,
                        }}
                      >
                        {fmtDate(e.date, { weekday: true, short: true })}
                      </div>
                      <StatusPill status={e.status} />
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontWeight: 500,
                        fontSize: 16,
                        marginTop: 4,
                      }}
                    >
                      {e.name}
                    </div>
                    {part && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-3)",
                          marginTop: 4,
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {Number(part.rate) > 0 ? (
                          <span className="tabnums">
                            {fmtMoney(Number(part.paid))} /{" "}
                            {fmtMoney(Number(part.rate))}
                          </span>
                        ) : (
                          <span>Comp</span>
                        )}
                        <span>·</span>
                        <StatusPill status={part.contract} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {events.length === 0 && (
            <div className="empty">
              <h3>No events yet</h3>
              <div>Book {p.name.split(" ")[0]} for an event.</div>
            </div>
          )}
        </div>
      )}

      {tab === "money" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div
            className="stat-grid"
            style={{ padding: 0, marginBottom: 16 }}
          >
            <div className="stat">
              <div className="label">Earned</div>
              <div className="val tabnums">{fmtMoney(totalPaid)}</div>
              <div className="delta">all-time</div>
            </div>
            <div className="stat">
              <div className="label">Owed</div>
              <div
                className="val tabnums"
                style={{
                  color:
                    totalRate > totalPaid
                      ? "var(--terracotta)"
                      : "var(--ink)",
                }}
              >
                {fmtMoney(totalRate - totalPaid)}
              </div>
              <div className="delta">
                across {events.length}{" "}
                {events.length === 1 ? "event" : "events"}
              </div>
            </div>
          </div>

          <div className="card elev">
            {events.map((e) => {
              const part = e.participants.find((x) => x.person_id === p.id);
              if (!part || Number(part.rate) === 0) return null;
              return (
                <div
                  key={e.id}
                  className="card-row"
                  style={{ cursor: "default" }}
                >
                  <div
                    className={e.cover_image_url ? "" : `cover-${e.cover || "modern"}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--r-2)",
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
                        fontSize: 11.5,
                        color: "var(--ink-3)",
                        marginTop: 2,
                      }}
                    >
                      {fmtDate(e.date, { short: true })} ·{" "}
                      {fmtMoney(Number(part.paid))}/
                      {fmtMoney(Number(part.rate))}
                    </div>
                  </div>
                  <StatusPill status={part.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          {notes.length === 0 && (
            <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
              No notes yet.
            </div>
          )}
          {notes.map((n) => (
            <div
              key={n.id}
              className="card elev"
              style={{ padding: 16, marginBottom: 10 }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                {relTime(n.created_at)}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: "var(--ink-2)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {n.body}
              </div>
            </div>
          ))}
          <AddNoteForm personId={p.id} />
        </div>
      )}
    </div>
  );
}

async function PortalAccessPanel({
  personId,
  personName,
  defaultEmail,
}: {
  personId: string;
  personName: string;
  defaultEmail: string | null;
}) {
  const supabase = createClient();
  const { data: accessRows } = await supabase
    .from("portal_users")
    .select("id, email, display_name, active, setup_completed_at, created_at")
    .eq("person_id", personId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  const { data: inviteRows } = await supabase
    .from("portal_invites")
    .select("id, email, token, expires_at, accepted_at, created_at")
    .eq("person_id", personId)
    .order("created_at", { ascending: false })
    .limit(6);
  const publicUrl =
    process.env.NEXT_PUBLIC_EVENTS_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <div style={{ marginTop: 18 }}>
      <div className="section-label" style={{ marginTop: 0 }}>
        <h2>Portal access</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {(accessRows ?? []).length}
        </span>
      </div>
      <div className="card elev">
        {(accessRows ?? []).length === 0 ? (
          <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 13 }}>
            No active portal access.
          </div>
        ) : (
          (accessRows ?? []).map((row) => (
            <div key={row.id} className="card-row" style={{ cursor: "default" }}>
              <Icon.mail style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {row.email}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                  {row.display_name || personName}
                  {" · "}
                  {row.setup_completed_at ? "setup complete" : "invite sent"}
                </div>
              </div>
              <form action={revokePortalAccess}>
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="person_id" value={personId} />
                <button
                  className="btn sm"
                  type="submit"
                  style={{ color: "var(--terracotta)" }}
                >
                  Revoke
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      <div className="section-label">
        <h2>Invite history</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {(inviteRows ?? []).length}
        </span>
      </div>
      <div className="card elev">
        {(inviteRows ?? []).length === 0 ? (
          <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 13 }}>
            No portal invites sent yet.
          </div>
        ) : (
          (inviteRows ?? []).map((invite) => {
            const expired = new Date(invite.expires_at).getTime() < Date.now();
            const accepted = Boolean(invite.accepted_at);
            const inviteUrl = `${publicUrl}/portal/signup?token=${invite.token}`;
            return (
              <div key={invite.id} className="card-row" style={{ cursor: "default" }}>
                <Icon.send style={{ color: accepted ? "var(--sage)" : "var(--ink-4)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{invite.email}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 3 }}>
                    {accepted
                      ? `Accepted ${relTime(invite.accepted_at)}`
                      : expired
                        ? "Expired"
                        : `Sent ${relTime(invite.created_at)}`}
                  </div>
                </div>
                {!accepted && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <CopyInviteLink url={inviteUrl} />
                    <form action={resendPortalInvite}>
                      <input type="hidden" name="invite_id" value={invite.id} />
                      <input type="hidden" name="person_id" value={personId} />
                      <button className="btn sm" type="submit">
                        Resend
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <form
        action={grantPortalAccess}
        className="form-grid"
        style={{ marginTop: 14 }}
      >
        <input type="hidden" name="person_id" value={personId} />
        <input type="hidden" name="display_name" value={personName} />
        <div>
          <label className="form-label">Invite email</label>
          <input
            name="email"
            type="email"
            required
            className="input"
            defaultValue={defaultEmail || ""}
            placeholder="vendor@example.com"
          />
        </div>
        <button className="btn block" type="submit">
          <Icon.plus /> Send portal invite
        </button>
        <div className="muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
          The invite opens a guided signup. After setup, database policies
          restrict portal users to their own profile, assignments, and contracts.
        </div>
      </form>
    </div>
  );
}
