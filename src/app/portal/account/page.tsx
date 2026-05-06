import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePortalProfile } from "@/app/portal-actions";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function PortalAccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login?next=/portal/account");

  const { data: access } = await supabase
    .from("portal_users")
    .select("email, first_name, last_name, phone, display_name, communication_opt_in")
    .eq("active", true)
    .limit(1)
    .maybeSingle();
  if (!access) redirect("/portal");

  return (
    <div>
      <header className="app-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <Link className="icon-btn" href="/portal">
          <Icon.back />
        </Link>
        <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15 }}>
          Portal profile
        </div>
        <div style={{ width: 36 }} />
      </header>

      <h1>
        Your <em>profile</em>
      </h1>
      <p className="muted" style={{ lineHeight: 1.55, marginTop: 8 }}>
        These details are used only for your Casa Cross portal access and event
        communication.
      </p>

      <form action={updatePortalProfile} className="form-grid" style={{ marginTop: 18 }}>
        <div>
          <label className="form-label">Email</label>
          <input className="input" value={access.email} readOnly />
        </div>
        <div className="form-row">
          <div>
            <label className="form-label">First name</label>
            <input
              name="first_name"
              className="input"
              required
              defaultValue={access.first_name || ""}
            />
          </div>
          <div>
            <label className="form-label">Last name</label>
            <input
              name="last_name"
              className="input"
              required
              defaultValue={access.last_name || ""}
            />
          </div>
        </div>
        <div>
          <label className="form-label">Preferred display name</label>
          <input
            name="display_name"
            className="input"
            defaultValue={access.display_name || ""}
          />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input name="phone" className="input" defaultValue={access.phone || ""} />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: 12,
            border: "1px solid var(--hair)",
            borderRadius: "var(--r-2)",
            background: "var(--paper)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            name="communication_opt_in"
            defaultChecked={Boolean(access.communication_opt_in)}
            style={{ marginTop: 2 }}
          />
          <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
            Send me event reminders and portal updates by email
          </span>
        </label>
        <button className="btn primary" type="submit">
          Save profile
        </button>
      </form>
    </div>
  );
}
