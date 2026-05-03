import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { PublicFormRenderer } from "./public-form";
import type { FormField } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: f } = await supabase
    .from("forms")
    .select("title, description")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!f) return { title: "Casa Cross" };
  return {
    title: `${f.title} — Casa Cross`,
    description: f.description || undefined,
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: f } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!f) notFound();

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", f.id)
    .order("position", { ascending: true });

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <Link
          href="/"
          className="brand"
          style={{
            justifyContent: "center",
            marginBottom: 8,
            textDecoration: "none",
          }}
        >
          <Logo variant="auth" />
        </Link>
        <h1>{f.title}</h1>
        {f.description && (
          <div className="sub" style={{ marginBottom: 22 }}>
            {f.description}
          </div>
        )}
        <PublicFormRenderer
          formId={f.id}
          slug={f.slug}
          fields={(fields ?? []) as FormField[]}
        />
      </div>
    </div>
  );
}
