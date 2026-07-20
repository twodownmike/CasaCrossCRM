import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

type AnalyticsEvent = {
  event_type: "view" | "start";
  created_at: string;
};

type ResponseRecord = {
  status: string;
  data: Record<string, unknown>;
  created_at: string;
};

const WORKFLOW_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "In review",
  follow_up: "Follow-up",
  qualified: "Qualified",
  closed: "Closed",
};

export default async function FormAnalytics({
  params,
}: {
  params: { id: string };
}) {
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
      .select("id, field_key, label, type, options")
      .eq("form_id", params.id)
      .order("position", { ascending: true }),
    supabase
      .from("form_responses")
      .select("status, data, created_at")
      .eq("form_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("form_analytics_events")
      .select("event_type, created_at")
      .eq("form_id", params.id)
      .order("created_at", { ascending: true }),
  ]);
  if (!form) notFound();

  const responseRows = (responses ?? []) as ResponseRecord[];
  const eventRows = (events ?? []) as AnalyticsEvent[];
  const thirtyDaysAgo = startOfDay(addDays(new Date(), -29));
  const firstTrackedAt = eventRows[0]
    ? new Date(eventRows[0].created_at)
    : new Date();
  const measurementStart =
    firstTrackedAt > thirtyDaysAgo ? firstTrackedAt : thirtyDaysAgo;
  const recentResponses = responseRows.filter(
    (response) => new Date(response.created_at) >= measurementStart,
  );
  const recentEvents = eventRows.filter(
    (event) => new Date(event.created_at) >= thirtyDaysAgo,
  );
  const views = recentEvents.filter(
    (event) => event.event_type === "view",
  ).length;
  const starts = recentEvents.filter(
    (event) => event.event_type === "start",
  ).length;
  const submissions = recentResponses.length;
  const conversion = views > 0 ? Math.min((submissions / views) * 100, 100) : 0;
  const completion =
    starts > 0 ? Math.min((submissions / starts) * 100, 100) : 0;
  const daily = buildDailySeries(eventRows, responseRows, 14);
  const maxDaily = Math.max(
    1,
    ...daily.flatMap((day) => [day.views, day.starts, day.submissions]),
  );
  const workflow = Object.entries(WORKFLOW_LABELS).map(([key, label]) => ({
    key,
    label,
    count: responseRows.filter((response) => (response.status || "new") === key)
      .length,
  }));
  const insights = (fields ?? [])
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

      <div className="page-head">
        <div className="eyebrow">{form.title}</div>
        <h1>Form performance</h1>
        <div className="sub">
          Last 30 days, measured from the start of analytics tracking
        </div>
      </div>

      <div className="form-analytics-stats">
        <Metric
          label="Unique views"
          value={views}
          detail="deduplicated by browser session"
        />
        <Metric
          label="Started"
          value={starts}
          detail={`${percent(starts, views)} of viewers`}
        />
        <Metric
          label="Submitted"
          value={submissions}
          detail={`${responseRows.length} all time`}
        />
        <Metric
          label="View conversion"
          value={`${Math.round(conversion)}%`}
          detail={`${Math.round(completion)}% of starts completed`}
        />
      </div>

      <section className="analytics-section">
        <div className="section-label analytics-section-label">
          <h2>Last 14 days</h2>
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
          className="analytics-chart"
          role="img"
          aria-label="Views, starts, and submissions over the last 14 days"
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

      <section className="analytics-section">
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
