"use client";

import Link from "next/link";
import { createEvent, updateEvent, deleteEvent } from "@/app/actions";
import type { EventRow } from "@/lib/types";
import { CoverUploader } from "@/components/cover-uploader";

const COVERS = [
  "magnolia",
  "coastal",
  "garden",
  "vintage",
  "modern",
  "rose",
  "tuscany",
];
const STATUSES = ["planning", "confirmed", "pending", "wrapped"] as const;

export function EventForm({ event }: { event?: EventRow }) {
  const editing = !!event;
  return (
    <form action={editing ? updateEvent : createEvent} className="form-grid">
      {editing && <input type="hidden" name="id" value={event!.id} />}
      <div>
        <label className="form-label">Name</label>
        <input
          name="name"
          required
          className="input"
          defaultValue={event?.name || ""}
          placeholder="Magnolia Bridal"
        />
      </div>
      <div>
        <label className="form-label">Subtitle</label>
        <input
          name="subtitle"
          className="input"
          defaultValue={event?.subtitle || ""}
          placeholder="Styled wedding shoot"
        />
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Date</label>
          <input
            name="date"
            type="date"
            required
            className="input"
            defaultValue={event?.date || ""}
          />
        </div>
        <div>
          <label className="form-label">Time</label>
          <input
            name="time_label"
            className="input"
            defaultValue={event?.time_label || ""}
            placeholder="8:00 AM – 6:00 PM"
          />
        </div>
      </div>
      <div>
        <label className="form-label">Location</label>
        <input
          name="location"
          className="input"
          defaultValue={event?.location || ""}
          placeholder="Magnolia Manor, Fredericksburg"
        />
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Status</label>
          <select
            name="status"
            className="input"
            defaultValue={event?.status || "planning"}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Capacity</label>
          <input
            name="capacity"
            type="number"
            min="1"
            className="input"
            defaultValue={event?.capacity ?? 12}
          />
        </div>
      </div>
      <CoverUploader
        initialUrl={event?.cover_image_url}
        fallbackCover={event?.cover}
      />
      <div>
        <label className="form-label">Gradient fallback</label>
        <select
          name="cover"
          className="input"
          defaultValue={event?.cover || "modern"}
        >
          {COVERS.map((c) => (
            <option key={c} value={c}>
              {c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">Tags (comma separated)</label>
        <input
          name="tags"
          className="input"
          defaultValue={(event?.tags || []).join(", ")}
          placeholder="Editorial, Bridal, Hill Country"
        />
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea
          name="description"
          className="input textarea"
          defaultValue={event?.description || ""}
          placeholder="Tell the story of this shoot…"
        />
      </div>

      <button className="btn primary block" type="submit">
        {editing ? "Save changes" : "Create event"}
      </button>

      {editing && (
        <DeleteEventButton id={event!.id} />
      )}

      <Link
        href={editing ? `/events/${event!.id}` : "/events"}
        className="cancel-link"
        style={{ textAlign: "center" }}
      >
        Cancel
      </Link>
    </form>
  );
}

function DeleteEventButton({ id }: { id: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this event? This will also remove all participants, tasks, activity, and messages.",
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        className="btn block"
        style={{ color: "var(--terracotta)", borderColor: "var(--hair)" }}
        type="submit"
      >
        Delete event
      </button>
    </form>
  );
}
