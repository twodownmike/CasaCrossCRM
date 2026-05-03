import {
  PageHeadSkeleton,
  EventCardSkeleton,
} from "@/components/skeletons";

export default function EventsLoading() {
  return (
    <div>
      <PageHeadSkeleton eyebrow="Studio" withSub />
      <div
        className="tabs"
        style={{ marginTop: 4, paddingBottom: 8 }}
      >
        <div className="skel line" style={{ width: 60, margin: "12px 22px 12px 0" }} />
        <div className="skel line" style={{ width: 80, margin: "12px 22px 12px 0" }} />
        <div className="skel line" style={{ width: 70, margin: "12px 0" }} />
      </div>
      <div
        style={{
          padding: "var(--s-5)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <EventCardSkeleton />
        <EventCardSkeleton />
        <EventCardSkeleton />
      </div>
    </div>
  );
}
