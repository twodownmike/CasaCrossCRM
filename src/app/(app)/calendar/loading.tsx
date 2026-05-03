import { PageHeadSkeleton } from "@/components/skeletons";

export default function CalendarLoading() {
  return (
    <div>
      <PageHeadSkeleton eyebrow="Calendar" />
      <div
        style={{
          padding: "0 var(--s-5)",
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
        }}
      >
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="skel"
            style={{ aspectRatio: "1", borderRadius: "var(--r-2)" }}
          />
        ))}
      </div>
    </div>
  );
}
