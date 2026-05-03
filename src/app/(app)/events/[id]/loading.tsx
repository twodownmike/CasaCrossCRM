export default function EventDetailLoading() {
  return (
    <div>
      <div className="skel hero" />
      <div
        style={{
          padding: "var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div className="skel line" style={{ width: "70%" }} />
        <div className="skel line" style={{ width: "55%" }} />
        <div className="skel line" style={{ width: "60%" }} />
      </div>
      <div
        className="tabs"
        style={{ paddingBottom: 8 }}
      >
        {[80, 70, 80, 90, 60, 60].map((w, i) => (
          <div
            key={i}
            className="skel line"
            style={{ width: w, margin: "12px 22px 12px 0" }}
          />
        ))}
      </div>
      <div style={{ padding: "var(--s-5)" }}>
        <div
          className="skel line"
          style={{ width: "100%", height: 80, marginBottom: 20 }}
        />
        <div
          className="card elev"
          style={{ padding: "var(--s-5)", marginBottom: 20 }}
        >
          <div className="skel line" style={{ width: "30%" }} />
          <div className="skel line xl" style={{ width: "60%", marginTop: 10 }} />
          <div className="skel line" style={{ width: "100%", marginTop: 14, height: 6 }} />
        </div>
      </div>
    </div>
  );
}
