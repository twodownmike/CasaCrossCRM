/* Casa Cross — Person detail */

function PersonDetail({ id, go }) {
  const p = getPerson(id);
  const [tab, setTab] = React.useState("about");
  if (!p) return null;

  const events = eventsForPerson(p.id);
  // Money summary across events
  let totalRate = 0, totalPaid = 0;
  events.forEach(e => {
    const part = e.participants.find(x => x.personId === p.id);
    if (part) { totalRate += part.rate; totalPaid += part.paid; }
  });

  return (
    <div className="fade-in">
      <header className="app-header">
        <button className="icon-btn" onClick={() => go({ view: "people" })}><I.back /></button>
        <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15 }}>Contact</div>
        <button className="icon-btn"><I.more /></button>
      </header>

      {/* Hero */}
      <div style={{ padding: "var(--s-7) var(--s-5) var(--s-5)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Avatar person={p} size="xl" />
        <h1 style={{ fontFamily: "var(--serif-display)", fontWeight: 400, fontSize: 28, letterSpacing: "-0.01em", margin: "16px 0 6px" }}>{p.name}</h1>
        <div style={{ marginBottom: 10 }}><RolePill role={p.role} /></div>
        {p.bio && <div className="muted" style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 320, fontFamily: "var(--serif)", fontStyle: "italic" }}>{p.bio}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn sm" onClick={() => window.__toast("Calling " + p.name)}><I.phone /> Call</button>
          <button className="btn sm" onClick={() => window.__toast("Email opened")}><I.mail /> Email</button>
          <button className="btn sm primary"><I.plus /> Book</button>
        </div>
      </div>

      <div className="tabs">
        {[["about","About"],["events",`Events (${events.length})`],["money","Money"],["notes","Notes"]].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "about" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="card elev">
            <div className="card-row" style={{ cursor: "default" }}>
              <I.mail style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>{p.email}</div>
            </div>
            <div className="card-row" style={{ cursor: "default" }}>
              <I.phone style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>{p.phone}</div>
            </div>
            <div className="card-row" style={{ cursor: "default" }}>
              <I.ig style={{ color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>{p.instagram}</div>
            </div>
            <div className="card-row" style={{ cursor: "default" }}>
              <I.pin style={{ width: 16, height: 16, color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>{p.location}</div>
            </div>
            <div className="card-row" style={{ cursor: "default" }}>
              <I.clock style={{ width: 16, height: 16, color: "var(--ink-4)" }} />
              <div style={{ flex: 1, fontSize: 14 }}>Joined {p.joined}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "events" && (
        <div className="fade-in" style={{ padding: "var(--s-5)", display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map(e => {
            const part = e.participants.find(x => x.personId === p.id);
            return (
              <button key={e.id} className="card elev" onClick={() => go({ view: "event_detail", id: e.id })}
                      style={{ width: "100%", textAlign: "left", border: "1px solid var(--hair)", padding: 0, background: "var(--paper)", display: "block" }}>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div className={`cover-${e.cover}`} style={{ width: 70, flexShrink: 0 }} />
                  <div style={{ flex: 1, padding: 14 }}>
                    <div className="row between">
                      <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500 }}>{fmtDate(e.date, { weekday: true, short: true })}</div>
                      <StatusPill status={e.status} />
                    </div>
                    <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 16, marginTop: 4 }}>{e.name}</div>
                    {part && (
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {part.rate > 0 ? <span className="tabnums">{fmtMoney(part.paid)} / {fmtMoney(part.rate)}</span> : <span>Comp</span>}
                        <span>·</span>
                        <StatusPill status={part.contract === "signed" ? "signed" : part.contract === "sent" ? "sent" : "unsent"} />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {events.length === 0 && <div className="empty"><h3>No events yet</h3><div>Book {p.name.split(" ")[0]} for an event.</div></div>}
        </div>
      )}

      {tab === "money" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="stat-grid" style={{ padding: 0, marginBottom: 16 }}>
            <div className="stat">
              <div className="label">Earned</div>
              <div className="val tabnums">{fmtMoney(totalPaid)}</div>
              <div className="delta">all-time</div>
            </div>
            <div className="stat">
              <div className="label">Owed</div>
              <div className="val tabnums" style={{ color: totalRate > totalPaid ? "var(--terracotta)" : "var(--ink)" }}>{fmtMoney(totalRate - totalPaid)}</div>
              <div className="delta">across {events.length} {events.length===1?"event":"events"}</div>
            </div>
          </div>

          <div className="card elev">
            {events.map(e => {
              const part = e.participants.find(x => x.personId === p.id);
              if (!part || part.rate === 0) return null;
              const left = part.rate - part.paid;
              return (
                <div key={e.id} className="card-row" style={{ cursor: "default" }}>
                  <div className={`cover-${e.cover}`} style={{ width: 28, height: 28, borderRadius: "var(--r-2)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{fmtDate(e.date, { short: true })} · {fmtMoney(part.paid)}/{fmtMoney(part.rate)}</div>
                  </div>
                  <StatusPill status={part.status} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="card elev" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500, marginBottom: 6 }}>Apr 22, 2026</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
              {p.role === "photographer" && "Loves natural light. Prefers shoots starting before 9 AM. Brings own assistant."}
              {p.role === "model" && "Confident on camera. Bring multiple looks; can switch quickly. Dietary: vegetarian."}
              {p.role === "venue" && "Two-hour minimum setup. Generous parking. Power outlets on every wall."}
              {p.role === "vendor" && "Reliable, communicative, on-time. Discount on repeat bookings."}
              {p.role === "hmua" && "Brings full kit. 30 min per face. Touch-ups included for 8 hours."}
              {p.role === "stylist" && "Pulls 3-5 looks per model. Confirm sizes 2 weeks out."}
              {p.role === "sponsor" && "Looking for editorial usage rights and tagged social posts. 3-week turnaround for credits."}
            </div>
          </div>
          <button className="btn block" style={{ marginTop: 16 }}><I.plus /> Add note</button>
        </div>
      )}
    </div>
  );
}

window.PersonDetail = PersonDetail;
