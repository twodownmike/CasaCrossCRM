"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/sheet";
import { Icon } from "@/components/icons";
import { fmtMoney, fmtDate } from "@/lib/format";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/app/actions";

export function ExpensesPanel({
  eventId,
  expenses,
  collected,
  budget,
}: {
  eventId: string;
  expenses: Expense[];
  collected: number;
  budget: number;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const totals = useMemo(() => {
    let total = 0;
    const byCategory = new Map<string, number>();
    for (const e of expenses) {
      total += Number(e.amount);
      const k = e.category || "Other";
      byCategory.set(k, (byCategory.get(k) ?? 0) + Number(e.amount));
    }
    return { total, byCategory };
  }, [expenses]);

  const profit = collected - totals.total;
  const projected = budget - totals.total;
  const margin = collected > 0 ? Math.round((profit / collected) * 100) : null;

  return (
    <div style={{ padding: "var(--s-5)" }}>
      <div className="card elev" style={{ padding: "var(--s-5)", marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 18,
          }}
        >
          <div>
            <div
              className="label"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
                fontWeight: 500,
              }}
            >
              Spent
            </div>
            <div className="money" style={{ fontSize: 24, marginTop: 2 }}>
              {fmtMoney(totals.total)}
            </div>
          </div>
          <div>
            <div
              className="label"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
                fontWeight: 500,
              }}
            >
              Collected
            </div>
            <div className="money" style={{ fontSize: 24, marginTop: 2 }}>
              {fmtMoney(collected)}
            </div>
          </div>
          <div>
            <div
              className="label"
              style={{
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-4)",
                fontWeight: 500,
              }}
            >
              Profit
            </div>
            <div
              className="money"
              style={{
                fontSize: 24,
                marginTop: 2,
                color: profit >= 0 ? "var(--sage)" : "var(--terracotta)",
              }}
            >
              {fmtMoney(profit)}
            </div>
            {margin != null && (
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                {margin}% margin
              </div>
            )}
          </div>
        </div>
        {budget > 0 && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--hair-2)",
              fontSize: 12,
              color: "var(--ink-3)",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>
              Budget {fmtMoney(budget)} ·{" "}
              <span
                style={{
                  color: projected >= 0 ? "var(--sage)" : "var(--terracotta)",
                  fontWeight: 500,
                }}
              >
                {projected >= 0
                  ? `${fmtMoney(projected)} projected profit`
                  : `${fmtMoney(-projected)} over`}
              </span>
            </span>
          </div>
        )}
      </div>

      {totals.byCategory.size > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          {Array.from(totals.byCategory.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => (
              <span key={cat} className="pill">
                {cat} · {fmtMoney(amt)}
              </span>
            ))}
        </div>
      )}

      <div className="card elev" style={{ marginBottom: 14 }}>
        {expenses.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 13,
            }}
          >
            No expenses yet. Tap <strong>Add expense</strong> below.
          </div>
        ) : (
          expenses.map((e) => (
            <button
              key={e.id}
              type="button"
              className="card-row"
              onClick={() => {
                setEditing(e);
                setOpen(true);
              }}
              style={{ alignItems: "flex-start" }}
            >
              <span
                className="avatar"
                style={{
                  background: "var(--terracotta-tint)",
                  color: "var(--terracotta)",
                }}
              >
                <Icon.dollar />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {e.description}
                  </span>
                  {e.category && <span className="pill">{e.category}</span>}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-3)",
                    marginTop: 4,
                  }}
                >
                  {[
                    e.vendor_name,
                    e.spent_at ? fmtDate(e.spent_at, { short: true }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div
                className="money tabnums"
                style={{ fontSize: 16, color: "var(--ink-2)" }}
              >
                {fmtMoney(Number(e.amount))}
              </div>
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        className="btn block"
        onClick={() => {
          setEditing(null);
          setOpen(true);
        }}
      >
        <Icon.plus /> Add expense
      </button>

      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit expense" : "Add expense"}
      >
        <ExpenseForm
          eventId={eventId}
          expense={editing}
          onDone={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      </Sheet>
    </div>
  );
}

function ExpenseForm({
  eventId,
  expense,
  onDone,
}: {
  eventId: string;
  expense: Expense | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const [description, setDescription] = useState(expense?.description || "");
  const [category, setCategory] = useState(expense?.category || "");
  const [amount, setAmount] = useState(
    expense?.amount != null ? String(expense.amount) : "",
  );
  const [vendorName, setVendorName] = useState(expense?.vendor_name || "");
  const [spentAt, setSpentAt] = useState(expense?.spent_at || "");
  const [notes, setNotes] = useState(expense?.notes || "");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const f = new FormData();
    f.set("event_id", eventId);
    if (expense) f.set("id", expense.id);
    f.set("description", description);
    f.set("category", category);
    f.set("amount", amount);
    f.set("vendor_name", vendorName);
    f.set("spent_at", spentAt);
    f.set("notes", notes);
    start(async () => {
      const fn = expense ? updateExpense : createExpense;
      await fn(f);
      router.refresh();
      onDone();
    });
  }

  function remove() {
    if (!expense) return;
    if (!confirm("Delete this expense?")) return;
    const f = new FormData();
    f.set("id", expense.id);
    f.set("event_id", eventId);
    start(async () => {
      await deleteExpense(f);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="form-grid" style={{ paddingTop: 8 }}>
      <div>
        <label className="form-label">What was it</label>
        <input
          required
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Magnolia Manor venue rental"
        />
      </div>
      <div className="form-row">
        <div>
          <label className="form-label">Amount</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input
            type="date"
            className="input"
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="form-label">Category</label>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">No category</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">Vendor / payee</label>
        <input
          className="input"
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          placeholder="Who you paid (optional)"
        />
      </div>
      <div>
        <label className="form-label">Notes</label>
        <textarea
          className="input textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="sheet-footer">
        <button className="btn primary block" type="submit" disabled={pending}>
          {pending ? "Saving…" : expense ? "Save changes" : "Add expense"}
        </button>
        {expense && (
          <button
            type="button"
            className="btn block"
            style={{
              marginTop: 8,
              color: "var(--terracotta)",
            }}
            onClick={remove}
            disabled={pending}
          >
            Delete expense
          </button>
        )}
      </div>
    </form>
  );
}
