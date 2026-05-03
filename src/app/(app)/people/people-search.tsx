"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function PeopleSearch({
  initialQ,
  role,
}: {
  initialQ: string;
  role: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [, start] = useTransition();

  function update(value: string) {
    setQ(value);
    start(() => {
      const params = new URLSearchParams();
      if (role && role !== "all") params.set("role", role);
      if (value) params.set("q", value);
      router.replace(
        params.toString() ? `/people?${params.toString()}` : "/people",
      );
    });
  }

  return (
    <div className="search">
      <Icon.search />
      <input
        value={q}
        onChange={(e) => update(e.target.value)}
        placeholder="Search by name or city…"
      />
    </div>
  );
}
