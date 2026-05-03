import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Fab } from "@/components/fab";
import { TopProgress } from "@/components/top-progress";

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

  return (
    <div className="phone-frame">
      <Suspense fallback={null}>
        <TopProgress />
      </Suspense>
      <AppHeader />
      <div className="scroll">{children}</div>
      <Fab />
      <BottomNav />
    </div>
  );
}
