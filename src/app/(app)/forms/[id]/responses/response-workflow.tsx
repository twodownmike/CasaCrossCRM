"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFormResponseWorkflow } from "@/app/forms-actions";
import type { FormResponseStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{
  value: FormResponseStatus;
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "In review" },
  { value: "follow_up", label: "Follow-up" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
];

type TeamMember = {
  user_id: string;
  email: string;
  display_name: string | null;
};

export function ResponseWorkflow({
  responseId,
  formId,
  initialStatus,
  initialAssignedTo,
  initialNotes,
  initialTags,
  team,
}: {
  responseId: string;
  formId: string;
  initialStatus: FormResponseStatus;
  initialAssignedTo: string | null;
  initialNotes: string | null;
  initialTags: string[];
  team: TeamMember[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo || "");
  const [notes, setNotes] = useState(initialNotes || "");
  const [tags, setTags] = useState(initialTags.join(", "));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    const data = new FormData();
    data.set("id", responseId);
    data.set("form_id", formId);
    data.set("status", status);
    data.set("assigned_to", assignedTo);
    data.set("internal_notes", notes);
    data.set("tags", tags);
    setMessage(null);
    startTransition(async () => {
      const result = await updateFormResponseWorkflow(data);
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
          <span>Status</span>
          <select
            className="input"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as FormResponseStatus)
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Owner</span>
          <select
            className="input"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
          >
            <option value="">Unassigned</option>
            {team.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name || member.email}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>Tags</span>
        <input
          className="input"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="model, follow-up, priority"
        />
      </label>
      <label>
        <span>Internal notes</span>
        <textarea
          className="input textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Visible only to the Casa Cross team"
        />
      </label>
      <div className="response-workflow-actions">
        <span role="status" className={message === "Saved" ? "saved" : "error"}>
          {message}
        </span>
        <button className="btn" type="button" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save workflow"}
        </button>
      </div>
    </div>
  );
}
