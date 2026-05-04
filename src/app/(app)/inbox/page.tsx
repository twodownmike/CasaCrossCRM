import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./pipeline-board";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const supabase = createClient();

  const { data: subs } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  const submissions = (subs ?? []) as Submission[];
  const activeCount = submissions.filter(
    (s) => s.status !== "approved" && s.status !== "archived",
  ).length;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Intake</div>
          <h1>
            <em>Pipeline</em>
          </h1>
          <div className="sub">
            {activeCount} active · tap a stage pill to move an applicant
          </div>
        </div>
        <div className="page-head-actions">
          <a
            className="btn"
            href="/apply"
            target="_blank"
            rel="noopener noreferrer"
          >
            View apply form ↗
          </a>
        </div>
      </div>

      <PipelineBoard initialSubs={submissions} />
    </div>
  );
}
