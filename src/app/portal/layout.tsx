import Link from "next/link";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let portalUser: { display_name: string | null; first_name: string | null; email: string } | null = null;
  if (user?.email) {
    const { data } = await supabase
      .from("portal_users")
      .select("display_name, first_name, email")
      .eq("active", true)
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    portalUser = data ?? null;
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 760 }}>
        {portalUser ? (
          <PortalNav user={portalUser} />
        ) : (
          <div className="brand" style={{ justifyContent: "center" }}>
            <Logo variant="auth" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function PortalNav({
  user,
}: {
  user: { display_name: string | null; first_name: string | null; email: string };
}) {
  const greeting = user.first_name || user.display_name?.split(" ")[0] || null;
  return (
    <nav className="portal-nav">
      <Link
        href="/portal"
        aria-label="Casa Cross — portal home"
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        <Logo variant="auth" />
      </Link>
      <div className="portal-nav-actions">
        {greeting && (
          <span
            className="muted"
            style={{ fontSize: 12.5, marginRight: 4 }}
          >
            Hi, {greeting}
          </span>
        )}
        <Link
          href="/portal/account"
          className="btn sm"
          aria-label="Profile"
        >
          <Icon.gear /> Profile
        </Link>
        <form action="/auth/signout" method="post">
          <button
            className="btn sm"
            type="submit"
            aria-label="Sign out"
            style={{ color: "var(--ink-3)" }}
          >
            <Icon.exit />
          </button>
        </form>
      </div>
    </nav>
  );
}
