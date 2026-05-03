/* Casa Cross — People roster */

function PeopleView({ go }) {
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");

  let list = PEOPLE;
  if (filter !== "all") list = list.filter(p => p.role === filter);
  if (query) list = list.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.location.toLowerCase().includes(query.toLowerCase()));

  const grouped = {};
  list.forEach(p => { (grouped[p.role] = grouped[p.role] || []).push(p); });

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="eyebrow">Roster</div>
        <h1>The <em>people</em></h1>
        <div className="sub">{PEOPLE.length} contacts across {Object.keys(ROLE_META).length} roles</div>
      </div>

      <div className="search">
        <I.search />
        <input placeholder="Search by name or city…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="tabs" style={{ marginTop: 16 }}>
        <button className={`tab ${filter==="all"?"active":""}`} onClick={() => setFilter("all")}>All</button>
        {ROLE_ORDER.map(r => (
          <button key={r} className={`tab ${filter===r?"active":""}`} onClick={() => setFilter(r)}>
            {ROLE_META[r].plural}
          </button>
        ))}
      </div>

      {filter === "all" ? (
        <React.Fragment>
          {ROLE_ORDER.filter(r => grouped[r]).map(r => (
            <React.Fragment key={r}>
              <div className="section-label" style={{ marginTop: 24 }}>
                <h2>{ROLE_META[r].plural}</h2>
                <span className="muted" style={{ fontSize: 12 }}>{grouped[r].length}</span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {grouped[r].map(p => <PersonRow key={p.id} person={p} onClick={() => go({ view: "person_detail", id: p.id })} />)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </React.Fragment>
      ) : (
        <div style={{ padding: "16px var(--s-5)" }}>
          <div className="card elev">
            {list.map(p => <PersonRow key={p.id} person={p} onClick={() => go({ view: "person_detail", id: p.id })} />)}
          </div>
        </div>
      )}

      {list.length === 0 && <div className="empty"><h3>No matches</h3><div>Try a different search.</div></div>}

      <div style={{ height: 24 }} />
    </div>
  );
}

function PersonRow({ person, onClick }) {
  const events = eventsForPerson(person.id);
  return (
    <button className="card-row" onClick={onClick}>
      <Avatar person={person} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{person.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
          {person.location} · {events.length} {events.length === 1 ? "event" : "events"}
        </div>
      </div>
      <I.chev style={{ color: "var(--ink-4)" }} />
    </button>
  );
}

window.PeopleView = PeopleView;
