"use client";

import { useTransition } from "react";
import { Icon } from "@/components/icons";
import { fmtDate, daysUntilLabel } from "@/lib/format";
import type { Task } from "@/lib/types";
import { toggleTask } from "@/app/actions";

export function TaskRow({ task, eventId }: { task: Task; eventId: string }) {
  const [pending, start] = useTransition();
  const done = task.done;
  return (
    <button
      type="button"
      className="card-row"
      onClick={() => {
        const f = new FormData();
        f.set("id", task.id);
        f.set("done", done ? "true" : "false");
        f.set("event_id", eventId);
        start(() => toggleTask(f));
      }}
      style={{ opacity: pending ? 0.6 : 1 }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: done
            ? "1.5px solid var(--sage)"
            : "1.5px solid var(--ink-4)",
          background: done ? "var(--sage)" : "transparent",
          color: "white",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 150ms",
        }}
      >
        {done && <Icon.check />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: done ? "var(--ink-4)" : "var(--ink)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>
        {task.due && (
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {daysUntilLabel(task.due) || fmtDate(task.due, { short: true })}
          </div>
        )}
      </div>
    </button>
  );
}
