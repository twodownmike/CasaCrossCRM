import { PageHeadSkeleton } from "@/components/skeletons";

export default function MessagesLoading() {
  return (
    <div>
      <PageHeadSkeleton eyebrow="Conversations" withSub />
      <div
        style={{
          padding: "0 var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card elev"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 14,
            }}
          >
            <div
              className="skel"
              style={{ width: 48, height: 48, borderRadius: 12 }}
            />
            <div style={{ flex: 1 }}>
              <div className="skel line lg" style={{ width: "50%" }} />
              <div
                className="skel line"
                style={{ width: "80%", marginTop: 8 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
