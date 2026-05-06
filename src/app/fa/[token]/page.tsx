import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { fmtDateFull } from "@/lib/format";
import { PublicFormRenderer } from "@/app/f/[slug]/public-form";
import type { FormField } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AssignedFormPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createClient();
  const { data: assignmentRows } = await supabase.rpc(
    "get_form_assignment_by_token",
    { assignment_token: params.token },
  );
  const assignment = assignmentRows?.[0];
  if (!assignment) notFound();

  const { data: fields } = await supabase
    .from("form_fields")
    .select("*")
    .eq("form_id", assignment.form_id)
    .order("position", { ascending: true });

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 620 }}>
        <div className="brand" style={{ justifyContent: "center" }}>
          <Logo variant="auth" />
        </div>
        <div className="eyebrow" style={{ marginTop: 8 }}>
          {assignment.event_name}
        </div>
        <h1 style={{ marginTop: 6 }}>{assignment.form_title}</h1>
        <div className="sub">
          {assignment.person_name} · {fmtDateFull(assignment.event_date)}
        </div>
        {assignment.completed_at ? (
          <div className="notice">
            This form was completed. Casa Cross has your response.
          </div>
        ) : (
          <>
            {assignment.form_description && (
              <p
                className="muted"
                style={{ fontSize: 13, lineHeight: 1.5, marginTop: -8 }}
              >
                {assignment.form_description}
              </p>
            )}
            <PublicFormRenderer
              formId={assignment.form_id}
              slug={assignment.form_slug}
              fields={(fields ?? []) as FormField[]}
              assignmentToken={params.token}
            />
          </>
        )}
      </div>
    </div>
  );
}
