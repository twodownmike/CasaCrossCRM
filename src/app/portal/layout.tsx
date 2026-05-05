import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/portal");

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 760 }}>
        <div className="brand" style={{ justifyContent: "center" }}>
          <Logo variant="auth" />
        </div>
        {children}
      </div>
    </div>
  );
}
