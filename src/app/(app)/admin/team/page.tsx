import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import { TeamList } from "./team-list";
import { InviteForm } from "./invite-form";

export const dynamic = "force-dynamic";

type TeamRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export default async function TeamPage() {
  const supabase = createClient();
  const { data } = await supabase.rpc("list_team_members");
  const team = (data as TeamRow[] | null) ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user?.id || "";

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
          Team
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1>
          The <em>team</em>
        </h1>
        <div className="sub">
          Anyone here can sign in and edit every part of the CRM. Removing a
          member revokes access immediately.
        </div>
      </div>

      <div className="section-label">
        <h2>Members</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {team.length}
        </span>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <TeamList
          team={team.map((m) => ({
            user_id: m.user_id,
            email: m.email,
            display_name: m.display_name,
            joined: fmtDate(m.created_at.slice(0, 10)),
            isMe: m.user_id === me,
          }))}
        />
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>Add a member</h2>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev" style={{ padding: 18 }}>
          <p
            className="muted"
            style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}
          >
            New members must sign in once at <code>/login</code> first so their
            account exists. Then enter their email here to grant access.
          </p>
          <InviteForm />
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
