"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./icons";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`sheet-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`sheet ${open ? "open" : ""}`} role="dialog" aria-modal="true">
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
