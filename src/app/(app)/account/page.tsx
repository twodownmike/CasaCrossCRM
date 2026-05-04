import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/home">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Account
        </div>
        <div style={{ width: 36 }} />
      </header>

      <div className="page-head">
        <div className="eyebrow">Signed in as</div>
        <h1 style={{ fontSize: 24 }}>{user?.email}</h1>
      </div>

      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          <div className="card-row" style={{ cursor: "default" }}>
            <Icon.mail style={{ color: "var(--ink-4)" }} />
            <div style={{ flex: 1, fontSize: 14 }}>{user?.email}</div>
          </div>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>More</h2>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {[
            {
              href: "/admin",
              icon: "gear" as const,
              title: "Studio admin",
              sub: "Settings, team, templates",
            },
            {
              href: "/contracts",
              icon: "doc" as const,
              title: "Contracts",
              sub: "Booking agreements + e-sign",
            },
            {
              href: "/forms",
              icon: "doc" as const,
              title: "Custom forms",
              sub: "Public intake forms",
            },
          ].map((it) => {
            const Ico = Icon[it.icon];
            return (
              <Link key={it.href} href={it.href} className="card-row">
                <span
                  className="avatar"
                  style={{
                    background: "var(--hair-2)",
                    color: "var(--ink-2)",
                  }}
                >
                  <Ico />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {it.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-3)",
                      marginTop: 2,
                    }}
                  >
                    {it.sub}
                  </div>
                </div>
                <Icon.chev style={{ color: "var(--ink-4)" }} />
              </Link>
            );
          })}
        </div>
      </div>

      <form action="/auth/signout" method="post" className="signout-row">
        <button className="btn block" type="submit">
          <Icon.exit /> Sign out
        </button>
      </form>

      <p
        className="muted"
        style={{ textAlign: "center", fontSize: 12, padding: "0 var(--s-5)" }}
      >
        Casa Cross CRM · Built with care.
      </p>
    </div>
  );
}
