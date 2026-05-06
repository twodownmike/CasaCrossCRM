import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "./pipeline-board";
import { ConversationsList } from "./conversations-list";
import { InboxViewSwitcher } from "./inbox-view-switcher";
import { MarkRead } from "../messages/mark-read";
import type { Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const view = searchParams.view === "conversations" ? "conversations" : "submissions";

  const supabase = createClient();
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 3600 * 1000,
  ).toISOString();
  const portalReadAt =
    cookies().get("portal_read_at")?.value ?? fourteenDaysAgo;

  const [{ data: subs }, { count: unreadMessages }] = await Promise.all([
    supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("portal_messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_kind", "portal")
      .gt("created_at", portalReadAt),
  ]);

  const submissions = (subs ?? []) as Submission[];
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
  const pendingCount = countByStatus("pending");
  const activeCount = submissions.filter(
    (s) => s.status !== "approved" && s.status !== "archived",
  ).length;
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
      {view === "conversations" && <MarkRead />}

      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">
            {view === "conversations" ? "Portal" : "Intake"}
          </div>
          <h1>
            <em>Inbox</em>
          </h1>
          <div className="sub">
            {view === "conversations"
              ? "Conversations with your vendors and clients"
              : `${activeCount} active leads · stage, review, invite, approve`}
          </div>
        </div>
        {view === "submissions" && (
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
        )}
      </div>

      <InboxViewSwitcher
        view={view}
        submissionCount={pendingCount}
        conversationCount={unreadMessages ?? 0}
      />

      {view === "submissions" ? (
        <>
          <div className="stat-grid" style={{ marginBottom: 18, marginTop: 12 }}>
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
        </>
      ) : (
        <div style={{ marginTop: 16 }}>
          <ConversationsList />
        </div>
      )}
    </div>
  );
}
