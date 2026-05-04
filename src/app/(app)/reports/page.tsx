import { createClient } from "@/lib/supabase/server";
import { listEvents } from "@/lib/queries";
import { fmtMoney, fmtDate } from "@/lib/format";
import Link from "next/link";
import { ReportsTabs } from "./reports-tabs";

export const dynamic = "force-dynamic";

function collectionPct(collected: number, booked: number) {
  return booked > 0 ? Math.min(100, Math.round((collected / booked) * 100)) : 100;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const tab = searchParams.tab ?? "overview";
  const supabase = createClient();

  const [events, { data: expensesRaw }] = await Promise.all([
    listEvents(),
    supabase.from("expenses").select("*"),
  ]);

  const expenses = expensesRaw ?? [];

  // — Totals —
  let totalBooked = 0,
    totalCollected = 0,
    totalExpenses = 0;
  events.forEach((e) => {
    e.participants.forEach((p) => {
      totalBooked += Number(p.rate);
      totalCollected += Number(p.paid);
    });
  });
  expenses.forEach((ex) => {
    totalExpenses += Number(ex.amount);
  });
  const totalOutstanding = totalBooked - totalCollected;
  const netIncome = totalCollected - totalExpenses;

  // — Per-event —
  const expByEvent = new Map<string, number>();
  expenses.forEach((ex) => {
    if (ex.event_id)
      expByEvent.set(
        ex.event_id,
        (expByEvent.get(ex.event_id) ?? 0) + Number(ex.amount),
      );
  });

  const eventStats = events
    .map((e) => {
      const booked = e.participants.reduce((s, p) => s + Number(p.rate), 0);
      const collected = e.participants.reduce((s, p) => s + Number(p.paid), 0);
      const eventExpenses = expByEvent.get(e.id) ?? 0;
      return {
        id: e.id,
        name: e.name,
        date: e.date,
        status: e.status,
        count: e.participants.length,
        booked,
        collected,
        expenses: eventExpenses,
        net: collected - eventExpenses,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // — Per-person —
  type PersonStat = {
    id: string;
    name: string;
    role: string;
    initials: string;
    tint: string;
    ink: string;
    events: number;
    booked: number;
    collected: number;
  };
  const personMap = new Map<string, PersonStat>();
  events.forEach((e) => {
    e.participants.forEach((p) => {
      const prev = personMap.get(p.person_id);
      if (prev) {
        prev.events++;
        prev.booked += Number(p.rate);
        prev.collected += Number(p.paid);
      } else {
        personMap.set(p.person_id, {
          id: p.person.id,
          name: p.person.name,
          role: p.role,
          initials: p.person.initials ?? "?",
          tint: p.person.tint ?? "var(--hair-2)",
          ink: p.person.ink ?? "var(--ink-3)",
          events: 1,
          booked: Number(p.rate),
          collected: Number(p.paid),
        });
      }
    });
  });
  const personStats = Array.from(personMap.values()).sort(
    (a, b) => b.booked - a.booked,
  );

  // — By role —
  const roleMap = new Map<
    string,
    { booked: number; collected: number; count: number }
  >();
  events.forEach((e) => {
    e.participants.forEach((p) => {
      const prev = roleMap.get(p.role);
      if (prev) {
        prev.booked += Number(p.rate);
        prev.collected += Number(p.paid);
        prev.count++;
      } else {
        roleMap.set(p.role, {
          booked: Number(p.rate),
          collected: Number(p.paid),
          count: 1,
        });
      }
    });
  });
  const roleStats = Array.from(roleMap.entries())
    .map(([role, s]) => ({ role, ...s }))
    .sort((a, b) => b.booked - a.booked);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Studio</div>
          <h1>
            <em>Reports</em>
          </h1>
          <div className="sub">{events.length} events total</div>
        </div>
      </div>

      <ReportsTabs active={tab} />

      {tab === "overview" && (
        <div
          style={{
            padding: "var(--s-5)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-5)",
          }}
        >
          <div className="stat-grid">
            <div className="stat">
              <div className="label">Collected</div>
              <div className="val tabnums">{fmtMoney(totalCollected)}</div>
              <div className="delta">{fmtMoney(totalBooked)} booked</div>
            </div>
            <div className="stat">
              <div className="label">Outstanding</div>
              <div className="val tabnums">{fmtMoney(totalOutstanding)}</div>
              <div className={`delta ${totalOutstanding > 0 ? "down" : ""}`}>
                {totalOutstanding > 0 ? "still owed" : "fully collected"}
              </div>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat">
              <div className="label">Expenses</div>
              <div className="val tabnums">{fmtMoney(totalExpenses)}</div>
              <div className="delta">{expenses.length} line items</div>
            </div>
            <div className="stat">
              <div className="label">Net income</div>
              <div
                className="val tabnums"
                style={netIncome < 0 ? { color: "var(--terracotta)" } : undefined}
              >
                {fmtMoney(netIncome)}
              </div>
              <div className={`delta ${netIncome >= 0 ? "up" : "down"}`}>
                collected minus expenses
              </div>
            </div>
          </div>

          {roleStats.length > 0 && (
            <div className="card">
              <div
                style={{
                  padding: "var(--s-3) var(--s-5)",
                  borderBottom: "1px solid var(--hair)",
                }}
              >
                <div className="label-line">Income by role</div>
              </div>
              {roleStats.map(({ role, booked, collected, count }) => {
                const pct = collectionPct(collected, booked);
                return (
                  <div
                    key={role}
                    className="card-row"
                    style={{ flexDirection: "column", gap: "var(--s-2)" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ textTransform: "capitalize", fontWeight: 500 }}>
                        {role}
                      </span>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {count} {count === 1 ? "booking" : "bookings"}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span className="tabnums" style={{ fontSize: 13 }}>
                        {fmtMoney(collected)} collected
                      </span>
                      <span className="tabnums muted" style={{ fontSize: 13 }}>
                        {fmtMoney(booked)} booked
                      </span>
                    </div>
                    <div className="progress">
                      <div
                        className={pct === 100 ? "sage" : "terracotta"}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "by-event" && (
        <div
          style={{
            padding: "var(--s-5)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {eventStats.map((e) => {
            const pct = collectionPct(e.collected, e.booked);
            return (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="card elev"
                style={{
                  display: "block",
                  padding: "var(--s-4) var(--s-5)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "var(--s-3)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {fmtDate(e.date)} · {e.count}{" "}
                      {e.count === 1 ? "participant" : "participants"}
                    </div>
                  </div>
                  <span className={`pill ${e.status}`}>{e.status}</span>
                </div>
                <div className="stat-grid">
                  <div>
                    <div className="label">Collected</div>
                    <div className="tabnums" style={{ fontWeight: 600 }}>
                      {fmtMoney(e.collected)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Expenses</div>
                    <div className="tabnums" style={{ fontWeight: 600 }}>
                      {fmtMoney(e.expenses)}
                    </div>
                  </div>
                  <div>
                    <div className="label">Net</div>
                    <div
                      className="tabnums"
                      style={{
                        fontWeight: 600,
                        color: e.net < 0 ? "var(--terracotta)" : undefined,
                      }}
                    >
                      {fmtMoney(e.net)}
                    </div>
                  </div>
                </div>
                {e.booked > 0 && (
                  <div className="progress" style={{ marginTop: "var(--s-3)" }}>
                    <div
                      className={pct === 100 ? "sage" : "terracotta"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
          {eventStats.length === 0 && (
            <div className="empty">
              <h3>No events yet</h3>
            </div>
          )}
        </div>
      )}

      {tab === "by-person" && (
        <div style={{ padding: "var(--s-5)" }}>
          <div className="card">
            {personStats.map((p) => {
              const pct = collectionPct(p.collected, p.booked);
              return (
                <Link
                  key={p.id}
                  href={`/people/${p.id}`}
                  className="card-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--s-3)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span
                    className="avatar"
                    style={{ background: p.tint, color: p.ink, flexShrink: 0 }}
                  >
                    {p.initials}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <span className="tabnums" style={{ fontWeight: 600 }}>
                        {fmtMoney(p.booked)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "var(--s-2)",
                      }}
                    >
                      <span
                        className="muted"
                        style={{ fontSize: 13, textTransform: "capitalize" }}
                      >
                        {p.role} · {p.events}{" "}
                        {p.events === 1 ? "event" : "events"}
                      </span>
                      <span className="tabnums muted" style={{ fontSize: 13 }}>
                        {fmtMoney(p.collected)} paid
                      </span>
                    </div>
                    {p.booked > 0 && (
                      <div className="progress">
                        <div
                          className={pct === 100 ? "sage" : "terracotta"}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
            {personStats.length === 0 && (
              <div className="empty">
                <h3>No participants yet</h3>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
