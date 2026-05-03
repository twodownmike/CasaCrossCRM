/* Casa Cross — Events list view */

function EventsView({ go }) {
  const [filter, setFilter] = React.useState("all"); // all | upcoming | wrapped

  const all = [...EVENTS].sort((a,b) => a.date.localeCompare(b.date));
  let list = all;
  if (filter === "upcoming") list = all.filter(e => e.status !== "wrapped");
  if (filter === "wrapped")  list = all.filter(e => e.status === "wrapped");

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Studio</div>
        <h1>All <em>events</em></h1>
        <div className="sub">{EVENTS.length} total · {EVENTS.filter(e=>e.status!=="wrapped").length} active</div>
      </div>

      <div className="tabs" style={{ marginTop: 4 }}>
        {[["all","All"],["upcoming","Upcoming"],["wrapped","Wrapped"]].map(([k,l]) => (
          <button key={k} className={`tab ${filter===k?"active":""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div style={{ padding: "var(--s-5)", display: "flex", flexDirection: "column", gap: 14 }}>
        {list.map(e => <EventCard key={e.id} event={e} onClick={() => go({ view: "event_detail", id: e.id })} />)}
        {list.length === 0 && (
          <div className="empty"><h3>No events here</h3><div>Try another filter.</div></div>
        )}
      </div>
    </div>
  );
}

window.EventsView = EventsView;
