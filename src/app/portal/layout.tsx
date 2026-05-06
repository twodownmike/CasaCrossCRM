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

  let portalUser: { display_name: string | null; first_name: string | null; email: string; person_id: string } | null = null;
  let unreadCount = 0;
  if (user?.email) {
    const { data } = await supabase
      .from("portal_users")
      .select("display_name, first_name, email, person_id")
      .eq("active", true)
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    portalUser = data ?? null;
    if (portalUser) {
      const [{ data: messages }, { data: reads }] = await Promise.all([
        supabase
          .from("portal_messages")
          .select("event_id, person_id, created_at")
          .eq("sender_kind", "team")
          .eq("person_id", portalUser.person_id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("portal_thread_reads")
          .select("event_id, person_id, read_at")
          .eq("reader_kind", "portal")
          .eq("user_id", user.id),
      ]);
      const readAtByEvent = new Map(
        (reads ?? []).map((row) => [row.event_id, row.read_at]),
      );
      unreadCount = (messages ?? []).filter((message) => {
        const readAt = readAtByEvent.get(message.event_id);
        return !readAt || message.created_at > readAt;
      }).length;
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 760 }}>
        {portalUser ? (
          <PortalNav user={portalUser} unreadCount={unreadCount} />
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
  unreadCount,
}: {
  user: { display_name: string | null; first_name: string | null; email: string };
  unreadCount: number;
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
          href="/portal/messages"
          className="btn sm"
          aria-label="Messages"
        >
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Icon.chat />
            {unreadCount > 0 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: -7,
                  right: -8,
                  minWidth: 14,
                  height: 14,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "var(--terracotta)",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          Messages
        </Link>
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
