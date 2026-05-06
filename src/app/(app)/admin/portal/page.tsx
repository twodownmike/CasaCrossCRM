import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { fmtDate, relTime } from "@/lib/format";
import {
  resendPortalInvite,
  revokePortalAccess,
  cancelPortalInvite,
} from "@/app/portal-actions";
import { CopyInviteLink } from "../../people/[id]/copy-invite-link";

export const dynamic = "force-dynamic";

type PortalUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  person_id: string;
  setup_completed_at: string | null;
  created_at: string;
  active: boolean;
};

type PortalInviteRow = {
  id: string;
  email: string;
  person_id: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

type PersonLookup = { id: string; name: string };

function inviteState(row: PortalInviteRow): "accepted" | "expired" | "pending" {
  if (row.accepted_at) return "accepted";
  if (new Date(row.expires_at).getTime() < Date.now()) return "expired";
  return "pending";
}

export default async function PortalAdminPage() {
  const supabase = createClient();
  const publicUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_EVENTS_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";

  const [{ data: usersRaw }, { data: invitesRaw }] = await Promise.all([
    supabase
      .from("portal_users")
      .select(
        "id, email, display_name, person_id, setup_completed_at, created_at, active",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("portal_invites")
      .select("id, email, person_id, token, expires_at, accepted_at, created_at")
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const users = (usersRaw ?? []) as PortalUserRow[];
  const invites = (invitesRaw ?? []) as PortalInviteRow[];

  const personIds = Array.from(
    new Set([...users.map((u) => u.person_id), ...invites.map((i) => i.person_id)]),
  );
  const peopleById = new Map<string, string>();
  if (personIds.length > 0) {
    const { data: people } = await supabase
      .from("people")
      .select("id, name")
      .in("id", personIds);
    (people as PersonLookup[] | null)?.forEach((p) =>
      peopleById.set(p.id, p.name),
    );
  }

  const activeUsers = users.filter((u) => u.active);
  const inactiveUsers = users.filter((u) => !u.active);

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/admin">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Portal
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1>
          Portal <em>access</em>
        </h1>
        <div className="sub">
          Everyone who can sign into the client portal. Grant access from a
          contact&rsquo;s page; revoke or resend invites here.
        </div>
      </div>

      <div className="section-label">
        <h2>Active members</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {activeUsers.length}
        </span>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {activeUsers.length === 0 ? (
            <div
              style={{ padding: 16, color: "var(--ink-3)", fontSize: 13 }}
            >
              No active portal members yet.
            </div>
          ) : (
            activeUsers.map((u) => {
              const personName = peopleById.get(u.person_id);
              return (
                <div
                  key={u.id}
                  className="card-row"
                  style={{ cursor: "default" }}
                >
                  <Icon.mail style={{ color: "var(--ink-4)" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {u.display_name || personName || u.email}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-4)",
                        marginTop: 3,
                      }}
                    >
                      {u.email}
                      {" · "}
                      {u.setup_completed_at
                        ? `joined ${relTime(u.setup_completed_at)}`
                        : "invite accepted, setup pending"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {personName && (
                      <Link
                        className="btn sm"
                        href={`/people/${u.person_id}?tab=portal`}
                      >
                        View
                      </Link>
                    )}
                    <form action={revokePortalAccess}>
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="hidden"
                        name="person_id"
                        value={u.person_id}
                      />
                      <button
                        className="btn sm"
                        type="submit"
                        style={{ color: "var(--terracotta)" }}
                      >
                        Revoke
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>Pending invites</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {invites.length}
        </span>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {invites.length === 0 ? (
            <div
              style={{ padding: 16, color: "var(--ink-3)", fontSize: 13 }}
            >
              No invites waiting to be accepted.
            </div>
          ) : (
            invites.map((invite) => {
              const state = inviteState(invite);
              const personName = peopleById.get(invite.person_id);
              const inviteUrl = `${publicUrl}/portal/signup?token=${invite.token}`;
              return (
                <div
                  key={invite.id}
                  className="card-row"
                  style={{ cursor: "default" }}
                >
                  <Icon.send
                    style={{
                      color:
                        state === "expired"
                          ? "var(--terracotta)"
                          : "var(--ink-4)",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {personName || invite.email}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--ink-4)",
                        marginTop: 3,
                      }}
                    >
                      {invite.email}
                      {" · "}
                      {state === "expired"
                        ? `expired ${relTime(invite.expires_at)}`
                        : `sent ${relTime(invite.created_at)}, expires ${fmtDate(invite.expires_at.slice(0, 10))}`}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                    }}
                  >
                    {state !== "expired" && <CopyInviteLink url={inviteUrl} />}
                    <form action={resendPortalInvite}>
                      <input
                        type="hidden"
                        name="invite_id"
                        value={invite.id}
                      />
                      <input
                        type="hidden"
                        name="person_id"
                        value={invite.person_id}
                      />
                      <button className="btn sm" type="submit">
                        Resend
                      </button>
                    </form>
                    <form action={cancelPortalInvite}>
                      <input
                        type="hidden"
                        name="invite_id"
                        value={invite.id}
                      />
                      <input
                        type="hidden"
                        name="person_id"
                        value={invite.person_id}
                      />
                      <button
                        className="btn sm"
                        type="submit"
                        style={{ color: "var(--terracotta)" }}
                      >
                        Cancel
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {inactiveUsers.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 28 }}>
            <h2>Revoked</h2>
            <span className="muted" style={{ fontSize: 12 }}>
              {inactiveUsers.length}
            </span>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <div className="card elev">
              {inactiveUsers.map((u) => {
                const personName = peopleById.get(u.person_id);
                return (
                  <div
                    key={u.id}
                    className="card-row"
                    style={{ cursor: "default", opacity: 0.7 }}
                  >
                    <Icon.mail style={{ color: "var(--ink-4)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {u.display_name || personName || u.email}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-4)",
                          marginTop: 3,
                        }}
                      >
                        {u.email} · revoked
                      </div>
                    </div>
                    {personName && (
                      <Link
                        className="btn sm"
                        href={`/people/${u.person_id}?tab=portal`}
                      >
                        View
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
