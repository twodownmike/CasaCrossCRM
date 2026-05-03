/* Casa Cross — Dashboard view */

function Dashboard({ go }) {
  const upcoming = EVENTS.filter(e => e.status !== "wrapped").sort((a,b) => a.date.localeCompare(b.date));
  const next = upcoming[0];
  const fin = aggregateFinances();

  // Action items across events: overdue payments & unsigned contracts
  const actions = [];
  EVENTS.forEach(e => {
    if (e.status === "wrapped") return;
    e.participants.forEach(p => {
      if (p.contract === "unsent") {
        actions.push({ kind: "contract", event: e, p });
      } else if (p.status === "due" && p.dueDate && daysUntil(p.dueDate) < 7) {
        actions.push({ kind: "payment", event: e, p });
      }
    });
  });
  const todaysTodos = [];
  EVENTS.forEach(e => {
    e.todos.filter(t => !t.done).forEach(t => {
      const d = daysUntil(t.due);
      if (d <= 14 && d >= 0) todaysTodos.push({ event: e, todo: t });
    });
  });
  todaysTodos.sort((a,b) => a.todo.due.localeCompare(b.todo.due));

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Tuesday · May 5</div>
        <h1>Morning, <em>Anna</em>.</h1>
        <div className="sub">{upcoming.length} active events · {actions.length} need attention</div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat">
          <div className="label">Outstanding</div>
          <div className="val tabnums">{fmtMoney(fin.owed)}</div>
          <div className="delta down">{fmtMoney(fin.overdue)} overdue</div>
        </div>
        <div className="stat">
          <div className="label">Collected</div>
          <div className="val tabnums">{fmtMoney(fin.paid)}</div>
          <div className="delta up">across {EVENTS.length} events</div>
        </div>
      </div>

      {/* Next event hero */}
      {next && (
        <React.Fragment>
          <div className="section-label">
            <h2>Up next</h2>
            <button className="more" onClick={() => go({ view: "events" })}>All events ›</button>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <EventCard event={next} onClick={() => go({ view: "event_detail", id: next.id })} />
          </div>
        </React.Fragment>
      )}

      {/* Action items */}
      {actions.length > 0 && (
        <React.Fragment>
          <div className="section-label">
            <h2>Needs your attention</h2>
            <span className="pill warn"><span className="dot" />{actions.length}</span>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <div className="card elev">
              {actions.slice(0, 5).map((a, i) => {
                const person = getPerson(a.p.personId);
                return (
                  <button key={i} className="card-row" onClick={() => go({ view: "event_detail", id: a.event.id })}>
                    <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--terracotta-tint)", color: "var(--terracotta)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {a.kind === "contract" ? <I.doc /> : <I.dollar />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.kind === "contract" ? `Send contract to ${person.name}` : `Payment due from ${person.name}`}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                        {a.event.name}
                        {a.kind === "payment" && a.p.dueDate && ` · due ${fmtDate(a.p.dueDate, { short: true })}`}
                      </div>
                    </div>
                    <I.chev style={{ color: "var(--ink-4)" }} />
                  </button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      )}

      {/* Today's tasks */}
      {todaysTodos.length > 0 && (
        <React.Fragment>
          <div className="section-label">
            <h2>This week</h2>
            <span className="muted" style={{ fontSize: 12 }}>{todaysTodos.length} tasks</span>
          </div>
          <div style={{ padding: "0 var(--s-5)" }}>
            <div className="card elev">
              {todaysTodos.slice(0, 4).map((t, i) => (
                <button key={i} className="card-row" onClick={() => go({ view: "event_detail", id: t.event.id })}>
                  <span style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--ink-4)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: "var(--ink)" }}>{t.todo.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                      {t.event.name} · {daysUntilLabel(t.todo.due) || fmtDate(t.todo.due, { short: true })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </React.Fragment>
      )}

      {/* Quick people */}
      <div className="section-label">
        <h2>Recent people</h2>
        <button className="more" onClick={() => go({ view: "people" })}>Roster ›</button>
      </div>
      <div style={{ padding: "0 var(--s-5)", display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
        {PEOPLE.slice(0, 8).map(p => (
          <button key={p.id} onClick={() => go({ view: "person_detail", id: p.id })}
                  style={{ flexShrink: 0, width: 100, padding: 12, background: "var(--paper)", border: "1px solid var(--hair)", borderRadius: "var(--r-3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <Avatar person={p} size="lg" />
            <div style={{ fontSize: 12, fontWeight: 500, textAlign: "center", lineHeight: 1.2 }}>{p.name.split(" ")[0]}</div>
            <RolePill role={p.role} />
          </button>
        ))}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

window.Dashboard = Dashboard;
