/* Casa Cross — Event detail */

function EventDetail({ id, go }) {
  const e = getEvent(id);
  const [tab, setTab] = React.useState("overview");
  const [chatOpen, setChatOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  if (!e) return null;

  const totals = e.participants.reduce((acc,p)=>{ acc.rate+=p.rate; acc.paid+=p.paid; return acc; }, { rate:0, paid:0 });
  const remaining = totals.rate - totals.paid;
  const pct = totals.rate > 0 ? Math.round((totals.paid/totals.rate)*100) : 100;

  // Group participants by role
  const byRole = {};
  e.participants.forEach(p => {
    (byRole[p.role] = byRole[p.role] || []).push(p);
  });

  const completed = e.todos.filter(t=>t.done).length;

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="hero">
        <div className={`hero-img cover-${e.cover}`} />
        <button className="back" onClick={() => go({ view: "events" })}><I.back /></button>
        <div className="right-actions">
          <button className="icon-btn"><I.share /></button>
          <button className="icon-btn"><I.more /></button>
        </div>
        <div className="overlay">
          <div className="row gap-2" style={{ marginBottom: 6 }}>
            <StatusPill status={e.status} />
            <span className="pill" style={{ background: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(8px)" }}>
              {daysUntilLabel(e.date) || fmtDate(e.date)}
            </span>
          </div>
          <div className="eyebrow">{e.subtitle}</div>
          <h1>{e.name}</h1>
        </div>
      </div>

      {/* Quick info */}
      <div style={{ padding: "var(--s-5)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="label-line"><I.calendar style={{ width:16, height:16 }} /><span>{fmtDateFull(e.date)} · {e.time}</span></div>
        <div className="label-line"><I.pin /><span>{e.location}</span></div>
        <div className="label-line"><I.users /><span>{e.participants.length} participants · capacity {e.capacity}</span></div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[["overview","Overview"],["roster","Roster"],["money","Money"],["tasks",`Tasks (${e.todos.length-completed})`],["board","Mood"]].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <p style={{ margin: "0 0 var(--s-6)", fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.55, color: "var(--ink-2)" }}>
            {e.description}
          </p>

          {/* Money summary card */}
          <div className="card elev" style={{ padding: "var(--s-5)", marginBottom: 20 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div>
                <div className="label" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500 }}>Collected</div>
                <div className="money" style={{ fontSize: 28, marginTop: 2 }}>{fmtMoney(totals.paid)} <small style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink-3)" }}>of {fmtMoney(totals.rate)}</small></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500 }}>Outstanding</div>
                <div className="money" style={{ fontSize: 22, marginTop: 2, color: remaining > 0 ? "var(--terracotta)" : "var(--sage)" }}>{fmtMoney(remaining)}</div>
              </div>
            </div>
            <div className={`progress ${pct === 100 ? "sage" : "terracotta"}`}><i style={{ width: pct + "%" }} /></div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {e.tags.map(t => <span key={t} className="pill">{t}</span>)}
          </div>

          {/* Activity */}
          {e.activity.length > 0 && (
            <div>
              <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15, marginBottom: 14 }}>Recent activity</div>
              <div className="timeline">
                {e.activity.map(a => (
                  <div key={a.id} className={`item ${a.tone}`}>
                    <div className="when">{a.when}</div>
                    <div className="what">{a.what}</div>
                    {a.who && <div className="who">{a.who}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "roster" && (
        <div className="fade-in">
          {ROLE_ORDER.filter(r => byRole[r]).map(role => (
            <div key={role}>
              <div className="section-label" style={{ marginTop: 24 }}>
                <h2>{ROLE_META[role].plural}</h2>
                <span className="muted" style={{ fontSize: 12 }}>{byRole[role].length}</span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {byRole[role].map(part => {
                    const person = getPerson(part.personId);
                    return (
                      <button key={person.id} className="card-row" onClick={() => go({ view: "person_detail", id: person.id })}>
                        <Avatar person={person} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{person.name}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            {part.rate > 0 ? <span className="tabnums">{fmtMoney(part.rate)}</span> : <span>Comp</span>}
                            <span>·</span>
                            <StatusPill status={part.contract === "signed" ? "signed" : part.contract === "sent" ? "sent" : "unsent"} />
                          </div>
                        </div>
                        {part.rate > 0 && <StatusPill status={part.status} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <div style={{ padding: "var(--s-6) var(--s-5)" }}>
            <button className="btn block" onClick={() => setAddOpen(true)}>
              <I.plus /> Add participant
            </button>
          </div>
        </div>
      )}

      {tab === "money" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="card elev" style={{ padding: "var(--s-5)", marginBottom: 16 }}>
            <div className="label" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-4)", fontWeight: 500, marginBottom: 4 }}>Total budget</div>
            <div className="money" style={{ fontSize: 32 }}>{fmtMoney(totals.rate)}</div>
            <div className="row between" style={{ marginTop: 14, marginBottom: 8 }}>
              <span className="muted" style={{ fontSize: 13 }}>{fmtMoney(totals.paid)} collected</span>
              <span className="muted tabnums" style={{ fontSize: 13 }}>{pct}%</span>
            </div>
            <div className={`progress ${pct === 100 ? "sage" : "terracotta"}`}><i style={{ width: pct + "%" }} /></div>
          </div>

          <div className="card elev">
            {e.participants.filter(p => p.rate > 0).map(part => {
              const person = getPerson(part.personId);
              const left = part.rate - part.paid;
              return (
                <div key={person.id} className="card-row" style={{ cursor: "default" }}>
                  <Avatar person={person} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{person.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                      {fmtMoney(part.paid)} of {fmtMoney(part.rate)}
                      {part.dueDate && left > 0 && ` · due ${fmtDate(part.dueDate, { short: true })}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="money tabnums" style={{ fontSize: 16, color: left > 0 ? "var(--terracotta)" : "var(--sage)" }}>
                      {left > 0 ? fmtMoney(left) : "✓"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn block primary" style={{ marginTop: 16 }} onClick={() => window.__toast("Reminders sent to 3 people")}>
            Send payment reminders
          </button>
        </div>
      )}

      {tab === "tasks" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          <div className="card elev">
            {e.todos.map(t => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
          <button className="btn block" style={{ marginTop: 16 }}>
            <I.plus /> Add task
          </button>
        </div>
      )}

      {tab === "board" && (
        <div className="fade-in" style={{ padding: "var(--s-5)" }}>
          {/* Color story */}
          <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15, marginBottom: 12 }}>Color story</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 24 }}>
            {e.moodboard.map((c,i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: "var(--r-2)", background: c, border: "1px solid var(--hair)" }} />
            ))}
          </div>
          {/* Inspiration grid */}
          <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15, marginBottom: 12 }}>Inspiration</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className={`cover-${e.cover}`} style={{ aspectRatio: i===0||i===3 ? "3/4" : "1", borderRadius: "var(--r-3)", opacity: 0.6 + (i%3)*0.13 }} />
            ))}
          </div>
        </div>
      )}

      {/* Floating chat button */}
      {e.chat.length > 0 && (
        <button onClick={() => setChatOpen(true)}
          style={{ position: "absolute", right: 18, bottom: "calc(var(--nav-h) + var(--safe-bottom) + 16px)",
                   width: 56, height: 56, borderRadius: "50%", background: "var(--terracotta)", color: "white",
                   border: "none", boxShadow: "var(--shadow-lg)", display: "inline-flex", alignItems: "center", justifyContent: "center", zIndex: 40 }}>
          <I.chat />
        </button>
      )}

      {/* Chat sheet */}
      <Sheet open={chatOpen} onClose={() => setChatOpen(false)} title={`${e.name} chat`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
          {e.chat.map(m => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.you ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%" }}>
                {!m.you && <div style={{ fontSize: 11, color: "var(--ink-4)", marginBottom: 3, marginLeft: 12 }}>{m.from} · {m.when}</div>}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: m.you ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.you ? "var(--ink)" : "var(--hair-2)",
                  color: m.you ? "white" : "var(--ink)",
                  fontSize: 14, lineHeight: 1.4
                }}>{m.text}</div>
                {m.you && <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3, textAlign: "right", marginRight: 4 }}>{m.when}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, paddingBottom: 8 }}>
          <input className="input" placeholder="Message the team…" />
          <button className="btn primary" style={{ padding: "12px 14px" }} onClick={() => window.__toast("Message sent")}><I.send /></button>
        </div>
      </Sheet>

      {/* Add participant sheet (placeholder) */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add participant">
        <div style={{ paddingTop: 8 }}>
          <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Pick someone from your roster, or invite by email.</div>
          {PEOPLE.filter(p => !e.participants.some(part => part.personId === p.id)).slice(0, 6).map(p => (
            <button key={p.id} className="card-row" style={{ borderBottom: "1px solid var(--hair-2)" }} onClick={() => { setAddOpen(false); window.__toast(`${p.name} added`); }}>
              <Avatar person={p} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{ROLE_META[p.role].label} · {p.location}</div>
              </div>
              <I.plus style={{ color: "var(--ink-3)" }} />
            </button>
          ))}
          <button className="btn block" style={{ marginTop: 16 }}>Invite by email</button>
        </div>
      </Sheet>
    </div>
  );
}

function TaskRow({ task }) {
  const [done, setDone] = React.useState(task.done);
  return (
    <button className="card-row" onClick={() => setDone(!done)}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        border: done ? "1.5px solid var(--sage)" : "1.5px solid var(--ink-4)",
        background: done ? "var(--sage)" : "transparent",
        color: "white",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 150ms"
      }}>{done && <I.check />}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: done ? "var(--ink-4)" : "var(--ink)", textDecoration: done ? "line-through" : "none" }}>
          {task.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
          {daysUntilLabel(task.due) || fmtDate(task.due, { short: true })}
        </div>
      </div>
    </button>
  );
}

window.EventDetail = EventDetail;
