"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function SearchBar({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(initialQ);
  const [, start] = useTransition();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function update(value: string) {
    setQ(value);
    start(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      router.replace(
        params.toString() ? `/search?${params.toString()}` : "/search",
      );
    });
  }

  return (
    <div className="search">
      <Icon.search />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => update(e.target.value)}
        placeholder="Search events, people, applications…"
      />
    </div>
  );
}
