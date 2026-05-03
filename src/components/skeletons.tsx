export function PageHeadSkeleton({
  eyebrow,
  withSub,
}: {
  eyebrow?: string;
  withSub?: boolean;
}) {
  return (
    <div className="page-head">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <div className="skel line xl" style={{ width: "60%", marginTop: 4 }} />
      {withSub && (
        <div
          className="skel line"
          style={{ width: "40%", marginTop: 12 }}
        />
      )}
    </div>
  );
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: "0 var(--s-5)" }}>
      <div className="card elev">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="card-row"
            style={{ cursor: "default", borderBottom: i === rows - 1 ? "none" : undefined }}
          >
            <div className="skel avatar" />
            <div style={{ flex: 1 }}>
              <div className="skel line lg" style={{ width: "55%" }} />
              <div
                className="skel line"
                style={{ width: "35%", marginTop: 8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div
      className="card elev"
      style={{ padding: 0, border: "1px solid var(--hair)" }}
    >
      <div className="skel block" style={{ borderRadius: 0, height: 110 }} />
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="skel line lg" style={{ width: "50%" }} />
        <div
          className="skel line"
          style={{ width: "70%", marginTop: 10 }}
        />
        <div
          className="skel line"
          style={{ width: "100%", marginTop: 12, height: 6 }}
        />
      </div>
    </div>
  );
}
