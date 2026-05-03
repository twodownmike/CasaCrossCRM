import { Logo } from "@/components/logo";

export const metadata = { title: "Thank you — Casa Cross" };

export default function ThanksPage() {
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
          Got <em>it</em>.
        </h1>
        <div className="sub" style={{ marginBottom: 24 }}>
          Thanks for reaching out. We&apos;ll be in touch when there&apos;s a
          shoot that fits.
        </div>
      </div>
    </div>
  );
}
