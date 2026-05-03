export function fmtMoney(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (v === 0) return "$0";
  return (
    "$" +
    v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  );
}

export function fmtDate(
  iso: string | null | undefined,
  opts: { weekday?: boolean; short?: boolean } = {},
) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  const month = d.toLocaleString("en-US", { month: opts.short ? "short" : "long" });
  const day = d.getDate();
  if (opts.weekday) {
    const wd = d.toLocaleString("en-US", {
      weekday: opts.short ? "short" : "long",
    });
    return `${wd}, ${month} ${day}`;
  }
  return `${month} ${day}`;
}

export function fmtDateFull(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(iso: string | null | undefined) {
  if (!iso) return Infinity;
  const d = new Date(iso + "T12:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysUntilLabel(iso: string | null | undefined) {
  const d = daysUntil(iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d > 0 && d < 14) return `In ${d} days`;
  if (d < 0 && d > -14) return `${-d} days ago`;
  return null;
}

export function eyebrowToday() {
  const d = new Date();
  return d.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function relTime(isoTs: string | null | undefined) {
  if (!isoTs) return "";
  const t = new Date(isoTs).getTime();
  const now = Date.now();
  const diff = (now - t) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
  const days = Math.round(diff / 86400);
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  return new Date(isoTs).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function chatTime(isoTs: string) {
  const t = new Date(isoTs);
  return t.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function deriveInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}
