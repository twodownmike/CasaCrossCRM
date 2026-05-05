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
  const today = new Date();
  const ageInDays = (createdAt: string) =>
    Math.max(
      0,
      Math.floor(
        (today.getTime() - new Date(createdAt).getTime()) / 86_400_000,
      ),
    );
  const countByStatus = (status: Submission["status"]) =>
    submissions.filter((s) => s.status === status).length;
  const staleCount = submissions.filter(
    (s) =>
      s.status !== "approved" &&
      s.status !== "archived" &&
      ageInDays(s.created_at) >= 7,
  ).length;
  const missingContactCount = submissions.filter(
    (s) =>
      s.status !== "approved" &&
      s.status !== "archived" &&
      !s.email &&
      !s.phone,
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
            {activeCount} active leads · stage, review, invite, approve
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

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="label">New leads</div>
          <div className="val tabnums">{countByStatus("pending")}</div>
          <div className="delta down">awaiting first review</div>
        </div>
        <div className="stat">
          <div className="label">In review</div>
          <div className="val tabnums">{countByStatus("reviewing")}</div>
          <div className="delta">need a decision</div>
        </div>
        <div className="stat">
          <div className="label">Invited</div>
          <div className="val tabnums">{countByStatus("invited")}</div>
          <div className="delta up">waiting on reply</div>
        </div>
        <div className="stat">
          <div className="label">Follow-up</div>
          <div className="val tabnums">{staleCount}</div>
          <div className="delta">
            {missingContactCount > 0
              ? `${missingContactCount} missing contact`
              : "7+ days active"}
          </div>
        </div>
      </div>

      <PipelineBoard initialSubs={submissions} />
    </div>
  );
}
