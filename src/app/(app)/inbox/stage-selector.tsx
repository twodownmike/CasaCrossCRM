"use client";

import { useState, useTransition } from "react";
import { moveSubmission } from "@/app/actions";
import type { SubmissionStatus } from "@/lib/types";

const STAGES: Array<{ key: SubmissionStatus; label: string; color: string; tint: string }> = [
  { key: "pending",   label: "New",       color: "var(--terracotta)", tint: "var(--terracotta-tint)" },
  { key: "reviewing", label: "Reviewing", color: "var(--gold)",       tint: "var(--gold-tint)"       },
  { key: "invited",   label: "Invited",   color: "var(--slate)",      tint: "var(--slate-tint)"      },
  { key: "approved",  label: "Confirmed", color: "var(--sage)",       tint: "var(--sage-tint)"       },
  { key: "archived",  label: "Declined",  color: "var(--ink-4)",      tint: "var(--hair-2)"          },
];

export function StageSelector({
  id,
  currentStage,
}: {
  id: string;
  currentStage: SubmissionStatus;
}) {
  const [stage, setStage] = useState(currentStage);
  const [, start] = useTransition();

  function move(next: SubmissionStatus) {
    if (next === stage) return;
    setStage(next);
    const f = new FormData();
    f.set("id", id);
    f.set("stage", next);
    start(() => moveSubmission(f));
  }

  return (
    <div>
      <div
        className="label"
        style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}
      >
        Stage
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STAGES.map((s) => {
          const active = stage === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => move(s.key)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${active ? s.color : "var(--hair)"}`,
                background: active ? s.tint : "var(--paper)",
                color: active ? s.color : "var(--ink-3)",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: active ? "default" : "pointer",
                fontFamily: "var(--sans)",
                transition: "all 100ms",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
