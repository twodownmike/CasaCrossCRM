import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { StudioForm } from "./studio-form";

export const dynamic = "force-dynamic";

export default async function StudioSettingsPage() {
  const supabase = createClient();
  const { data: s } = await supabase
    .from("studio_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/admin">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Studio settings
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="eyebrow">Admin</div>
        <h1>
          Studio <em>settings</em>
        </h1>
        <div className="sub">
          These appear on public pages (apply, contracts, signing) and outbound
          emails.
        </div>
      </div>
      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <StudioForm
          initial={{
            studio_name: s?.studio_name || "Casa Cross Events",
            contact_email: s?.contact_email || "",
            contact_phone: s?.contact_phone || "",
            instagram: s?.instagram || "",
            website: s?.website || "",
            apply_intro: s?.apply_intro || "",
            apply_thank_you: s?.apply_thank_you || "",
            email_signature: s?.email_signature || "",
          }}
        />
      </div>
    </div>
  );
}
