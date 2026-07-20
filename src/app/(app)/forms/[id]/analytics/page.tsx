import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type RangeKey = "7" | "30" | "90" | "all";
type AnalyticsEvent = {
  event_type: "view" | "start" | "step";
  session_id: string;
  step_index: number | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer_host: string | null;
  created_at: string;
};
type ResponseRecord = {
  status: string;
  data: Record<string, unknown>;
  analytics_session_id: string | null;
  completion_seconds: number | null;
  created_at: string;
};
type AnalyticsField = {
  id: string;
  field_key: string;
  label: string;
  type: string;
};

const RANGES: Array<{ value: RangeKey; label: string }> = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];
const WORKFLOW_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "In review",
  follow_up: "Follow-up",
  qualified: "Qualified",
  closed: "Closed",
};

export default async function FormAnalytics({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { range?: string };
}) {
  const range = RANGES.some((item) => item.value === searchParams?.range)
    ? (searchParams?.range as RangeKey)
    : "30";
  const supabase = createClient();
  const [
    { data: form },
    { data: fields },
    { data: responses },
    { data: events },
  ] = await Promise.all([
    supabase
      .from("forms")
      .select("id, title")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("form_fields")
      .select("id, field_key, label, type")
      .eq("form_id", params.id)
      .order("position", { ascending: true }),
    supabase
      .from("form_responses")
      .select(
        "status, data, analytics_session_id, completion_seconds, created_at",
      )
      .eq("form_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("form_analytics_events")
      .select(
        "event_type, session_id, step_index, source, medium, campaign, referrer_host, created_at",
      )
      .eq("form_id", params.id)
      .order("created_at", { ascending: true }),
  ]);
  if (!form) notFound();

  const fieldRows = (fields ?? []) as AnalyticsField[];
  const cutoff =
    range === "all"
      ? null
      : startOfDay(addDays(new Date(), -Number(range) + 1));
  const responseRows = ((responses ?? []) as ResponseRecord[]).filter(
    (response) => !cutoff || new Date(response.created_at) >= cutoff,
  );
  const eventRows = ((events ?? []) as AnalyticsEvent[]).filter(
    (event) => !cutoff || new Date(event.created_at) >= cutoff,
  );
  const views = eventRows.filter((event) => event.event_type === "view");
  const starts = eventRows.filter((event) => event.event_type === "start");
  const trackedSubmissions = responseRows.filter(
    (response) => response.analytics_session_id,
  );
  const conversion = percentNumber(trackedSubmissions.length, views.length);
  const completion = percentNumber(trackedSubmissions.length, starts.length);
  const completionTimes = trackedSubmissions
    .map((response) => response.completion_seconds)
    .filter(
      (value): value is number => typeof value === "number" && value >= 0,
    );
  const averageCompletion = completionTimes.length
    ? completionTimes.reduce((sum, value) => sum + value, 0) /
      completionTimes.length
    : null;
  const chartDays = range === "7" ? 7 : 30;
  const daily = buildDailySeries(eventRows, responseRows, chartDays);
  const maxDaily = Math.max(
    1,
    ...daily.flatMap((day) => [day.views, day.starts, day.submissions]),
  );
  const funnel = buildFunnel(fieldRows, eventRows, trackedSubmissions);
  const sources = buildSources(views);
  const workflow = Object.entries(WORKFLOW_LABELS).map(([key, label]) => ({
    key,
    label,
    count: responseRows.filter((response) => (response.status || "new") === key)
      .length,
  }));
  const insights = fieldRows
    .filter((field) =>
      ["select", "multiselect", "checkbox"].includes(field.type),
    )
    .map((field) => ({
      id: field.id,
      label: field.label,
      answers: countAnswers(responseRows, field.field_key),
    }))
    .filter((field) => field.answers.length > 0);

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/forms/${form.id}`}>
          <Icon.back />
        </Link>
        <div
          style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15 }}
        >
          Analytics
        </div>
        <Link
          className="icon-btn"
          href={`/forms/${form.id}/responses`}
          aria-label="View responses"
          title="View responses"
        >
          <Icon.doc />
        </Link>
      </header>

      <div className="page-head analytics-page-head">
        <div>
          <div className="eyebrow">{form.title}</div>
          <h1>Form performance</h1>
          <div className="sub">Anonymous, session-based funnel analytics</div>
        </div>
        <a
          className="btn"
          href={`/forms/${form.id}/analytics.csv?range=${range}`}
          download
        >
          Export CSV
        </a>
      </div>

      <nav className="analytics-range-tabs" aria-label="Analytics date range">
        {RANGES.map((item) => (
          <Link
            key={item.value}
            href={`/forms/${form.id}/analytics?range=${item.value}`}
            className={range === item.value ? "active" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="form-analytics-stats deeper">
        <Metric
          label="Unique views"
          value={views.length}
          detail="browser sessions"
        />
        <Metric
          label="Started"
          value={starts.length}
          detail={`${percent(starts.length, views.length)} of viewers`}
        />
        <Metric
          label="Submitted"
          value={responseRows.length}
          detail={`${trackedSubmissions.length} funnel-tracked`}
        />
        <Metric
          label="View conversion"
          value={`${Math.round(conversion)}%`}
          detail={`${Math.round(completion)}% of starts completed`}
        />
        <Metric
          label="Average time"
          value={formatDuration(averageCompletion)}
          detail="start to submission"
        />
        <Metric
          label="Abandoned"
          value={Math.max(starts.length - trackedSubmissions.length, 0)}
          detail="started without submitting"
        />
      </div>

      <section className="analytics-section">
        <div className="section-label analytics-section-label">
          <h2>Completion funnel</h2>
        </div>
        <div className="form-funnel">
          {funnel.map((stage, index) => {
            const previous =
              index === 0 ? stage.count : funnel[index - 1].count;
            const drop = Math.max(previous - stage.count, 0);
            return (
              <div className="form-funnel-row" key={`${stage.label}-${index}`}>
                <span>{stage.label}</span>
                <i>
                  <b
                    style={{
                      width: `${percentNumber(stage.count, Math.max(funnel[0]?.count || 0, 1))}%`,
                    }}
                  />
                </i>
                <strong>{stage.count}</strong>
                <small>
                  {index === 0 ? "100%" : drop > 0 ? `${drop} dropped` : "—"}
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="analytics-section">
        <div className="section-label analytics-section-label">
          <h2>Last {chartDays} days</h2>
          <div className="analytics-legend" aria-label="Chart legend">
            <span>
              <i className="views" /> Views
            </span>
            <span>
              <i className="starts" /> Starts
            </span>
            <span>
              <i className="submissions" /> Submissions
            </span>
          </div>
        </div>
        <div
          className={`analytics-chart days-${chartDays}`}
          role="img"
          aria-label={`Views, starts, and submissions over the last ${chartDays} days`}
        >
          {daily.map((day) => (
            <div className="analytics-day" key={day.key}>
              <div className="analytics-bars">
                <i
                  className="views"
                  style={{ height: `${(day.views / maxDaily) * 100}%` }}
                  title={`${day.views} views`}
                />
                <i
                  className="starts"
                  style={{ height: `${(day.starts / maxDaily) * 100}%` }}
                  title={`${day.starts} starts`}
                />
                <i
                  className="submissions"
                  style={{ height: `${(day.submissions / maxDaily) * 100}%` }}
                  title={`${day.submissions} submissions`}
                />
              </div>
              <span>{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-section analytics-two-column">
        <div>
          <div className="section-label analytics-section-label">
            <h2>Traffic sources</h2>
          </div>
          <div className="source-breakdown">
            {sources.length === 0 ? (
              <div className="empty">
                <h3>No source data yet</h3>
                <div>New form visits will appear here.</div>
              </div>
            ) : (
              sources.slice(0, 8).map((source) => (
                <div className="source-breakdown-row" key={source.label}>
                  <span>{source.label}</span>
                  <i>
                    <b
                      style={{
                        width: `${percentNumber(source.count, views.length)}%`,
                      }}
                    />
                  </i>
                  <strong>{source.count}</strong>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="section-label analytics-section-label">
            <h2>Intake pipeline</h2>
            <Link href={`/forms/${form.id}/responses`} className="more">
              Manage ›
            </Link>
          </div>
          <div className="workflow-breakdown">
            {workflow.map((stage) => (
              <Link
                key={stage.key}
                href={`/forms/${form.id}/responses?status=${stage.key}`}
                className="workflow-breakdown-row"
              >
                <span>{stage.label}</span>
                <i>
                  <b
                    className={`form-response-${stage.key}`}
                    style={{
                      width: `${percentNumber(stage.count, responseRows.length)}%`,
                    }}
                  />
                </i>
                <strong>{stage.count}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="analytics-section">
        <div className="section-label analytics-section-label">
          <h2>Answer patterns</h2>
        </div>
        {insights.length === 0 ? (
          <div className="empty">
            <h3>No choice data yet</h3>
            <div>Choice-field patterns appear after responses arrive.</div>
          </div>
        ) : (
          <div className="answer-insight-grid">
            {insights.map((field) => {
              const total = field.answers.reduce(
                (sum, answer) => sum + answer.count,
                0,
              );
              return (
                <article className="answer-insight" key={field.id}>
                  <h3>{field.label}</h3>
                  {field.answers.slice(0, 6).map((answer) => (
                    <div className="answer-insight-row" key={answer.value}>
                      <span>{answer.value}</span>
                      <i>
                        <b
                          style={{
                            width: `${percentNumber(answer.count, total)}%`,
                          }}
                        />
                      </i>
                      <strong>{answer.count}</strong>
                    </div>
                  ))}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <div style={{ height: 28 }} />
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="val tabnums">{value}</div>
      <div className="delta">{detail}</div>
    </div>
  );
}

function percent(value: number, total: number) {
  return `${Math.round(percentNumber(value, total))}%`;
}

function percentNumber(value: number, total: number) {
  return total > 0 ? Math.min((value / total) * 100, 100) : 0;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dayKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildDailySeries(
  events: AnalyticsEvent[],
  responses: ResponseRecord[],
  days: number,
) {
  return Array.from({ length: days }, (_, index) => {
    const date = startOfDay(addDays(new Date(), index - days + 1));
    const key = dayKey(date);
    const sameDayEvents = events.filter(
      (event) => dayKey(event.created_at) === key,
    );
    return {
      key,
      label: date.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      }),
      views: sameDayEvents.filter((event) => event.event_type === "view")
        .length,
      starts: sameDayEvents.filter((event) => event.event_type === "start")
        .length,
      submissions: responses.filter(
        (response) => dayKey(response.created_at) === key,
      ).length,
    };
  });
}

function buildFunnel(
  fields: AnalyticsField[],
  events: AnalyticsEvent[],
  responses: ResponseRecord[],
) {
  const labels: string[] = [];
  let currentLabel = "Details";
  let currentFieldCount = 0;
  for (const field of fields) {
    if (field.type === "section") {
      if (currentFieldCount > 0) labels.push(currentLabel);
      currentLabel = field.label;
      currentFieldCount = 0;
    } else {
      currentFieldCount += 1;
    }
  }
  if (currentFieldCount > 0) labels.push(currentLabel);
  labels.push("Review");
  const stepEvents = events.filter((event) => event.event_type === "step");
  const stages = labels.map((label, stepIndex) => ({
    label,
    count: new Set(
      stepEvents
        .filter((event) => event.step_index === stepIndex)
        .map((event) => event.session_id),
    ).size,
  }));
  stages.push({
    label: "Submitted",
    count: new Set(
      responses
        .map((response) => response.analytics_session_id)
        .filter((value): value is string => Boolean(value)),
    ).size,
  });
  return stages;
}

function buildSources(views: AnalyticsEvent[]) {
  const counts = new Map<string, number>();
  for (const view of views) {
    const channel = view.source || view.referrer_host || "Direct";
    const medium = view.medium ? ` / ${view.medium}` : "";
    const campaign = view.campaign ? ` · ${view.campaign}` : "";
    const label = `${channel}${medium}${campaign}`;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function countAnswers(responses: ResponseRecord[], fieldKey: string) {
  const counts = new Map<string, number>();
  for (const response of responses) {
    const value = response.data[fieldKey];
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === null || item === undefined || item === "") continue;
      const label =
        typeof item === "boolean" ? (item ? "Yes" : "No") : String(item);
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  }
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value),
  );
}
