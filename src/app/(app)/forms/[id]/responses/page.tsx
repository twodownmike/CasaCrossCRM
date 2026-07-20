import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icons";
import { fmtDateFull, relTime } from "@/lib/format";
import { ResponseRow } from "./response-row";
import { ResponseWorkflow } from "./response-workflow";
import type { FormResponseStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FormResponses({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { status?: string };
}) {
  const supabase = createClient();
  const [{ data: f }, { data: fields }, { data: responses }, { data: team }] =
    await Promise.all([
      supabase.from("forms").select("*").eq("id", params.id).maybeSingle(),
      supabase
        .from("form_fields")
        .select("*")
        .eq("form_id", params.id)
        .order("position", { ascending: true }),
      supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", params.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("list_team_members"),
    ]);
  if (!f) notFound();

  const statuses: Array<{ value: FormResponseStatus; label: string }> = [
    { value: "new", label: "New" },
    { value: "reviewing", label: "In review" },
    { value: "follow_up", label: "Follow-up" },
    { value: "qualified", label: "Qualified" },
    { value: "closed", label: "Closed" },
  ];
  const selectedStatus = statuses.some(
    (status) => status.value === searchParams?.status,
  )
    ? (searchParams?.status as FormResponseStatus)
    : null;
  const allResponses = responses ?? [];
  const visibleResponses = selectedStatus
    ? allResponses.filter((response) => response.status === selectedStatus)
    : allResponses;

  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href={`/forms/${f.id}`}>
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          Responses
        </div>
        <Link
          className="icon-btn"
          href={`/forms/${f.id}/analytics`}
          aria-label="Form analytics"
          title="Form analytics"
        >
          <Icon.chart />
        </Link>
      </header>

      <div className="page-head">
        <div className="eyebrow">{f.title}</div>
        <h1>
          {allResponses.length} response
          {allResponses.length === 1 ? "" : "s"}
        </h1>
      </div>

      <nav className="response-filter-tabs" aria-label="Filter responses">
        <Link
          href={`/forms/${f.id}/responses`}
          className={!selectedStatus ? "active" : undefined}
        >
          All <span>{allResponses.length}</span>
        </Link>
        {statuses.map((status) => {
          const count = allResponses.filter(
            (response) => response.status === status.value,
          ).length;
          return (
            <Link
              key={status.value}
              href={`/forms/${f.id}/responses?status=${status.value}`}
              className={selectedStatus === status.value ? "active" : undefined}
            >
              {status.label} <span>{count}</span>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: "0 var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {visibleResponses.length === 0 ? (
          <div className="empty">
            <h3>{allResponses.length === 0 ? "Nothing yet" : "No matches"}</h3>
            <div>
              {allResponses.length === 0
                ? "Share the form link to start collecting responses."
                : "No responses are currently in this workflow stage."}
            </div>
          </div>
        ) : (
          visibleResponses.map((r) => (
            <div key={r.id} className="card elev" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-4)",
                  fontWeight: 500,
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {fmtDateFull(r.created_at.slice(0, 10))} ·{" "}
                  {relTime(r.created_at)}
                </span>
                <span className={`pill form-response-${r.status || "new"}`}>
                  {statuses.find(
                    (status) => status.value === (r.status || "new"),
                  )?.label || "New"}
                </span>
              </div>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  gap: "8px 18px",
                  margin: 0,
                }}
              >
                {(fields ?? [])
                  .filter((field) => field.type !== "section")
                  .map((field) => {
                    const v = (r.data as Record<string, unknown>)[
                      field.field_key
                    ];
                    const display =
                      v === null || v === undefined || v === ""
                        ? "—"
                        : typeof v === "boolean"
                          ? v
                            ? "Yes"
                            : "No"
                          : Array.isArray(v)
                            ? v.length > 0
                              ? v.join(", ")
                              : "—"
                            : String(v);
                    return (
                      <div
                        key={field.id}
                        style={{ display: "contents", fontSize: 13 }}
                      >
                        <dt
                          style={{
                            color: "var(--ink-3)",
                            fontWeight: 500,
                          }}
                        >
                          {field.label}
                        </dt>
                        <dd
                          style={{
                            margin: 0,
                            color: "var(--ink-2)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {display}
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              <details className="response-workflow-details">
                <summary>Manage intake</summary>
                <ResponseWorkflow
                  responseId={r.id}
                  formId={f.id}
                  initialStatus={(r.status || "new") as FormResponseStatus}
                  initialAssignedTo={r.assigned_to || null}
                  initialNotes={r.internal_notes || null}
                  initialTags={r.tags || []}
                  team={team ?? []}
                />
                <div className="response-delete-row">
                  <ResponseRow id={r.id} formId={f.id} />
                </div>
              </details>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
