import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalSignupForm } from "./portal-signup-form";

export const dynamic = "force-dynamic";

export default async function PortalSignupPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token || "";
  if (!token) notFound();

  const supabase = createClient();
  const { data: inviteRows } = await supabase.rpc("get_portal_invite", {
    invite_token: token,
  });
  const invite = inviteRows?.[0];
  if (!invite) notFound();

  return (
    <div>
      <h1>
        Create your <em>portal</em>
      </h1>
      <p className="muted" style={{ lineHeight: 1.55, marginTop: 8 }}>
        Confirm your details and we&apos;ll email a secure magic link to open
        your Casa Cross portal.
      </p>
      <PortalSignupForm
        token={token}
        email={invite.email}
        expiresAt={invite.expires_at}
      />
    </div>
  );
}
