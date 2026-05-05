"use client";

import { useState, useTransition } from "react";
import { acceptPortalInvite } from "@/app/portal-actions";
import { fmtDate } from "@/lib/format";

export function PortalSignupForm({
  token,
  email,
  expiresAt,
}: {
  token: string;
  email: string;
  expiresAt: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    start(async () => {
      const result = await acceptPortalInvite(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSentTo(result.email);
    });
  }

  if (sentTo) {
    return (
      <div className="notice" style={{ marginTop: 18 }}>
        Check {sentTo} for your secure portal link. Open that email on this
        device to finish setup.
      </div>
    );
  }

  return (
    <form className="form-grid" onSubmit={submit} style={{ marginTop: 18 }}>
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="form-label">Email</label>
        <input className="input" value={email} readOnly />
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          This invite expires {fmtDate(expiresAt, { short: true })}.
        </p>
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">First name</label>
          <input name="first_name" className="input" required />
        </div>
        <div>
          <label className="form-label">Last name</label>
          <input name="last_name" className="input" required />
        </div>
      </div>
      <div>
        <label className="form-label">Preferred display name</label>
        <input name="display_name" className="input" />
      </div>
      <div>
        <label className="form-label">Phone</label>
        <input name="phone" className="input" />
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: 12,
          border: "1px solid var(--hair)",
          borderRadius: "var(--r-2)",
          background: "var(--paper)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          name="communication_opt_in"
          style={{ marginTop: 2 }}
        />
        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
          Send me event reminders and portal updates by email
        </span>
      </label>
      {error && <div className="notice warn">{error}</div>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send my secure portal link"}
      </button>
    </form>
  );
}
