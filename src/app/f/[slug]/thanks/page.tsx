import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export default async function FormThanksPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: f } = await supabase
    .from("forms")
    .select("title, thank_you_message, is_published")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!f || !f.is_published) notFound();

  const message =
    f.thank_you_message ||
    "Thanks for your response. We&apos;ll be in touch.";

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div
          className="brand"
          style={{ justifyContent: "center", marginBottom: 12 }}
        >
          <Logo variant="auth" />
        </div>
        <h1>
          Thank <em>you</em>
        </h1>
        <div
          className="sub"
          style={{
            marginBottom: 24,
            fontFamily: "var(--serif)",
            fontSize: 16,
          }}
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <Link href={`/f/${params.slug}`} className="cancel-link">
          Submit another response
        </Link>
      </div>
    </div>
  );
}
