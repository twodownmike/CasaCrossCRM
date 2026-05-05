import { Logo } from "@/components/logo";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
