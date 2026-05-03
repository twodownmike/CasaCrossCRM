"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitApplication } from "@/app/actions";
import { ROLE_META, ROLE_ORDER } from "@/lib/types";

export function ApplyForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const f = new FormData(e.currentTarget);
    start(async () => {
      const result = await submitApplication(f);
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      router.push("/apply/thanks");
    });
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div>
        <label className="form-label">I&apos;m a…</label>
        <select name="role" required defaultValue="" className="input">
          <option value="" disabled>
            Pick one
          </option>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLE_META[r].label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">Name (or business name)</label>
        <input name="name" required className="input" />
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Email</label>
          <input name="email" type="email" className="input" />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input name="phone" className="input" />
        </div>
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Instagram</label>
          <input name="instagram" className="input" placeholder="@handle" />
        </div>
        <div>
          <label className="form-label">Location</label>
          <input name="location" className="input" placeholder="Austin, TX" />
        </div>
      </div>
      <div>
        <label className="form-label">Specialty</label>
        <input
          name="specialty"
          className="input"
          placeholder="Garden-style florals · heirloom blooms"
        />
      </div>
      <div>
        <label className="form-label">Portfolio link</label>
        <input
          name="portfolio_url"
          type="url"
          className="input"
          placeholder="https://…"
        />
      </div>
      <div>
        <label className="form-label">Anything else?</label>
        <textarea
          name="message"
          className="input textarea"
          placeholder="Past clients, what kind of shoots you'd love to be part of, availability…"
        />
      </div>
      {err && <div className="notice warn">{err}</div>}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Submit application"}
      </button>
      <p
        className="muted"
        style={{ fontSize: 11, lineHeight: 1.5, textAlign: "center" }}
      >
        We&apos;ll only use these details to consider you for upcoming shoots.
      </p>
    </form>
  );
}
