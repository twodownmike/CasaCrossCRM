import { listEvents } from "@/lib/queries";
import { EventCard } from "@/components/event-card";
import { EventsTabs } from "./events-tabs";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const filter = searchParams.filter || "all";
  const events = await listEvents();

  let list = events;
  if (filter === "upcoming")
    list = events.filter((e) => e.status !== "wrapped");
  if (filter === "wrapped") list = events.filter((e) => e.status === "wrapped");

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Studio</div>
        <h1>
          All <em>events</em>
        </h1>
        <div className="sub">
          {events.length} total ·{" "}
          {events.filter((e) => e.status !== "wrapped").length} active
        </div>
      </div>

      <EventsTabs filter={filter} />

      <div
        style={{
          padding: "var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {list.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
        {list.length === 0 && (
          <div className="empty">
            <h3>No events here</h3>
            <div>Try another filter, or create a new shoot.</div>
          </div>
        )}
      </div>
    </div>
  );
}
