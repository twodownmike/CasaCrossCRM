"use client";

import { Icon } from "./icons";
import Link from "next/link";
import { Logo } from "./logo";

export function AppHeader() {
  return (
    <header className="app-header">
      <Link href="/home" aria-label="Casa Cross — home" className="brand-link">
        <Logo variant="header" />
      </Link>
      <div className="actions">
        <Link className="icon-btn" href="/search" aria-label="Search">
          <Icon.search />
        </Link>
        <Link className="icon-btn" href="/admin" aria-label="Admin">
          <Icon.gear />
        </Link>
        <Link className="icon-btn" href="/account" aria-label="Account">
          <Icon.exit />
        </Link>
      </div>
    </header>
  );
}
