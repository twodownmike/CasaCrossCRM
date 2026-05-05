import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminHub() {
  const supabase = createClient();
  const [
    { count: contractTemplates },
    { count: forms },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("contract_templates")
      .select("*", { count: "exact", head: true }),
    supabase.from("forms").select("*", { count: "exact", head: true }),
    supabase.from("studio_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const { data: team } = await supabase.rpc("list_team_members");
  const teamCount = (team as Array<unknown> | null)?.length ?? 0;

  const tiles: Array<{
    href: string;
    icon: keyof typeof Icon;
    title: string;
    sub: string;
    count?: string;
    mobileOnly?: boolean;
  }> = [
    {
      href: "/admin/studio",
      icon: "spark",
      title: "Studio settings",
      sub: "Name, contact, public form copy, email signature.",
      count: settings?.studio_name || "Casa Cross Events",
    },
    {
      href: "/admin/team",
      icon: "people",
      title: "Team",
      sub: "Who can sign in and edit the CRM.",
      count: `${teamCount} ${teamCount === 1 ? "member" : "members"}`,
    },
    {
      href: "/contracts/templates",
      icon: "doc",
      title: "Contract templates",
      sub: "Reusable boilerplate with merge fields and PDFs.",
      count: `${contractTemplates ?? 0} saved`,
    },
    {
      href: "/forms",
      icon: "doc",
      title: "Custom forms",
      sub: "Build any intake form, share the link.",
      count: `${forms ?? 0} live`,
    },
    {
      href: "/reports",
      icon: "chart",
      title: "Reports",
      sub: "Revenue, expenses, and booking performance.",
      mobileOnly: true,
    },
  ];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Admin</div>
          <h1>
            Studio <em>settings</em>
          </h1>
          <div className="sub">
            Manage what shows up on public pages, who has access, and the
            templates you reuse.
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "0 var(--s-5)",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
        }}
        className="admin-grid"
      >
        {tiles.map((t) => {
          const Ico = Icon[t.icon];
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`card elev ${t.mobileOnly ? "mobile-only" : ""}`}
              style={{
                display: "flex",
                gap: 14,
                padding: 18,
                alignItems: "flex-start",
                background: "var(--paper)",
              }}
            >
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
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 17,
                    fontWeight: 500,
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: "var(--ink-3)",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {t.sub}
                </div>
                {t.count && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-4)",
                      marginTop: 8,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {t.count}
                  </div>
                )}
              </div>
              <Icon.chev style={{ color: "var(--ink-4)" }} />
            </Link>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
