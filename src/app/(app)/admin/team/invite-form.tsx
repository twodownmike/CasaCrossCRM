"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteTeamMember } from "@/app/admin-actions";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<
    | { kind: "ok"; text: string }
    | { kind: "err"; text: string }
    | null
  >(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const f = new FormData();
    f.set("email", email);
    if (name) f.set("name", name);
    start(async () => {
      const r = await inviteTeamMember(f);
      if (!r.ok) {
        setMsg({ kind: "err", text: r.error });
        return;
      }
      setMsg({ kind: "ok", text: `${email} added to the team.` });
      setEmail("");
      setName("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="form-row">
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="anna@example.com"
          />
        </div>
        <div>
          <label className="form-label">Display name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anna"
          />
        </div>
      </div>
      {msg && (
        <div className={`notice ${msg.kind === "err" ? "warn" : ""}`}>
          {msg.text}
        </div>
      )}
      <button className="btn primary" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add to team"}
      </button>
    </form>
  );
}
