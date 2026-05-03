import {
  PageHeadSkeleton,
  EventCardSkeleton,
  CardListSkeleton,
} from "@/components/skeletons";

export default function HomeLoading() {
  return (
    <div>
      <PageHeadSkeleton eyebrow="Loading…" withSub />
      <div className="stat-grid">
        <div className="stat">
          <div className="skel line" style={{ width: "60%" }} />
          <div
            className="skel line xl"
            style={{ width: "70%", marginTop: 8 }}
          />
        </div>
        <div className="stat">
          <div className="skel line" style={{ width: "50%" }} />
          <div
            className="skel line xl"
            style={{ width: "65%", marginTop: 8 }}
          />
        </div>
      </div>
      <div className="section-label">
        <div className="skel line lg" style={{ width: 100 }} />
      </div>
      <div style={{ padding: "0 var(--s-5)" }}>
        <EventCardSkeleton />
      </div>
      <div className="section-label">
        <div className="skel line lg" style={{ width: 160 }} />
      </div>
      <CardListSkeleton rows={3} />
    </div>
  );
}
