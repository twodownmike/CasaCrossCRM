export default function PersonDetailLoading() {
  return (
    <div>
      <header className="app-header">
        <div className="skel avatar" style={{ width: 36, height: 36 }} />
        <div className="skel line" style={{ width: 80 }} />
        <div className="skel avatar" style={{ width: 36, height: 36 }} />
      </header>
      <div
        style={{
          padding: "var(--s-7) var(--s-5) var(--s-5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          className="skel avatar"
          style={{ width: 88, height: 88 }}
        />
        <div
          className="skel line xl"
          style={{ width: 200, marginTop: 16 }}
        />
        <div
          className="skel line"
          style={{ width: 100, marginTop: 12 }}
        />
      </div>
      <div className="tabs" style={{ paddingBottom: 8 }}>
        {[60, 80, 60, 60].map((w, i) => (
          <div
            key={i}
            className="skel line"
            style={{ width: w, margin: "12px 22px 12px 0" }}
          />
        ))}
      </div>
      <div style={{ padding: "var(--s-5)" }}>
        <div className="card elev" style={{ height: 200 }} />
      </div>
    </div>
  );
}
