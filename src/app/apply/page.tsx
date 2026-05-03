import { ApplyForm } from "./apply-form";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Apply to Casa Cross",
  description: "Apply to be featured in an upcoming Casa Cross styled shoot.",
};

export default function ApplyPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="brand" style={{ justifyContent: "center" }}>
          <Logo variant="auth" />
        </div>
        <h1>
          Work with <em>us</em>
        </h1>
        <div className="sub">
          A few quick details and we&apos;ll be in touch about upcoming shoots
          that might fit.
        </div>
        <ApplyForm />
      </div>
    </div>
  );
}
