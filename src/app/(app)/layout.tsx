import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Fab } from "@/components/fab";
import { TopProgress } from "@/components/top-progress";
import {
  DesktopSidebar,
  type SidebarPin,
} from "@/components/desktop-sidebar";
import { DesktopTopbar } from "@/components/desktop-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sidebar data — fetched once per nav, kept lean.
  const today = new Date().toISOString().slice(0, 10);
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 3600 * 1000,
  ).toISOString();

  const [
    { count: upcomingCountReal },
    { count: peopleCount },
    { count: messageCount },
    { data: pinned },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .neq("status", "wrapped"),
    supabase.from("people").select("*", { count: "exact", head: true }),
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gt("created_at", fourteenDaysAgo),
    supabase
      .from("events")
      .select("id, name, date, cover, cover_image_url")
      .neq("status", "wrapped")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(3),
  ]);

  const sidebarPins: SidebarPin[] = (pinned ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    date: p.date,
    cover: p.cover,
    cover_image_url: p.cover_image_url,
  }));

  return (
    <div className="phone-frame">
      <Suspense fallback={null}>
        <TopProgress />
      </Suspense>

      {/* Mobile chrome */}
      <AppHeader />

      {/* Desktop chrome (hidden under 1024px via CSS) */}
      <DesktopSidebar
        upcomingCount={upcomingCountReal ?? 0}
        peopleCount={peopleCount ?? 0}
        messageCount={messageCount ?? 0}
        pinned={sidebarPins}
        user={{
          name:
            (user.user_metadata?.name as string) ||
            user.email?.split("@")[0] ||
            "Anna",
          email: user.email ?? null,
        }}
      />
      <DesktopTopbar />

      <div className="scroll">{children}</div>

      <Fab />
      <BottomNav />
    </div>
  );
}
