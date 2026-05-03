/* Casa Cross — Desktop views (single file, all desktop screens) */

function useIsDesktop() {
  const [is, setIs] = React.useState(window.innerWidth >= 1024);
  React.useEffect(() => {
    const onResize = () => setIs(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return is;
}

// ═══════════ Sidebar ═══════════
function DSSidebar({ route, go }) {
  const upcoming = EVENTS.filter(e => e.status !== "wrapped").length;
  const peopleCount = PEOPLE.length;
  const messages = EVENTS.filter(e => e.chat.length > 0).length;

  const items = [
    { id: "home",     label: "Dashboard", icon: I.home },
    { id: "events",   label: "Events",    icon: I.spark,    count: upcoming },
    { id: "calendar", label: "Calendar",  icon: I.calendar },
    { id: "people",   label: "People",    icon: I.people,   count: peopleCount },
    { id: "messages", label: "Messages",  icon: I.chat,     count: messages },
  ];

  const tabFromView = {
    home: "home", events: "events", event_detail: "events",
    people: "people", person_detail: "people",
    calendar: "calendar", messages: "messages",
  };
  const active = tabFromView[route.view];

  const upcomingEvents = EVENTS.filter(e => e.status !== "wrapped").sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);

  return (
    <aside className="ds-sidebar">
      <div className="ds-brand">
        <span className="mark" />
        <span>Casa Cross</span>
      </div>

      <nav className="ds-nav">
        {items.map(it => {
          const Ico = it.icon;
          return (
            <button key={it.id}
                    className={`ds-nav-item ${active === it.id ? "active" : ""}`}
                    onClick={() => go({ view: it.id })}>
              <Ico />
              <span>{it.label}</span>
              {it.count !== undefined && <span className="ds-count">{it.count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="ds-nav-section">Pinned events</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {upcomingEvents.map(e => (
          <button key={e.id} className="ds-pinned" onClick={() => go({ view: "event_detail", id: e.id })}>
            <div className={`swatch cover-${e.cover}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pname">{e.name}</div>
              <div className="pdate">{fmtDate(e.date, { short: true })}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="ds-user">
        <span className="avatar sm" style={{ background: "var(--terracotta-tint)", color: "var(--terracotta)" }}>AC</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="name">Anna Cross</div>
          <div className="role">Founder</div>
        </div>
        <button className="icon-btn" onClick={() => window.__toast("Settings")}><I.more /></button>
      </div>
    </aside>
  );
}

// ═══════════ Topbar ═══════════
function DSTopbar({ route, go }) {
  const crumbs = [];
  if (route.view === "home") crumbs.push({ label: "Dashboard" });
  if (route.view === "events") crumbs.push({ label: "Events" });
  if (route.view === "event_detail") {
    crumbs.push({ label: "Events", click: () => go({ view: "events" }) });
    const e = getEvent(route.id);
    if (e) crumbs.push({ label: e.name });
  }
  if (route.view === "people") crumbs.push({ label: "People" });
  if (route.view === "person_detail") {
    crumbs.push({ label: "People", click: () => go({ view: "people" }) });
    const p = getPerson(route.id);
    if (p) crumbs.push({ label: p.name });
  }
  if (route.view === "calendar") crumbs.push({ label: "Calendar" });
  if (route.view === "messages") crumbs.push({ label: "Messages" });

  return (
    <div className="ds-topbar">
      <div className="crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: "var(--ink-5)" }}>/</span>}
            {c.click ? <button onClick={c.click} style={{ background: "none", border: "none", color: "var(--ink-3)", padding: 0, cursor: "pointer", fontSize: 13 }}>{c.label}</button>
                     : (i === crumbs.length - 1 ? <strong>{c.label}</strong> : <span>{c.label}</span>)}
          </React.Fragment>
        ))}
      </div>
      <div className="grow" />
      <div className="ds-search">
        <I.search />
        <input placeholder="Search events, people, vendors…" />
        <span className="kbd">⌘K</span>
      </div>
      <button className="icon-btn" onClick={() => window.__toast("3 notifications")}><I.bell /></button>
      <button className="btn primary sm" onClick={() => window.__toast("New event")}><I.plus /> New event</button>
    </div>
  );
}

// ═══════════ Dashboard (desktop) ═══════════
function DSDashboard({ go }) {
  const upcoming = EVENTS.filter(e => e.status !== "wrapped").sort((a,b)=>a.date.localeCompare(b.date));
  const next = upcoming[0];
  const fin = aggregateFinances();

  const actions = [];
  EVENTS.forEach(e => {
    if (e.status === "wrapped") return;
    e.participants.forEach(p => {
      if (p.contract === "unsent") actions.push({ kind: "contract", event: e, p });
      else if (p.status === "due" && p.dueDate && daysUntil(p.dueDate) < 14) actions.push({ kind: "payment", event: e, p });
    });
  });

  const tasks = [];
  EVENTS.forEach(e => e.todos.filter(t => !t.done).forEach(t => {
    const d = daysUntil(t.due);
    if (d >= 0 && d <= 21) tasks.push({ event: e, todo: t });
  }));
  tasks.sort((a,b) => a.todo.due.localeCompare(b.todo.due));

  return (
    <div className="fade-in">
      <div className="ds-pagehead">
        <div className="left">
          <div className="eyebrow">Tuesday · May 5, 2026</div>
          <h1>Morning, <em>Anna</em>.</h1>
          <div className="sub">{upcoming.length} active events · {actions.length} need attention · Magnolia Bridal in {daysUntil(next.date)} days</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn"><I.upload /> Export</button>
          <button className="btn primary"><I.plus /> New event</button>
        </div>
      </div>

      {/* Stats */}
      <div className="ds-dash">
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
        <div className="stat">
          <div className="label">Active people</div>
          <div className="val tabnums">{PEOPLE.length}</div>
          <div className="delta">{ROLE_ORDER.length} roles</div>
        </div>
        <div className="stat">
          <div className="label">Open tasks</div>
          <div className="val tabnums">{tasks.length}</div>
          <div className="delta">across active events</div>
        </div>
      </div>

      {/* Featured up-next event */}
      {next && (
        <div className="ds-feature">
          <div className={`img cover-${next.cover}`} />
          <div className="body">
            <div className="pills">
              <StatusPill status={next.status} />
              <span className="pill"><span className="dot" />{daysUntilLabel(next.date) || fmtDate(next.date)}</span>
              {next.tags.map(t => <span key={t} className="pill">{t}</span>)}
            </div>
            <div className="eyebrow" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500 }}>{next.subtitle}</div>
            <h2>{next.name}</h2>
            <div className="desc">{next.description}</div>
            <div className="info">
              <div>
                <div className="ilabel">When</div>
                <div className="ival">{fmtDateFull(next.date)}</div>
              </div>
              <div>
                <div className="ilabel">Where</div>
                <div className="ival">{next.location}</div>
              </div>
              <div>
                <div className="ilabel">Roster</div>
                <div className="ival">{next.participants.length} of {next.capacity}</div>
              </div>
            </div>
            <div className="actions" style={{ marginTop: 14 }}>
              <button className="btn primary" onClick={() => go({ view: "event_detail", id: next.id })}>Open event</button>
              <button className="btn" onClick={() => window.__toast("Reminders sent")}>Send reminders</button>
            </div>
          </div>
        </div>
      )}

      {/* Two col: actions + tasks */}
      <div className="ds-two-col">
        <div className="ds-card">
          <div className="ds-card-head">
            <h3>Needs your attention</h3>
            <span className="meta">{actions.length} items</span>
          </div>
          {actions.slice(0, 8).map((a, i) => {
            const person = getPerson(a.p.personId);
            return (
              <button key={i} className="ds-row action-row" onClick={() => go({ view: "event_detail", id: a.event.id })}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: a.kind==="contract" ? "var(--gold-tint)" : "var(--terracotta-tint)", color: a.kind==="contract" ? "#8a6c2e" : "var(--terracotta)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {a.kind === "contract" ? <I.doc /> : <I.dollar />}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {a.kind === "contract" ? `Send contract to ${person.name}` : `Payment due from ${person.name}`}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {a.event.name} {a.kind === "payment" && a.p.dueDate && `· due ${fmtDate(a.p.dueDate, { short: true })}`}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "right" }}>
                  {a.kind === "payment" ? <span className="money tabnums">{fmtMoney(a.p.rate - a.p.paid)}</span> : "Unsent"}
                </div>
                <I.chev style={{ color: "var(--ink-4)" }} />
              </button>
            );
          })}
        </div>

        <div className="ds-card">
          <div className="ds-card-head">
            <h3>This week</h3>
            <span className="meta">{tasks.length} tasks</span>
          </div>
          {tasks.slice(0, 8).map((t, i) => (
            <button key={i} className="ds-row task-row" onClick={() => go({ view: "event_detail", id: t.event.id })}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid var(--ink-4)" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--ink)" }}>{t.todo.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{t.event.name}</div>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{daysUntilLabel(t.todo.due) || fmtDate(t.todo.due, { short: true })}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════ Events list (desktop) ═══════════
function DSEvents({ go }) {
  const [filter, setFilter] = React.useState("all");
  let list = [...EVENTS].sort((a,b) => a.date.localeCompare(b.date));
  if (filter === "upcoming") list = list.filter(e => e.status !== "wrapped");
  if (filter === "wrapped")  list = list.filter(e => e.status === "wrapped");

  return (
    <div className="fade-in">
      <div className="ds-pagehead">
        <div className="left">
          <div className="eyebrow">Studio</div>
          <h1>All <em>events</em></h1>
          <div className="sub">{EVENTS.length} total · {EVENTS.filter(e=>e.status!=="wrapped").length} active</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn"><I.filter /> Filter</button>
          <button className="btn primary"><I.plus /> New event</button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 18, padding: 0, borderBottom: "1px solid var(--hair)" }}>
        {[["all","All"],["upcoming","Upcoming"],["wrapped","Wrapped"]].map(([k,l]) => (
          <button key={k} className={`tab ${filter===k?"active":""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <div className="ds-card">
        <div className="ds-table-head event-row" style={{ gridTemplateColumns: "56px 1fr 110px 130px 120px 24px" }}>
          <span></span>
          <span>Event</span>
          <span>Date</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Collected</span>
          <span></span>
        </div>
        {list.map(e => {
          const totals = e.participants.reduce((a,p)=>{ a.rate+=p.rate; a.paid+=p.paid; return a; }, { rate:0, paid:0 });
          const pct = totals.rate ? Math.round(totals.paid/totals.rate*100) : 100;
          return (
            <button key={e.id} className="ds-row event-row" onClick={() => go({ view: "event_detail", id: e.id })}>
              <div className={`cover-${e.cover}`} style={{ width: 48, height: 48, borderRadius: 10 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 500 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 3, display: "flex", gap: 10, alignItems: "center" }}>
                  <span>{e.location}</span>
                  <span>·</span>
                  <span>{e.participants.length} people</span>
                </div>
              </div>
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 500 }}>{fmtDate(e.date, { short: true, weekday: true })}</div>
                <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{daysUntilLabel(e.date) || ""}</div>
              </div>
              <StatusPill status={e.status} />
              <div style={{ textAlign: "right" }}>
                <div className="money tabnums" style={{ fontSize: 15 }}>{fmtMoney(totals.paid)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>of {fmtMoney(totals.rate)} · {pct}%</div>
              </div>
              <I.chev style={{ color: "var(--ink-4)" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════ Event detail (desktop) ═══════════
function DSEventDetail({ id, go }) {
  const e = getEvent(id);
  const [tab, setTab] = React.useState("overview");
  if (!e) return null;

  const totals = e.participants.reduce((a,p)=>{ a.rate+=p.rate; a.paid+=p.paid; return a; }, { rate:0, paid:0 });
  const remaining = totals.rate - totals.paid;
  const pct = totals.rate ? Math.round(totals.paid/totals.rate*100) : 100;
  const byRole = {};
  e.participants.forEach(p => { (byRole[p.role] = byRole[p.role] || []).push(p); });
  const completedTasks = e.todos.filter(t=>t.done).length;

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="ds-event-hero">
        <div className={`ds-img cover-${e.cover}`} />
        <div className="ds-overlay">
          <div>
            <div className="row gap-2" style={{ marginBottom: 6 }}>
              <StatusPill status={e.status} />
              <span className="pill" style={{ background: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(8px)" }}>{daysUntilLabel(e.date) || fmtDate(e.date)}</span>
            </div>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 500 }}>{e.subtitle}</div>
            <h1>{e.name}</h1>
          </div>
          <div className="ds-actions">
            <button className="btn"><I.share /> Share</button>
            <button className="btn"><I.chat /> Team chat</button>
            <button className="btn primary" onClick={() => window.__toast("Reminders sent")}>Send reminders</button>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        {[["overview","Overview"],["roster",`Roster (${e.participants.length})`],["money","Money"],["tasks",`Tasks (${e.todos.length-completedTasks})`],["board","Mood board"],["chat",`Chat (${e.chat.length})`]].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="ds-event-grid fade-in">
          <div>
            <div className="ds-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.6, color: "var(--ink-2)" }}>{e.description}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
                {e.tags.map(t => <span key={t} className="pill">{t}</span>)}
              </div>
            </div>

            <div className="ds-card">
              <div className="ds-card-head"><h3>Recent activity</h3></div>
              <div style={{ padding: "20px 24px" }}>
                <div className="timeline">
                  {e.activity.length === 0 && <div style={{ color: "var(--ink-4)", fontSize: 13 }}>No activity yet.</div>}
                  {e.activity.map(a => (
                    <div key={a.id} className={`item ${a.tone}`}>
                      <div className="when">{a.when}</div>
                      <div className="what">{a.what}</div>
                      {a.who && <div className="who">{a.who}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="ds-card" style={{ padding: 22, marginBottom: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500, marginBottom: 6 }}>Budget</div>
              <div className="money" style={{ fontSize: 28 }}>{fmtMoney(totals.paid)} <small style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>of {fmtMoney(totals.rate)}</small></div>
              <div className={`progress ${pct === 100 ? "sage" : "terracotta"}`} style={{ marginTop: 14 }}><i style={{ width: pct + "%" }} /></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
                <span className="muted">{pct}% collected</span>
                <span style={{ color: remaining > 0 ? "var(--terracotta)" : "var(--sage)", fontWeight: 500 }}>{fmtMoney(remaining)} outstanding</span>
              </div>
            </div>

            <div className="ds-card" style={{ marginBottom: 16 }}>
              <div className="ds-card-head"><h3>Details</h3></div>
              <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="label-line"><I.calendar style={{ width:16, height:16 }} /><span style={{ color: "var(--ink-2)" }}>{fmtDateFull(e.date)}</span></div>
                <div className="label-line"><I.clock /><span style={{ color: "var(--ink-2)" }}>{e.time}</span></div>
                <div className="label-line"><I.pin /><span style={{ color: "var(--ink-2)" }}>{e.location}</span></div>
                <div className="label-line"><I.users /><span style={{ color: "var(--ink-2)" }}>{e.participants.length} of {e.capacity} confirmed</span></div>
              </div>
            </div>

            <div className="ds-card">
              <div className="ds-card-head">
                <h3>Roster</h3>
                <button className="more" style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 12, fontWeight: 500, cursor: "pointer" }} onClick={() => setTab("roster")}>View all ›</button>
              </div>
              <div style={{ padding: "10px 0" }}>
                {e.participants.slice(0,5).map(part => {
                  const p = getPerson(part.personId);
                  return (
                    <button key={p.id} className="card-row" style={{ padding: "10px 24px" }} onClick={() => go({ view: "person_detail", id: p.id })}>
                      <Avatar person={p} size="sm" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{ROLE_META[part.role].label}</div>
                      </div>
                      <StatusPill status={part.status === "comp" ? "comp" : part.status} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "roster" && (
        <div className="fade-in">
          {ROLE_ORDER.filter(r => byRole[r]).map(role => (
            <div key={role} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
                <h2 style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 17, margin: 0 }}>{ROLE_META[role].plural}</h2>
                <span className="muted" style={{ fontSize: 12 }}>{byRole[role].length}</span>
              </div>
              <div className="ds-card">
                <div className="ds-table-head person-row">
                  <span></span><span>Name</span><span>Rate</span><span>Payment</span><span>Contract</span><span></span>
                </div>
                {byRole[role].map(part => {
                  const p = getPerson(part.personId);
                  return (
                    <button key={p.id} className="ds-row person-row" onClick={() => go({ view: "person_detail", id: p.id })}>
                      <Avatar person={p} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{p.location}</div>
                      </div>
                      <div className="tabnums" style={{ fontSize: 13 }}>{part.rate > 0 ? fmtMoney(part.rate) : <span className="muted">Comp</span>}</div>
                      <div>{part.rate > 0 ? <StatusPill status={part.status} /> : <StatusPill status="comp" />}</div>
                      <div><StatusPill status={part.contract === "signed" ? "signed" : part.contract === "sent" ? "sent" : "unsent"} /></div>
                      <I.chev style={{ color: "var(--ink-4)" }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button className="btn"><I.plus /> Add participant</button>
        </div>
      )}

      {tab === "money" && (
        <div className="fade-in">
          <div className="ds-dash" style={{ marginBottom: 20 }}>
            <div className="stat">
              <div className="label">Budget</div>
              <div className="val tabnums">{fmtMoney(totals.rate)}</div>
            </div>
            <div className="stat">
              <div className="label">Collected</div>
              <div className="val tabnums" style={{ color: "var(--sage)" }}>{fmtMoney(totals.paid)}</div>
              <div className="delta">{pct}% complete</div>
            </div>
            <div className="stat">
              <div className="label">Outstanding</div>
              <div className="val tabnums" style={{ color: remaining > 0 ? "var(--terracotta)" : "var(--ink)" }}>{fmtMoney(remaining)}</div>
            </div>
            <div className="stat">
              <div className="label">Participants paid</div>
              <div className="val tabnums">{e.participants.filter(p => p.status === "paid" || p.status === "comp").length} <small>of {e.participants.length}</small></div>
            </div>
          </div>

          <div className="ds-card">
            <div className="ds-table-head money-row">
              <span></span><span>Name</span><span>Rate</span><span>Paid</span><span>Status</span>
            </div>
            {e.participants.filter(p => p.rate > 0).map(part => {
              const p = getPerson(part.personId);
              return (
                <div key={p.id} className="ds-row money-row" style={{ cursor: "default" }}>
                  <Avatar person={p} size="sm" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{ROLE_META[part.role].label}{part.dueDate && ` · due ${fmtDate(part.dueDate, { short: true })}`}</div>
                  </div>
                  <div className="money tabnums" style={{ fontSize: 14 }}>{fmtMoney(part.rate)}</div>
                  <div className="money tabnums" style={{ fontSize: 14, color: part.paid === part.rate ? "var(--sage)" : "var(--ink)" }}>{fmtMoney(part.paid)}</div>
                  <StatusPill status={part.status} />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button className="btn primary" onClick={() => window.__toast("Reminders sent")}>Send reminders</button>
            <button className="btn"><I.upload /> Export CSV</button>
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="fade-in">
          <div className="ds-card">
            {e.todos.map(t => <DSTask key={t.id} task={t} />)}
          </div>
          <button className="btn" style={{ marginTop: 16 }}><I.plus /> Add task</button>
        </div>
      )}

      {tab === "board" && (
        <div className="fade-in">
          <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 17, marginBottom: 14 }}>Color story</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 32, maxWidth: 720 }}>
            {e.moodboard.map((c,i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 12, background: c, border: "1px solid var(--hair)" }} />
            ))}
          </div>
          <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 17, marginBottom: 14 }}>Inspiration</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[0,1,2,3,4,5,6,7].map(i => (
              <div key={i} className={`cover-${e.cover}`} style={{ aspectRatio: i%3===0 ? "3/4" : "1", borderRadius: 12, opacity: 0.55 + (i%4)*0.12 }} />
            ))}
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="fade-in" style={{ maxWidth: 720 }}>
          <div className="ds-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {e.chat.length === 0 && <div style={{ color: "var(--ink-4)", textAlign: "center", padding: 30 }}>No messages yet.</div>}
              {e.chat.map(m => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.you ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "74%" }}>
                    {!m.you && <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 3, marginLeft: 12 }}>{m.from} · {m.when}</div>}
                    <div style={{
                      padding: "11px 16px",
                      borderRadius: m.you ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: m.you ? "var(--ink)" : "var(--hair-2)",
                      color: m.you ? "white" : "var(--ink)",
                      fontSize: 14, lineHeight: 1.45
                    }}>{m.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <input className="input" placeholder="Message the team…" />
              <button className="btn primary" onClick={() => window.__toast("Sent")}><I.send /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DSTask({ task }) {
  const [done, setDone] = React.useState(task.done);
  return (
    <button className="ds-row" onClick={() => setDone(!done)} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto", padding: "14px 24px" }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%",
        border: done ? "1.5px solid var(--sage)" : "1.5px solid var(--ink-4)",
        background: done ? "var(--sage)" : "transparent",
        color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center"
      }}>{done && <I.check />}</span>
      <span style={{ fontSize: 14, color: done ? "var(--ink-4)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>{task.title}</span>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{daysUntilLabel(task.due) || fmtDate(task.due, { short: true })}</span>
    </button>
  );
}

// ═══════════ People (desktop) ═══════════
function DSPeople({ go }) {
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");

  let list = PEOPLE;
  if (filter !== "all") list = list.filter(p => p.role === filter);
  if (query) list = list.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.location.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fade-in">
      <div className="ds-pagehead">
        <div className="left">
          <div className="eyebrow">Roster</div>
          <h1>The <em>people</em></h1>
          <div className="sub">{PEOPLE.length} contacts · {Object.keys(ROLE_META).length} roles</div>
        </div>
        <button className="btn primary"><I.plus /> Add person</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div className="ds-search" style={{ width: 320 }}>
          <I.search />
          <input placeholder="Search by name or city…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 18, padding: 0, borderBottom: "1px solid var(--hair)" }}>
        <button className={`tab ${filter==="all"?"active":""}`} onClick={() => setFilter("all")}>All ({PEOPLE.length})</button>
        {ROLE_ORDER.map(r => {
          const c = PEOPLE.filter(p => p.role === r).length;
          return <button key={r} className={`tab ${filter===r?"active":""}`} onClick={() => setFilter(r)}>{ROLE_META[r].plural} ({c})</button>;
        })}
      </div>

      <div className="ds-card">
        <div className="ds-table-head person-row">
          <span></span><span>Name</span><span>Role</span><span>Location</span><span>Events</span><span></span>
        </div>
        {list.map(p => {
          const events = eventsForPerson(p.id);
          return (
            <button key={p.id} className="ds-row person-row" onClick={() => go({ view: "person_detail", id: p.id })}>
              <Avatar person={p} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{p.email}</div>
              </div>
              <RolePill role={p.role} />
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{p.location}</span>
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{events.length}</span>
              <I.chev style={{ color: "var(--ink-4)" }} />
            </button>
          );
        })}
        {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>No matches.</div>}
      </div>
    </div>
  );
}

// ═══════════ Person detail (desktop) ═══════════
function DSPersonDetail({ id, go }) {
  const p = getPerson(id);
  if (!p) return null;
  const events = eventsForPerson(p.id);
  let totalRate = 0, totalPaid = 0;
  events.forEach(e => {
    const part = e.participants.find(x => x.personId === p.id);
    if (part) { totalRate += part.rate; totalPaid += part.paid; }
  });

  return (
    <div className="fade-in">
      <div className="ds-person-hero">
        <span className="avatar xxl" style={{ background: p.tint, color: p.ink }}>{p.initials}</span>
        <div>
          <div style={{ marginBottom: 8 }}><RolePill role={p.role} /></div>
          <h1>{p.name}</h1>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", fontSize: 15, marginTop: 6, maxWidth: 540 }}>{p.bio}</div>
          <div style={{ display: "flex", gap: 18, marginTop: 14, color: "var(--ink-3)", fontSize: 13 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.mail /> {p.email}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.phone /> {p.phone}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.ig /> {p.instagram}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.pin /> {p.location}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn primary"><I.plus /> Book</button>
          <button className="btn"><I.mail /> Message</button>
        </div>
      </div>

      <div className="ds-dash" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
        <div className="stat">
          <div className="label">Earned</div>
          <div className="val tabnums">{fmtMoney(totalPaid)}</div>
          <div className="delta">all-time</div>
        </div>
        <div className="stat">
          <div className="label">Outstanding</div>
          <div className="val tabnums" style={{ color: totalRate > totalPaid ? "var(--terracotta)" : "var(--ink)" }}>{fmtMoney(totalRate - totalPaid)}</div>
        </div>
        <div className="stat">
          <div className="label">Events</div>
          <div className="val tabnums">{events.length}</div>
          <div className="delta">since {p.joined}</div>
        </div>
      </div>

      <div className="ds-card">
        <div className="ds-card-head"><h3>Event history</h3></div>
        <div className="ds-table-head" style={{ display: "grid", gridTemplateColumns: "56px 1fr 110px 120px 120px 24px" }}>
          <span></span><span>Event</span><span>Date</span><span>Rate / Paid</span><span>Contract</span><span></span>
        </div>
        {events.map(e => {
          const part = e.participants.find(x => x.personId === p.id);
          return (
            <button key={e.id} className="ds-row" style={{ display: "grid", gridTemplateColumns: "56px 1fr 110px 120px 120px 24px", padding: "14px 20px" }} onClick={() => go({ view: "event_detail", id: e.id })}>
              <div className={`cover-${e.cover}`} style={{ width: 48, height: 48, borderRadius: 10 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{e.subtitle}</div>
              </div>
              <span style={{ fontSize: 13 }}>{fmtDate(e.date, { short: true })}</span>
              <span style={{ fontSize: 13 }} className="tabnums">{part.rate > 0 ? `${fmtMoney(part.paid)} / ${fmtMoney(part.rate)}` : "Comp"}</span>
              <StatusPill status={part.contract === "signed" ? "signed" : part.contract === "sent" ? "sent" : "unsent"} />
              <I.chev style={{ color: "var(--ink-4)" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════ Calendar (desktop full grid) ═══════════
function DSCalendar({ go }) {
  const [cursor, setCursor] = React.useState(new Date(2026, 4, 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleString("en-US", { month: "long" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const todayIso = today.toISOString().slice(0,10);

  const eventsByDate = {};
  EVENTS.forEach(e => { (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e); });

  const cells = [];
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ d: prevDays - i, muted: true, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ d, muted: false, iso });
  }
  while (cells.length % 7) cells.push({ d: cells.length - daysInMonth - firstDay + 1, muted: true, iso: null });
  while (cells.length < 42) cells.push({ d: 0, muted: true, iso: null });

  const colorFor = (status) => status === "confirmed" ? "" : status === "planning" ? "gold" : status === "wrapped" ? "slate" : "sage";

  return (
    <div className="fade-in">
      <div className="ds-pagehead">
        <div className="left">
          <div className="eyebrow">Calendar</div>
          <h1>{monthName} <em>{year}</em></h1>
          <div className="sub">{EVENTS.filter(e => e.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length} events this month</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="icon-btn bordered" onClick={() => setCursor(new Date(year, month-1, 1))}><I.back /></button>
          <button className="btn sm" onClick={() => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); }}>Today</button>
          <button className="icon-btn bordered" onClick={() => setCursor(new Date(year, month+1, 1))}><I.chev /></button>
        </div>
      </div>

      <div className="ds-cal">
        {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => <div key={d} className="ch">{d}</div>)}
        {cells.map((c, i) => {
          const evs = c.iso ? (eventsByDate[c.iso] || []) : [];
          const cls = ["cd"];
          if (c.muted) cls.push("muted");
          if (c.iso === todayIso) cls.push("today");
          return (
            <div key={i} className={cls.join(" ")}>
              <span className="num">{c.d || ""}</span>
              {evs.map(e => (
                <button key={e.id} className={`ev ${colorFor(e.status)}`} onClick={() => go({ view: "event_detail", id: e.id })}>
                  {e.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════ Messages (desktop split) ═══════════
function DSMessages({ go }) {
  const threads = EVENTS.filter(e => e.chat.length > 0);
  const [active, setActive] = React.useState(threads[0]?.id || null);
  const e = active ? getEvent(active) : null;

  return (
    <div className="fade-in">
      <div className="ds-pagehead">
        <div className="left">
          <div className="eyebrow">Conversations</div>
          <h1>All <em>messages</em></h1>
          <div className="sub">Per-event group chats with your team</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, height: "calc(100vh - 280px)", minHeight: 500 }}>
        <div className="ds-card" style={{ overflowY: "auto" }}>
          {threads.map(t => {
            const last = t.chat[t.chat.length - 1];
            return (
              <button key={t.id} className="ds-row" style={{ display: "flex", gap: 12, padding: 14, background: active === t.id ? "var(--bg)" : "transparent" }} onClick={() => setActive(t.id)}>
                <div className={`cover-${t.cover}`} style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--serif)" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{last.when}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <strong style={{ color: "var(--ink-2)", fontWeight: 500 }}>{last.from}:</strong> {last.text}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="ds-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {e ? (
            <React.Fragment>
              <div className="ds-card-head" style={{ padding: "16px 24px" }}>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{e.name}</h3>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{e.participants.length} participants · {fmtDate(e.date)}</div>
                </div>
                <button className="btn sm" onClick={() => go({ view: "event_detail", id: e.id })}>Open event</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
                {e.chat.map(m => (
                  <div key={m.id} style={{ display: "flex", justifyContent: m.you ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "70%" }}>
                      {!m.you && <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 3, marginLeft: 12 }}>{m.from} · {m.when}</div>}
                      <div style={{
                        padding: "11px 16px",
                        borderRadius: m.you ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: m.you ? "var(--ink)" : "var(--hair-2)",
                        color: m.you ? "white" : "var(--ink)",
                        fontSize: 14, lineHeight: 1.45
                      }}>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, borderTop: "1px solid var(--hair-2)", display: "flex", gap: 8 }}>
                <input className="input" placeholder="Message the team…" />
                <button className="btn primary" onClick={() => window.__toast("Sent")}><I.send /> Send</button>
              </div>
            </React.Fragment>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>Select a conversation</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════ Desktop shell ═══════════
function DesktopShell({ route, go }) {
  let body;
  switch (route.view) {
    case "home":          body = <DSDashboard go={go} />; break;
    case "events":        body = <DSEvents go={go} />; break;
    case "event_detail":  body = <DSEventDetail id={route.id} go={go} />; break;
    case "people":        body = <DSPeople go={go} />; break;
    case "person_detail": body = <DSPersonDetail id={route.id} go={go} />; break;
    case "calendar":      body = <DSCalendar go={go} />; break;
    case "messages":      body = <DSMessages go={go} />; break;
    default:              body = <DSDashboard go={go} />;
  }

  return (
    <div className="desktop-shell">
      <DSSidebar route={route} go={go} />
      <div className="ds-main">
        <DSTopbar route={route} go={go} />
        <div className="ds-content" key={route.view + (route.id || "")}>{body}</div>
      </div>
    </div>
  );
}

Object.assign(window, { useIsDesktop, DesktopShell });
