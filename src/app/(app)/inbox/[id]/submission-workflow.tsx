"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSubmissionWorkflow } from "@/app/actions";
import type { IntakePriority } from "@/lib/types";

type TeamMember = {
  user_id: string;
  email: string;
  display_name: string | null;
};

const PRIORITIES: Array<{ value: IntakePriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function SubmissionWorkflow({
  submissionId,
  initialOwnerId,
  initialFollowUpAt,
  initialPriority,
  initialSource,
  initialOutcome,
  team,
}: {
  submissionId: string;
  initialOwnerId: string | null;
  initialFollowUpAt: string | null;
  initialPriority: IntakePriority;
  initialSource: string;
  initialOutcome: string | null;
  team: TeamMember[];
}) {
  const router = useRouter();
  const [ownerId, setOwnerId] = useState(initialOwnerId || "");
  const [followUpAt, setFollowUpAt] = useState(
    localDateTime(initialFollowUpAt),
  );
  const [priority, setPriority] = useState(initialPriority);
  const [source, setSource] = useState(initialSource);
  const [outcome, setOutcome] = useState(initialOutcome || "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    const data = new FormData();
    data.set("id", submissionId);
    data.set("owner_id", ownerId);
    data.set(
      "follow_up_at",
      followUpAt ? new Date(followUpAt).toISOString() : "",
    );
    data.set("priority", priority);
    data.set("source", source);
    data.set("outcome", outcome);
    setMessage(null);
    startTransition(async () => {
      const result = await updateSubmissionWorkflow(data);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Saved");
      router.refresh();
    });
  }

  return (
    <div className="response-workflow">
      <div className="response-workflow-grid">
        <label>
          <span>Owner</span>
          <select
            className="input"
            value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {team.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name || member.email}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select
            className="input"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IntakePriority)
            }
          >
            {PRIORITIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Follow-up</span>
          <input
            className="input"
            type="datetime-local"
            value={followUpAt}
            onChange={(event) => setFollowUpAt(event.target.value)}
          />
        </label>
        <label>
          <span>Source</span>
          <input
            className="input"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            list="intake-sources"
          />
        </label>
      </div>
      <label>
        <span>Outcome</span>
        <input
          className="input"
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
          placeholder="Decision, result, or next step"
        />
      </label>
      <datalist id="intake-sources">
        <option value="Website application" />
        <option value="Shared form" />
        <option value="Referral" />
        <option value="Instagram" />
        <option value="Repeat client" />
        <option value="Event" />
      </datalist>
      <div className="response-workflow-actions">
        <span role="status" className={message === "Saved" ? "saved" : "error"}>
          {message}
        </span>
        <button className="btn" type="button" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save intake details"}
        </button>
      </div>
    </div>
  );
}
