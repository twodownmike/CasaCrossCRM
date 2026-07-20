import Link from "next/link";
import { generateEventChecklist, updateEventStage } from "@/app/actions";
import { Icon } from "@/components/icons";
import type { EventStage } from "@/lib/types";

export type ReadinessCheck = {
  key: string;
  label: string;
  complete: number;
  total: number;
  href: string;
  detail: string;
};

const STAGES: Array<{ value: EventStage; label: string }> = [
  { value: "planning", label: "Planning" },
  { value: "booking", label: "Booking" },
  { value: "finalizing", label: "Finalizing" },
  { value: "ready", label: "Ready" },
  { value: "complete", label: "Complete" },
];

export function EventReadiness({
  eventId,
  stage,
  checks,
}: {
  eventId: string;
  stage: EventStage;
  checks: ReadinessCheck[];
}) {
  const activeChecks = checks.filter((check) => check.total > 0);
  const complete = activeChecks.reduce((sum, check) => sum + check.complete, 0);
  const total = activeChecks.reduce((sum, check) => sum + check.total, 0);
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const issueCount = activeChecks.reduce(
    (sum, check) => sum + Math.max(0, check.total - check.complete),
    0,
  );

  return (
    <section className="ops-center">
      <div className="ops-center-head">
        <div>
          <div className="eyebrow">Event operations</div>
          <h2>{percent}% ready</h2>
          <p>
            {issueCount === 0 && total > 0
              ? "All tracked requirements are complete."
              : `${issueCount} ${issueCount === 1 ? "item needs" : "items need"} attention.`}
          </p>
        </div>
        <div className="ops-score" aria-label={`${percent}% ready`}>
          <span>{percent}</span>
          <small>%</small>
        </div>
      </div>

      <div className="ops-progress" aria-hidden>
        <i style={{ width: `${percent}%` }} />
      </div>

      <div className="ops-check-grid">
        {activeChecks.map((check) => {
          const done = check.complete >= check.total;
          return (
            <Link key={check.key} href={check.href} className="ops-check">
              <span className={`ops-check-icon ${done ? "done" : ""}`}>
                {done ? <Icon.check /> : <Icon.clock />}
              </span>
              <span>
                <strong>{check.label}</strong>
                <small>{check.detail}</small>
              </span>
              <span className={`ops-check-count ${done ? "done" : ""}`}>
                {check.complete}/{check.total}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="ops-actions">
        <form action={updateEventStage} className="ops-stage-form">
          <input type="hidden" name="id" value={eventId} />
          <label htmlFor={`event-stage-${eventId}`}>Stage</label>
          <select
            id={`event-stage-${eventId}`}
            name="stage"
            defaultValue={stage}
            className="input"
          >
            {STAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button className="btn sm" type="submit">
            Update
          </button>
        </form>
        <form action={generateEventChecklist}>
          <input type="hidden" name="event_id" value={eventId} />
          <button className="btn sm" type="submit">
            <Icon.plus /> Add checklist
          </button>
        </form>
      </div>
    </section>
  );
}
