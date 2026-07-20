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
const STAGES = [
  ["planning", "Planning"],
  ["booking", "Booking"],
  ["finalizing", "Finalizing"],
  ["ready", "Ready"],
  ["complete", "Complete"],
] as const;

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
          <label className="form-label">Workflow stage</label>
          <select
            name="stage"
            className="input"
            defaultValue={event?.stage || "planning"}
          >
            {STAGES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
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
        <label className="form-label">Internal description</label>
        <textarea
          name="description"
          className="input textarea"
          defaultValue={event?.description || ""}
          placeholder="Team-only planning notes, budget context, sensitive logistics..."
        />
        <p
          className="muted"
          style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
        >
          This stays inside the CRM and is not shown in the client portal.
        </p>
      </div>
      <div>
        <label className="form-label">Portal-safe event brief</label>
        <textarea
          name="portal_brief"
          className="input textarea"
          defaultValue={event?.portal_brief || ""}
          placeholder="Client-safe details: parking, arrival instructions, what to bring..."
        />
        <p
          className="muted"
          style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
        >
          This is the only event brief shown to portal users.
        </p>
      </div>

      <label
        className="checkbox-row"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: 14,
          border: "1px solid var(--hair)",
          borderRadius: "var(--r-2)",
          background: "var(--paper)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={!!event?.is_public}
          style={{ marginTop: 2 }}
        />
        <span style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Publish a public landing page
          </span>
          <span
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 4,
              lineHeight: 1.4,
            }}
          >
            Anyone with the URL can see the event title, date, and location.
            Hides money, tasks, and the team roster.
          </span>
          {event?.is_public && event?.public_slug && (
            <PublicLink slug={event.public_slug} />
          )}
        </span>
      </label>

      <button className="btn primary block" type="submit">
        {editing ? "Save changes" : "Create event"}
      </button>

      {editing && <DeleteEventButton id={event!.id} />}

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

function PublicLink({ slug }: { slug: string }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    process.env.NEXT_PUBLIC_EVENTS_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const path = `/e/${slug}`;
  const url = `${baseUrl}${path}`;
  return (
    <span
      style={{
        display: "block",
        marginTop: 10,
        padding: "6px 10px",
        borderRadius: 6,
        background: "var(--hair-2)",
        fontSize: 12,
        color: "var(--ink-2)",
        wordBreak: "break-all",
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    </span>
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
