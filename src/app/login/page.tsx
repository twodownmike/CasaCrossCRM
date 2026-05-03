import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string; next?: string };
}) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand" style={{ justifyContent: "center" }}>
          <Logo variant="auth" />
        </div>
        <h1>
          Sign <em>in</em>
        </h1>
        <div className="sub">
          We&apos;ll email you a magic link — no passwords to remember.
        </div>
        {searchParams.sent && (
          <div className="notice">
            Check {searchParams.sent} for a sign-in link.
          </div>
        )}
        {searchParams.error && (
          <div className="notice warn">{searchParams.error}</div>
        )}
        <LoginForm next={searchParams.next} />
      </div>
    </div>
  );
}
