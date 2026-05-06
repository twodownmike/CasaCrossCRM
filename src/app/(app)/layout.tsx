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

  const { data: isTeamMember } = await supabase.rpc("is_team_member");
  if (!isTeamMember) redirect("/portal");

  // Sidebar data — fetched once per nav, kept lean.
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: upcomingCountReal },
    { count: peopleCount },
    { data: portalMessages },
    { data: portalReads },
    { count: inboxCount },
    { data: pinned },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .neq("status", "wrapped"),
    supabase.from("people").select("*", { count: "exact", head: true }),
    supabase
      .from("portal_messages")
      .select("event_id, person_id, created_at")
      .eq("sender_kind", "portal")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("portal_thread_reads")
      .select("event_id, person_id, read_at")
      .eq("reader_kind", "team")
      .eq("user_id", user.id),
    supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
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

  const readAtByThread = new Map(
    (portalReads ?? []).map((row) => [
      `${row.event_id}:${row.person_id}`,
      row.read_at,
    ]),
  );
  const messageCount = (portalMessages ?? []).filter((message) => {
    const readAt = readAtByThread.get(
      `${message.event_id}:${message.person_id}`,
    );
    return !readAt || message.created_at > readAt;
  }).length;
  const combinedInboxCount = (inboxCount ?? 0) + messageCount;

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
        inboxCount={combinedInboxCount}
        pinned={sidebarPins}
        user={{
          name:
            (user.user_metadata?.name as string) ||
            user.email?.split("@")[0] ||
            "Casa Cross",
          email: user.email ?? null,
        }}
      />
      <DesktopTopbar />

      <div className="scroll">{children}</div>

      <Fab />
      <BottomNav inboxCount={combinedInboxCount} />
    </div>
  );
}
