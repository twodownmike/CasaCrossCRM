"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStudioSettings } from "@/app/admin-actions";

type Initial = {
  studio_name: string;
  contact_email: string;
  contact_phone: string;
  instagram: string;
  website: string;
  apply_intro: string;
  apply_thank_you: string;
  email_signature: string;
  venmo_url: string;
};

export function StudioForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setV((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const f = new FormData();
    Object.entries(v).forEach(([k, val]) => f.set(k, val));
    start(async () => {
      await updateStudioSettings(f);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div>
        <label className="form-label">Studio name</label>
        <input
          required
          className="input"
          value={v.studio_name}
          onChange={(e) => set("studio_name", e.target.value)}
        />
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Contact email</label>
          <input
            type="email"
            className="input"
            value={v.contact_email}
            onChange={(e) => set("contact_email", e.target.value)}
            placeholder="hello@casacrossevents.com"
          />
        </div>
        <div>
          <label className="form-label">Contact phone</label>
          <input
            className="input"
            value={v.contact_phone}
            onChange={(e) => set("contact_phone", e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Instagram</label>
          <input
            className="input"
            value={v.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="@casacrossevents"
          />
        </div>
        <div>
          <label className="form-label">Website</label>
          <input
            type="url"
            className="input"
            value={v.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 18,
          borderTop: "1px solid var(--hair)",
        }}
      >
        <div
          className="eyebrow"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          Public apply form
        </div>
        <div>
          <label className="form-label">Intro paragraph</label>
          <textarea
            className="input textarea"
            value={v.apply_intro}
            onChange={(e) => set("apply_intro", e.target.value)}
            placeholder="A few quick details and we'll be in touch about upcoming shoots that might fit."
          />
          <p
            className="muted"
            style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
          >
            Shown above the apply form. Leave blank to use the default.
          </p>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="form-label">Thank-you message</label>
          <textarea
            className="input textarea"
            value={v.apply_thank_you}
            onChange={(e) => set("apply_thank_you", e.target.value)}
            placeholder="Thanks for reaching out. We'll be in touch when there's a shoot that fits you best."
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 4,
          paddingTop: 18,
          borderTop: "1px solid var(--hair)",
        }}
      >
        <div
          className="eyebrow"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          Payments
        </div>
        <div>
          <label className="form-label">Venmo URL</label>
          <input
            type="url"
            className="input"
            value={v.venmo_url}
            onChange={(e) => set("venmo_url", e.target.value)}
            placeholder="https://www.venmo.com/u/CasaCross"
          />
          <p
            className="muted"
            style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
          >
            Used on the post-signing payment page when a contract has
            payment required turned on.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 4,
          paddingTop: 18,
          borderTop: "1px solid var(--hair)",
        }}
      >
        <div
          className="eyebrow"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-4)",
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          Email signature
        </div>
        <textarea
          className="input textarea"
          value={v.email_signature}
          onChange={(e) => set("email_signature", e.target.value)}
          placeholder="Casa Cross Events · @casacrossevents · hello@casacross.org"
        />
        <p
          className="muted"
          style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
        >
          Appended to outbound emails when configured.
        </p>
      </div>

      <button className="btn primary block" type="submit" disabled={pending}>
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
      </button>
    </form>
  );
}
