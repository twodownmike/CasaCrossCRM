import Link from "next/link";
import { fmtDate, fmtMoney, daysUntilLabel } from "@/lib/format";
import { StatusPill } from "./pill";
import { AvatarStack } from "./avatar";
import { Icon } from "./icons";
import type { EventRow, Participant, Person } from "@/lib/types";

export type EventCardData = EventRow & {
  participants: Array<Participant & { person: Person }>;
};

export function EventCard({ event }: { event: EventCardData }) {
  const totals = event.participants.reduce(
    (acc, p) => {
      acc.rate += Number(p.rate);
      acc.paid += Number(p.paid);
      return acc;
    },
    { rate: 0, paid: 0 },
  );
  const pct =
    totals.rate > 0 ? Math.round((totals.paid / totals.rate) * 100) : 100;
  const dlabel = daysUntilLabel(event.date);

  return (
    <Link
      href={`/events/${event.id}`}
      className="card elev"
      style={{
        width: "100%",
        textAlign: "left",
        padding: 0,
        border: "1px solid var(--hair)",
        display: "block",
        background: "var(--paper)",
      }}
    >
      <div
        className={event.cover_image_url ? "" : `cover-${event.cover || "modern"}`}
        style={{
          height: 110,
          position: "relative",
          backgroundImage: event.cover_image_url
            ? `url(${event.cover_image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 50%, rgba(20,18,14,0.45))",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            right: 14,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <StatusPill status={event.status} />
          {dlabel && (
            <span
              className="pill"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "var(--ink)",
              }}
            >
              {dlabel}
            </span>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 14,
            right: 14,
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.92,
            }}
          >
            {fmtDate(event.date, { weekday: true, short: true })}
          </div>
          <div
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: 22,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              marginTop: 2,
            }}
          >
            {event.name}
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="row gap-3">
            <span className="label-line">
              <Icon.users />
              <span>{event.participants.length}</span>
            </span>
            {event.location && (
              <span className="label-line">
                <Icon.pin />
                <span
                  style={{
                    maxWidth: 130,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.location}
                </span>
              </span>
            )}
          </div>
          <AvatarStack
            people={event.participants.slice(0, 4).map((p) => p.person)}
          />
        </div>
        <div
          className="row between"
          style={{ marginBottom: 6, fontSize: 12 }}
        >
          <span className="muted">
            {fmtMoney(totals.paid)} of {fmtMoney(totals.rate)} paid
          </span>
          <span className="muted tabnums">{pct}%</span>
        </div>
        <div className={`progress ${pct === 100 ? "sage" : "terracotta"}`}>
          <i style={{ width: pct + "%" }} />
        </div>
      </div>
    </Link>
  );
}
