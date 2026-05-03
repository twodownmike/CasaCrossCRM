"use client";

import { Icon } from "./icons";
import Link from "next/link";

export function AppHeader({ title = "Casa Cross" }: { title?: string }) {
  return (
    <header className="app-header">
      <div className="title">
        <span className="mark" />
        <span>{title}</span>
      </div>
      <div className="actions">
        <Link className="icon-btn" href="/account" aria-label="Account">
          <Icon.exit />
        </Link>
      </div>
    </header>
  );
}
