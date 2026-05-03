/* Casa Cross — shared components: icons, avatars, pills, sheet, toast */

// ═══════════ Icons ═══════════
const I = {
  home:     (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>,
  calendar: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  spark:    (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>,
  people:   (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M15 14c2.5 0 4.5 2 4.5 4.5" /></svg>,
  chat:     (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 5h16v11H8l-4 4z" /></svg>,
  bell:     (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 9a6 6 0 1112 0c0 6 2 7 2 7H4s2-1 2-7z" /><path d="M10 20a2 2 0 004 0" /></svg>,
  search:   (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>,
  plus:     (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>,
  back:     (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 6l-6 6 6 6" /></svg>,
  more:     (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>,
  share:    (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4v12M8 8l4-4 4 4M5 14v5h14v-5" /></svg>,
  pin:      (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>,
  clock:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  users:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/><circle cx="17" cy="9" r="2.3"/><path d="M15 14c2.4 0 4.5 2 4.5 4.5"/></svg>,
  check:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 13l4 4 10-10"/></svg>,
  doc:      (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/></svg>,
  dollar:   (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v18M16 7H10a3 3 0 000 6h4a3 3 0 010 6H7"/></svg>,
  phone:    (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7 12 12 0 00.7 2.8 2 2 0 01-.5 2L8 9.7a16 16 0 006 6l1.2-1.2a2 2 0 012-.5 12 12 0 002.8.7 2 2 0 011.7 2z"/></svg>,
  mail:     (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,
  ig:       (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>,
  send:     (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>,
  filter:   (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18M6 12h12M10 19h4"/></svg>,
  chev:     (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 6l6 6-6 6"/></svg>,
  warn:     (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/></svg>,
  bag:      (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 7h14l-1 13H6z"/><path d="M9 7a3 3 0 016 0"/></svg>,
  upload:   (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>,
};

// ═══════════ Avatar ═══════════
function Avatar({ person, size }) {
  const cls = ["avatar"];
  if (size) cls.push(size);
  return (
    <span className={cls.join(" ")} style={{ background: person.tint, color: person.ink }}>
      {person.initials}
    </span>
  );
}
function AvatarStack({ ids, max = 4 }) {
  const people = ids.map(id => getPerson(id)).filter(Boolean);
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="avatar-stack">
      {shown.map(p => <Avatar key={p.id} person={p} size="sm" />)}
      {extra > 0 && <span className="more">+{extra}</span>}
    </span>
  );
}

// ═══════════ Pills ═══════════
function StatusPill({ status, label }) {
  const map = {
    confirmed: { cls: "confirmed", label: "Confirmed" },
    planning:  { cls: "planning",  label: "Planning" },
    pending:   { cls: "pending",   label: "Pending" },
    wrapped:   { cls: "wrapped",   label: "Wrapped" },
    paid:      { cls: "confirmed", label: "Paid" },
    partial:   { cls: "planning",  label: "Partial" },
    due:       { cls: "warn",      label: "Due" },
    comp:      { cls: "wrapped",   label: "Comp" },
    signed:    { cls: "confirmed", label: "Signed" },
    sent:      { cls: "planning",  label: "Sent" },
    unsent:    { cls: "warn",      label: "Unsent" },
  };
  const m = map[status] || { cls: "pending", label: status };
  return <span className={`pill ${m.cls}`}><span className="dot" />{label || m.label}</span>;
}
function RolePill({ role }) {
  return <span className={`pill role-${role}`}>{ROLE_META[role]?.label || role}</span>;
}

// ═══════════ Header ═══════════
function AppHeader({ title, action }) {
  return (
    <header className="app-header">
      <div className="title">
        <span className="mark" />
        <span>{title || "Casa Cross"}</span>
      </div>
      <div className="actions">
        {action}
        <button className="icon-btn" aria-label="Notifications" onClick={() => window.__toast("3 new notifications")}>
          <I.bell />
        </button>
      </div>
    </header>
  );
}

// ═══════════ Bottom nav ═══════════
function BottomNav({ tab, onTab }) {
  const tabs = [
    { id: "home",     label: "Home",     icon: I.home },
    { id: "events",   label: "Events",   icon: I.spark },
    { id: "calendar", label: "Calendar", icon: I.calendar },
    { id: "people",   label: "People",   icon: I.people },
    { id: "messages", label: "Messages", icon: I.chat },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => {
        const Ico = t.icon;
        const active = tab === t.id;
        return (
          <button key={t.id} className={`tab ${active ? "active" : ""}`} onClick={() => onTab(t.id)}>
            <Ico />
            <span className="label">{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ═══════════ Sheet ═══════════
function Sheet({ open, onClose, title, children, action }) {
  return (
    <React.Fragment>
      <div className={`sheet-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`sheet ${open ? "open" : ""}`}>
        <div className="grab" />
        <div className="head">
          <h3>{title}</h3>
          <div className="row gap-2">
            {action}
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
            </button>
          </div>
        </div>
        <div className="body">{children}</div>
      </div>
    </React.Fragment>
  );
}

// ═══════════ Toast ═══════════
function ToastHost() {
  const [msg, setMsg] = React.useState(null);
  React.useEffect(() => {
    window.__toast = (m) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 1900);
    };
  }, []);
  return <div className={`toast ${msg ? "show" : ""}`}>{msg}</div>;
}

// Event card (used in lists)
function EventCard({ event, onClick }) {
  const dlabel = daysUntilLabel(event.date);
  const totals = event.participants.reduce((acc, p) => {
    acc.rate += p.rate;
    acc.paid += p.paid;
    return acc;
  }, { rate: 0, paid: 0 });
  const pct = totals.rate > 0 ? Math.round((totals.paid / totals.rate) * 100) : 100;
  return (
    <button className="card elev" onClick={onClick} style={{ width: "100%", textAlign: "left", padding: 0, border: "1px solid var(--hair)", display: "block", background: "var(--paper)" }}>
      <div className={`cover-${event.cover}`} style={{ height: 110, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(20,18,14,0.45))" }} />
        <div style={{ position: "absolute", top: 12, left: 14, right: 14, display: "flex", justifyContent: "space-between" }}>
          <StatusPill status={event.status} />
          {dlabel && <span className="pill" style={{ background: "rgba(255,255,255,0.92)", color: "var(--ink)" }}>{dlabel}</span>}
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, color: "white" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.92 }}>{fmtDate(event.date, { weekday: true, short: true })}</div>
          <div style={{ fontFamily: "var(--serif-display)", fontSize: 22, fontWeight: 400, lineHeight: 1.05, letterSpacing: "-0.01em", marginTop: 2 }}>{event.name}</div>
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="row gap-3">
            <span className="label-line"><I.users /><span>{event.participants.length}</span></span>
            <span className="label-line"><I.pin /><span style={{ maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.location}</span></span>
          </div>
          <AvatarStack ids={event.participants.slice(0, 4).map(p => p.personId)} />
        </div>
        <div className="row between" style={{ marginBottom: 6, fontSize: 12 }}>
          <span className="muted">{fmtMoney(totals.paid)} of {fmtMoney(totals.rate)} paid</span>
          <span className="muted tabnums">{pct}%</span>
        </div>
        <div className={`progress ${pct === 100 ? "sage" : "terracotta"}`}><i style={{ width: pct + "%" }} /></div>
      </div>
    </button>
  );
}

Object.assign(window, {
  I, Avatar, AvatarStack, StatusPill, RolePill,
  AppHeader, BottomNav, Sheet, ToastHost, EventCard,
});
