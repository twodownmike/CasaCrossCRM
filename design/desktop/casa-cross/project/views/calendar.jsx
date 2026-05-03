/* Casa Cross — Calendar view */

function CalendarView({ go }) {
  const [cursor, setCursor] = React.useState(new Date(2026, 4, 1)); // May 2026
  const [selected, setSelected] = React.useState("2026-05-12");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleString("en-US", { month: "long" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);

  const eventsByDate = {};
  EVENTS.forEach(e => {
    (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e);
  });

  const cells = [];
  // Leading days from prev month
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    cells.push({ d, muted: true, iso: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ d, muted: false, iso });
  }
  while (cells.length % 7) cells.push({ d: cells.length - daysInMonth - firstDay + 1, muted: true, iso: null });

  const selectedEvents = selected ? (eventsByDate[selected] || []) : [];

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Calendar</div>
        <h1>{monthName} <em>{year}</em></h1>
      </div>

      <div className="row between" style={{ padding: "0 var(--s-5)", marginBottom: 12 }}>
        <button className="icon-btn bordered" onClick={() => setCursor(new Date(year, month-1, 1))}><I.back /></button>
        <button className="btn sm" onClick={() => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); }}>Today</button>
        <button className="icon-btn bordered" onClick={() => setCursor(new Date(year, month+1, 1))}><I.chev /></button>
      </div>

      <div className="cal-grid" style={{ marginBottom: 0 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} className="cal-h">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((c, i) => {
          if (!c.iso) return <div key={i} className="cal-d muted">{c.d}</div>;
          const isToday = c.iso === today.toISOString().slice(0,10);
          const has = !!eventsByDate[c.iso];
          const isSel = c.iso === selected;
          const cls = ["cal-d"];
          if (isToday) cls.push("today");
          if (has) cls.push("has-event");
          if (isSel) cls.push("selected");
          return (
            <button key={i} className={cls.join(" ")} onClick={() => setSelected(c.iso)}>
              {c.d}
            </button>
          );
        })}
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>{selected ? fmtDate(selected, { weekday: true }) : "Pick a date"}</h2>
        <span className="muted" style={{ fontSize: 12 }}>{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</span>
      </div>

      <div style={{ padding: "0 var(--s-5)", display: "flex", flexDirection: "column", gap: 12 }}>
        {selectedEvents.map(e => <EventCard key={e.id} event={e} onClick={() => go({ view: "event_detail", id: e.id })} />)}
        {selectedEvents.length === 0 && (
          <div className="card elev" style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15 }}>Open day</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Tap to schedule something here.</div>
          </div>
        )}
      </div>

      <div className="section-label" style={{ marginTop: 28 }}>
        <h2>This month</h2>
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <div className="card elev">
          {EVENTS.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).map(e => (
            <button key={e.id} className="card-row" onClick={() => go({ view: "event_detail", id: e.id })}>
              <div style={{ width: 44, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500 }}>{new Date(e.date+"T12:00:00").toLocaleString("en-US", { month: "short" })}</div>
                <div style={{ fontFamily: "var(--serif-display)", fontSize: 24, lineHeight: 1, marginTop: 2 }}>{new Date(e.date+"T12:00:00").getDate()}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{e.time}</div>
              </div>
              <StatusPill status={e.status} />
            </button>
          ))}
          {EVENTS.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No events this month.</div>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

window.CalendarView = CalendarView;
