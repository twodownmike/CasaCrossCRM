"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { moveSubmission } from "@/app/actions";
import { Icon } from "@/components/icons";
import { RolePill } from "@/components/pill";
import { relTime } from "@/lib/format";
import type { Submission, SubmissionStatus } from "@/lib/types";

type StageConfig = {
  key: SubmissionStatus;
  label: string;
  helper: string;
  color: string;
  tint: string;
};

const STAGES: StageConfig[] = [
  { key: "pending",   label: "New",       helper: "Review fit",       color: "var(--terracotta)", tint: "var(--terracotta-tint)" },
  { key: "reviewing", label: "Reviewing", helper: "Decide next move", color: "var(--gold)",       tint: "var(--gold-tint)"       },
  { key: "invited",   label: "Invited",   helper: "Follow up",        color: "var(--slate)",      tint: "var(--slate-tint)"      },
  { key: "approved",  label: "Confirmed", helper: "In roster",        color: "var(--sage)",       tint: "var(--sage-tint)"       },
  { key: "archived",  label: "Declined",  helper: "Closed out",       color: "var(--ink-4)",      tint: "var(--hair-2)"          },
];

function ageInDays(createdAt: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000),
  );
}

function nextStep(sub: Submission) {
  const age = ageInDays(sub.created_at);
  if (!sub.email && !sub.phone) return "Find contact info before outreach";
  if (sub.status === "pending") return "Open profile and review fit";
  if (sub.status === "reviewing") return "Invite or decline";
  if (sub.status === "invited") {
    return age >= 3 ? "Follow up on invitation" : "Waiting on reply";
  }
  if (sub.status === "approved") return "Profile created";
  return "Closed";
}

export function PipelineBoard({ initialSubs }: { initialSubs: Submission[] }) {
  const [subs, setSubs] = useState(initialSubs);
  const [, start] = useTransition();

  function move(id: string, stage: SubmissionStatus) {
    setSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: stage } : s)),
    );
    const f = new FormData();
    f.set("id", id);
    f.set("stage", stage);
    start(() => moveSubmission(f));
  }

  return (
    <div
      style={{
        overflowX: "auto",
        paddingBottom: "var(--s-7)",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "0 var(--s-5)",
          minWidth: "fit-content",
          alignItems: "flex-start",
        }}
      >
        {STAGES.map((stage) => {
          const cards = subs
            .filter((s) => s.status === stage.key)
            .sort((a, b) => {
              const aMissing = !a.email && !a.phone ? 1 : 0;
              const bMissing = !b.email && !b.phone ? 1 : 0;
              if (aMissing !== bMissing) return bMissing - aMissing;
              return b.created_at.localeCompare(a.created_at);
            });
          return (
            <div key={stage.key} style={{ width: 276, flexShrink: 0 }}>
              {/* Column header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 10,
                  padding: "0 2px",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: stage.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--ink-2)",
                  }}
                >
                  {stage.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-4)",
                  }}
                >
                  {stage.helper}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--ink-4)",
                    marginLeft: "auto",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {cards.map((sub) => (
                  <PipelineCard
                    key={sub.id}
                    sub={sub}
                    stages={STAGES}
                    onMove={move}
                  />
                ))}
                {cards.length === 0 && (
                  <div
                    style={{
                      padding: "20px 12px",
                      textAlign: "center",
                      color: "var(--ink-5)",
                      fontSize: 12,
                      border: "1px dashed var(--hair)",
                      borderRadius: "var(--r-2)",
                    }}
                  >
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({
  sub,
  stages,
  onMove,
}: {
  sub: Submission;
  stages: StageConfig[];
  onMove: (id: string, stage: SubmissionStatus) => void;
}) {
  const displayName = sub.preferred_name || sub.name;
  const age = ageInDays(sub.created_at);
  const needsContact = !sub.email && !sub.phone;
  const followUp =
    sub.status !== "approved" && sub.status !== "archived" && age >= 7;

  return (
    <div
      className="card elev"
      style={{ padding: 0, overflow: "hidden" }}
    >
      {/* Tappable detail area */}
      <Link
        href={`/inbox/${sub.id}`}
        style={{
          display: "block",
          padding: "12px 14px 10px",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              fontSize: 14,
              flex: 1,
              minWidth: 0,
              lineHeight: 1.3,
            }}
          >
            {displayName}
          </span>
          <RolePill role={sub.role} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 7,
          }}
        >
          {followUp && (
            <span
              className="pill warn"
              style={{ fontSize: 10.5, padding: "3px 7px" }}
            >
              <span className="dot" />
              {age}d active
            </span>
          )}
          {needsContact && (
            <span
              className="pill"
              style={{
                fontSize: 10.5,
                padding: "3px 7px",
                background: "var(--hair-2)",
                color: "var(--ink-3)",
              }}
            >
              Missing contact
            </span>
          )}
        </div>
        {sub.specialty && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              marginBottom: 5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {sub.specialty}
          </div>
        )}
        <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
          {relTime(sub.created_at)}
          {sub.location ? ` · ${sub.location}` : ""}
        </div>
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid var(--hair)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--ink-3)",
            fontSize: 12,
          }}
        >
          <Icon.spark style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>{nextStep(sub)}</span>
        </div>
      </Link>

      {(sub.email || sub.phone || sub.portfolio_url) && (
        <div
          style={{
            borderTop: "1px solid var(--hair)",
            padding: "8px 10px",
            display: "flex",
            gap: 6,
          }}
        >
          {sub.email && (
            <a className="btn sm" href={`mailto:${sub.email}`}>
              <Icon.mail /> Email
            </a>
          )}
          {sub.phone && (
            <a className="btn sm" href={`tel:${sub.phone}`}>
              <Icon.phone /> Call
            </a>
          )}
          {sub.portfolio_url && (
            <a
              className="btn sm"
              href={sub.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon.doc /> Work
            </a>
          )}
        </div>
      )}

      {/* Stage pills */}
      <div
        style={{
          borderTop: "1px solid var(--hair)",
          padding: "7px 10px",
          display: "flex",
          gap: 4,
          flexWrap: "wrap",
        }}
      >
        {stages.map((st) => {
          const active = sub.status === st.key;
          return (
            <button
              key={st.key}
              type="button"
              onClick={() => !active && onMove(sub.id, st.key)}
              style={{
                padding: "2px 7px",
                borderRadius: 999,
                border: `1px solid ${active ? st.color : "var(--hair)"}`,
                background: active ? st.tint : "transparent",
                color: active ? st.color : "var(--ink-4)",
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                cursor: active ? "default" : "pointer",
                fontFamily: "var(--sans)",
                lineHeight: 1.5,
                transition: "all 100ms",
              }}
            >
              {st.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
