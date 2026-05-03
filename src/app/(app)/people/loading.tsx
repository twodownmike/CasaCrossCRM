import { PageHeadSkeleton, CardListSkeleton } from "@/components/skeletons";

export default function PeopleLoading() {
  return (
    <div>
      <PageHeadSkeleton eyebrow="Roster" withSub />
      <div className="search">
        <div className="skel line" style={{ width: "100%", height: 16 }} />
      </div>
      <div className="tabs" style={{ marginTop: 16, paddingBottom: 8 }}>
        {[40, 90, 60, 70, 60, 60, 70].map((w, i) => (
          <div
            key={i}
            className="skel line"
            style={{ width: w, margin: "12px 22px 12px 0" }}
          />
        ))}
      </div>
      <div className="section-label" style={{ marginTop: 24 }}>
        <div className="skel line lg" style={{ width: 130 }} />
      </div>
      <CardListSkeleton rows={4} />
    </div>
  );
}
