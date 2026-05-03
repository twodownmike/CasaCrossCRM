"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "./icons";

const CLOSE_MS = 280;

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  // Keep the sheet mounted briefly while it animates closed,
  // then unmount entirely so a glitched transform can't leave
  // it visible at the bottom of the screen.
  const [mounted, setMounted] = useState(open);
  const [showing, setShowing] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Defer the .open class one frame so the slide-up animation runs.
      const raf = requestAnimationFrame(() => setShowing(true));
      return () => cancelAnimationFrame(raf);
    }
    setShowing(false);
    const t = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div
        className={`sheet-backdrop ${showing ? "open" : ""}`}
        onClick={onClose}
      />
      <div
        className={`sheet ${showing ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="grab" />
        <div className="head">
          <h3>{title}</h3>
          <div className="row gap-2">
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon.close />
            </button>
          </div>
        </div>
        <div className="body">{children}</div>
      </div>
    </>
  );
}
