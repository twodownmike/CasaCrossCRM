"use client";

import Link from "next/link";
import { ROLE_META, ROLE_ORDER } from "@/lib/types";

export function PeopleTabs({ role, q }: { role: string; q: string }) {
  function href(r: string) {
    const params = new URLSearchParams();
    if (r !== "all") params.set("role", r);
    if (q) params.set("q", q);
    return params.toString() ? `/people?${params.toString()}` : "/people";
  }
  return (
    <div className="tabs" style={{ marginTop: 16 }}>
      <Link href={href("all")} className={`tab ${role === "all" ? "active" : ""}`}>
        All
      </Link>
      {ROLE_ORDER.map((r) => (
        <Link
          key={r}
          href={href(r)}
          className={`tab ${role === r ? "active" : ""}`}
        >
          {ROLE_META[r].plural}
        </Link>
      ))}
    </div>
  );
}
