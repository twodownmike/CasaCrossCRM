"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeTeamMember } from "@/app/admin-actions";

type Member = {
  user_id: string;
  email: string;
  display_name: string | null;
  joined: string;
  isMe: boolean;
};

export function TeamList({ team }: { team: Member[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(m: Member) {
    if (m.isMe) return;
    if (!confirm(`Remove ${m.display_name || m.email} from the team?`))
      return;
    setError(null);
    const f = new FormData();
    f.set("user_id", m.user_id);
    start(async () => {
      const r = await removeTeamMember(f);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="card elev">
        {team.map((m) => (
          <div
            key={m.user_id}
            className="card-row"
            style={{ cursor: "default" }}
          >
            <span
              className="avatar"
              style={{
                background: "var(--terracotta-tint)",
                color: "var(--terracotta)",
              }}
            >
              {(m.display_name || m.email)[0]?.toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span>{m.display_name || m.email.split("@")[0]}</span>
                {m.isMe && (
                  <span className="pill confirmed">
                    <span className="dot" />
                    You
                  </span>
                )}
              </div>
              <div
                style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}
              >
                {m.email} · joined {m.joined}
              </div>
            </div>
            <button
              type="button"
              className="btn sm"
              onClick={() => remove(m)}
              disabled={m.isMe || pending}
              style={{ color: m.isMe ? "var(--ink-4)" : "var(--terracotta)" }}
            >
              {m.isMe ? "—" : <>Remove</>}
            </button>
          </div>
        ))}
      </div>
      {error && (
        <div className="notice warn" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
    </>
  );
}
