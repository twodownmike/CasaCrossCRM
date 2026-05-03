/* Casa Cross — App entry (responsive) */

function App() {
  const [route, setRoute] = React.useState({ view: "home" });
  const [createOpen, setCreateOpen] = React.useState(false);
  const isDesktop = useIsDesktop();

  const go = (next) => setRoute(next);

  const tabFromView = {
    home: "home", events: "events", event_detail: "events",
    people: "people", person_detail: "people",
    calendar: "calendar", messages: "messages",
  };

  // ═══════════ Desktop render ═══════════
  if (isDesktop) {
    return (
      <React.Fragment>
        <DesktopShell route={route} go={go} />
        <ToastHost />
      </React.Fragment>
    );
  }

  // ═══════════ Mobile render ═══════════
  let body;
  switch (route.view) {
    case "home":          body = <Dashboard go={go} />; break;
    case "events":        body = <EventsView go={go} />; break;
    case "event_detail":  body = <EventDetail id={route.id} go={go} />; break;
    case "people":        body = <PeopleView go={go} />; break;
    case "person_detail": body = <PersonDetail id={route.id} go={go} />; break;
    case "calendar":      body = <CalendarView go={go} />; break;
    case "messages":      body = <MessagesView go={go} />; break;
    default:              body = <Dashboard go={go} />;
  }

  const hideHeader = route.view === "event_detail" || route.view === "person_detail";
  const showFab = !["event_detail","person_detail"].includes(route.view);

  return (
    <div className="phone-frame">
      {!hideHeader && (
        <AppHeader
          title="Casa Cross"
          action={<button className="icon-btn" onClick={() => window.__toast("Search opened")}><I.search /></button>}
        />
      )}
      <div className="scroll" key={route.view + (route.id || "")}>{body}</div>
      {showFab && (
        <button className="fab" aria-label="New" onClick={() => setCreateOpen(true)}><I.plus /></button>
      )}
      <BottomNav tab={tabFromView[route.view]} onTab={(t) => {
        if (t === "home") go({ view: "home" });
        if (t === "events") go({ view: "events" });
        if (t === "calendar") go({ view: "calendar" });
        if (t === "people") go({ view: "people" });
        if (t === "messages") go({ view: "messages" });
      }} />
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Create new">
        <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: I.spark,  label: "New event",       sub: "A new styled shoot" },
            { icon: I.people, label: "Add a person",    sub: "Vendor, photographer, model…" },
            { icon: I.dollar, label: "Log a payment",   sub: "Mark money received" },
            { icon: I.doc,    label: "Send a contract", sub: "Agreement for an upcoming shoot" },
            { icon: I.check,  label: "Add a task",      sub: "Something to remember" },
          ].map((it, i) => {
            const Ico = it.icon;
            return (
              <button key={i} className="card-row" style={{ borderRadius: 12, border: "1px solid var(--hair)" }}
                      onClick={() => { setCreateOpen(false); window.__toast(it.label + " — coming soon"); }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--hair-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)" }}>
                  <Ico />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{it.label}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{it.sub}</div>
                </div>
                <I.chev style={{ color: "var(--ink-4)" }} />
              </button>
            );
          })}
        </div>
      </Sheet>
      <ToastHost />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
