import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDateFull, daysUntilLabel } from "@/lib/format";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: e } = await supabase
    .from("events")
    .select("name, subtitle, description, cover_image_url")
    .eq("public_slug", params.slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!e) return { title: "Casa Cross" };
  return {
    title: `${e.name} — Casa Cross`,
    description: e.subtitle || e.description || undefined,
    openGraph: {
      title: e.name,
      description: e.subtitle || e.description || undefined,
      images: e.cover_image_url ? [e.cover_image_url] : undefined,
    },
  };
}

export default async function PublicEventPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data: e } = await supabase
    .from("events")
    .select("*")
    .eq("public_slug", params.slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!e) notFound();

  const { data: moodImages } = await supabase
    .from("mood_images")
    .select("*")
    .eq("event_id", e.id)
    .order("created_at", { ascending: false });

  return (
    <div className="public-shell">
      <header className="public-header">
        <Link href="/" aria-label="Casa Cross">
          <Logo variant="header" />
        </Link>
        <Link href="/apply" className="btn">
          Apply to be in a shoot
        </Link>
      </header>

      <div
        className="public-hero"
        style={{
          backgroundImage: e.cover_image_url
            ? `url(${e.cover_image_url})`
            : undefined,
        }}
      >
        <div
          className={
            e.cover_image_url
              ? "public-hero-img"
              : `public-hero-img cover-${e.cover || "modern"}`
          }
          style={
            e.cover_image_url
              ? {
                  backgroundImage: `url(${e.cover_image_url})`,
                }
              : undefined
          }
        />
        <div className="public-hero-overlay">
          {e.subtitle && <div className="eyebrow">{e.subtitle}</div>}
          <h1>{e.name}</h1>
          <div className="public-hero-meta">
            <span>{fmtDateFull(e.date)}</span>
            {e.time_label && <span>· {e.time_label}</span>}
            {e.location && <span>· {e.location}</span>}
          </div>
          {daysUntilLabel(e.date) && (
            <span
              className="pill"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
                marginTop: 14,
                backdropFilter: "blur(8px)",
              }}
            >
              {daysUntilLabel(e.date)}
            </span>
          )}
        </div>
      </div>

      <div className="public-body">
        {e.description && (
          <section className="public-section">
            <p className="public-prose">{e.description}</p>
          </section>
        )}

        {e.tags && e.tags.length > 0 && (
          <section className="public-section">
            <div
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              {e.tags.map((t: string) => (
                <span key={t} className="pill">
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {e.moodboard && e.moodboard.length > 0 && (
          <section className="public-section">
            <h2 className="public-h2">Color story</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 10,
                maxWidth: 520,
              }}
            >
              {e.moodboard.map((c: string, i: number) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 12,
                    background: c,
                    border: "1px solid var(--hair)",
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {(moodImages?.length ?? 0) > 0 && (
          <section className="public-section">
            <h2 className="public-h2">Inspiration</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {(moodImages ?? []).map((img) => (
                <div
                  key={img.id}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 14,
                    backgroundImage: `url(${img.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid var(--hair)",
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <section className="public-cta">
          <h2 className="public-h2">Want to be part of a Casa Cross shoot?</h2>
          <p className="public-prose" style={{ marginBottom: 18 }}>
            We&apos;re always looking for vendors, photographers, models, and
            stylists. Tell us about your work and we&apos;ll reach out when
            something fits.
          </p>
          <Link className="btn primary" href="/apply">
            Apply now
          </Link>
        </section>
      </div>

      <footer className="public-footer">
        <span>© {new Date().getFullYear()} Casa Cross Events</span>
      </footer>
    </div>
  );
}
