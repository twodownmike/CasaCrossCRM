/* Casa Cross — Messages view (cross-event chat list) */

function MessagesView({ go }) {
  const threads = EVENTS.filter(e => e.chat.length > 0).map(e => ({
    event: e,
    last: e.chat[e.chat.length - 1],
  }));
  const [active, setActive] = React.useState(null);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Conversations</div>
        <h1>All <em>messages</em></h1>
        <div className="sub">Per-event group chats with your team</div>
      </div>

      <div style={{ padding: "0 var(--s-5)", display: "flex", flexDirection: "column", gap: 10 }}>
        {threads.map(t => (
          <button key={t.event.id} className="card elev" onClick={() => setActive(t.event.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, textAlign: "left", border: "1px solid var(--hair)", background: "var(--paper)" }}>
            <div className={`cover-${t.event.cover}`} style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row between" style={{ marginBottom: 3 }}>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 15 }}>{t.event.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{t.last.when}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong style={{ color: "var(--ink-2)", fontWeight: 500 }}>{t.last.from}:</strong> {t.last.text}
              </div>
            </div>
          </button>
        ))}

        {threads.length === 0 && <div className="empty"><h3>No conversations yet</h3><div>Open an event to start chatting.</div></div>}
      </div>

      {/* Reuse the chat sheet pattern */}
      {active && (() => {
        const e = getEvent(active);
        return (
          <Sheet open={true} onClose={() => setActive(null)} title={e.name}>
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
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, paddingBottom: 8 }}>
              <input className="input" placeholder="Message the team…" />
              <button className="btn primary" style={{ padding: "12px 14px" }} onClick={() => window.__toast("Message sent")}><I.send /></button>
            </div>
          </Sheet>
        );
      })()}
    </div>
  );
}

window.MessagesView = MessagesView;
