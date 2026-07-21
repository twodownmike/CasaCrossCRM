import Link from "next/link";
import { fmtDate, relTime } from "@/lib/format";
import type { PersonActivityItem } from "@/lib/queries";

export function ActivityTimeline({ items }: { items: PersonActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <h3>No activity yet</h3>
        <div>
          Contracts, forms, messages, invitations, and notes will appear here.
        </div>
      </div>
    );
  }

  return (
    <div className="card elev" style={{ padding: "18px 18px 0" }}>
      <div className="timeline">
        {items.map((item) => {
          const content = (
            <>
              <div
                className="when"
                title={fmtDate(item.occurredAt.slice(0, 10), { weekday: true })}
              >
                {relTime(item.occurredAt)}
              </div>
              <div className="what">{item.title}</div>
              {item.detail && <div className="who">{item.detail}</div>}
            </>
          );
          return (
            <div key={item.id} className={`item ${item.tone}`}>
              {item.href ? (
                <Link href={item.href} className="activity-link">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
