"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const supabase = createClient();
      const redirectTo =
        (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) +
        "/auth/callback" +
        (next ? `?next=${encodeURIComponent(next)}` : "");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setErr(error.message);
        return;
      }
      router.push(`/login?sent=${encodeURIComponent(email)}`);
    });
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div>
        <label className="form-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      {err && <div className="notice warn">{err}</div>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
