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
  defaultOpen: boolean;
};

const STAGES: StageConfig[] = [
  { key: "pending",   label: "New",       helper: "Review fit",       color: "var(--terracotta)", tint: "var(--terracotta-tint)", defaultOpen: true  },
  { key: "reviewing", label: "Reviewing", helper: "Decide next move", color: "var(--gold)",       tint: "var(--gold-tint)",       defaultOpen: true  },
  { key: "invited",   label: "Invited",   helper: "Follow up",        color: "var(--slate)",      tint: "var(--slate-tint)",      defaultOpen: true  },
  { key: "approved",  label: "Confirmed", helper: "In roster",        color: "var(--sage)",       tint: "var(--sage-tint)",       defaultOpen: false },
  { key: "archived",  label: "Declined",  helper: "Closed out",       color: "var(--ink-4)",      tint: "var(--hair-2)",          defaultOpen: false },
];

function ageInDays(createdAt: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000),
  );
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
        padding: "0 var(--s-5)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {STAGES.map((stage) => {
        const cards = subs
          .filter((s) => s.status === stage.key)
          .sort((a, b) => {
            const priorityRank = { urgent: 3, high: 2, normal: 1, low: 0 };
            const priorityDelta = priorityRank[b.priority] - priorityRank[a.priority];
            if (priorityDelta !== 0) return priorityDelta;
            if (a.follow_up_at && b.follow_up_at) return a.follow_up_at.localeCompare(b.follow_up_at);
            if (a.follow_up_at) return -1;
            if (b.follow_up_at) return 1;
            const aMissing = !a.email && !a.phone ? 1 : 0;
            const bMissing = !b.email && !b.phone ? 1 : 0;
            if (aMissing !== bMissing) return bMissing - aMissing;
            return b.created_at.localeCompare(a.created_at);
          });
        return (
          <StageSection
            key={stage.key}
            stage={stage}
            cards={cards}
            onMove={move}
          />
        );
      })}
    </div>
  );
}

function StageSection({
  stage,
  cards,
  onMove,
}: {
  stage: StageConfig;
  cards: Submission[];
  onMove: (id: string, stage: SubmissionStatus) => void;
}) {
  return (
    <details open={stage.defaultOpen && cards.length > 0}>
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 4px",
          userSelect: "none",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: stage.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-2)" }}>
          {stage.label}
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
          {stage.helper}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--ink-4)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {cards.length}
        </span>
      </summary>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginTop: 8,
        }}
      >
        {cards.length === 0 ? (
          <div
            style={{
              padding: "14px 12px",
              textAlign: "center",
              color: "var(--ink-5)",
              fontSize: 12,
              border: "1px dashed var(--hair)",
              borderRadius: "var(--r-2)",
            }}
          >
            Nothing here.
          </div>
        ) : (
          cards.map((sub) => (
            <PipelineRow
              key={sub.id}
              sub={sub}
              currentStage={stage}
              onMove={onMove}
            />
          ))
        )}
      </div>
    </details>
  );
}

function PipelineRow({
  sub,
  currentStage,
  onMove,
}: {
  sub: Submission;
  currentStage: StageConfig;
  onMove: (id: string, stage: SubmissionStatus) => void;
}) {
  const displayName = sub.preferred_name || sub.name;
  const age = ageInDays(sub.created_at);
  const needsContact = !sub.email && !sub.phone;
  const followUp =
    sub.status !== "approved" && sub.status !== "archived" && age >= 7;
  const followUpDate = sub.follow_up_at ? new Date(sub.follow_up_at) : null;
  const followUpDue = followUpDate && followUpDate.getTime() <= Date.now();

  return (
    <div
      className="card elev"
      style={{
        display: "flex",
        alignItems: "stretch",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <Link
        href={`/inbox/${sub.id}`}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "12px 14px",
          color: "inherit",
          textDecoration: "none",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontWeight: 500,
              fontSize: 14.5,
              flex: 1,
              minWidth: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </span>
          <RolePill role={sub.role} />
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {sub.specialty || sub.location || ""}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            fontSize: 11.5,
            color: "var(--ink-4)",
          }}
        >
          <span>{relTime(sub.created_at)}</span>
          {(sub.priority === "high" || sub.priority === "urgent") && (
            <span className="pill warn" style={{ fontSize: 10.5, padding: "2px 7px" }}>
              <span className="dot" />
              {sub.priority === "urgent" ? "Urgent" : "High priority"}
            </span>
          )}
          {followUpDate && (
            <span className={`pill ${followUpDue ? "warn" : ""}`} style={{ fontSize: 10.5, padding: "2px 7px" }}>
              Follow up {followUpDue ? "now" : followUpDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {sub.location && sub.specialty && <span>· {sub.location}</span>}
          {followUp && (
            <span
              className="pill warn"
              style={{ fontSize: 10.5, padding: "2px 7px" }}
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
                padding: "2px 7px",
                background: "var(--hair-2)",
                color: "var(--ink-3)",
              }}
            >
              Missing contact
            </span>
          )}
        </div>
      </Link>

      <div
        style={{
          borderLeft: "1px solid var(--hair)",
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "stretch",
          minWidth: 130,
          background: "var(--paper)",
        }}
      >
        <select
          value={sub.status}
          onChange={(e) => onMove(sub.id, e.target.value as SubmissionStatus)}
          aria-label="Stage"
          style={{
            fontFamily: "var(--sans)",
            fontSize: 12,
            padding: "5px 8px",
            borderRadius: 6,
            border: `1px solid ${currentStage.color}`,
            background: currentStage.tint,
            color: currentStage.color,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <div
          style={{
            display: "flex",
            gap: 4,
            justifyContent: "flex-end",
          }}
        >
          {sub.email && (
            <a
              className="btn sm"
              href={`mailto:${sub.email}`}
              aria-label="Email"
              style={{ padding: "4px 7px" }}
            >
              <Icon.mail />
            </a>
          )}
          {sub.phone && (
            <a
              className="btn sm"
              href={`tel:${sub.phone}`}
              aria-label="Call"
              style={{ padding: "4px 7px" }}
            >
              <Icon.phone />
            </a>
          )}
          {sub.portfolio_url && (
            <a
              className="btn sm"
              href={sub.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio"
              style={{ padding: "4px 7px" }}
            >
              <Icon.doc />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
