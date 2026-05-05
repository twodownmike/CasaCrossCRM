"use client";

import { Icon } from "@/components/icons";

export function PacketPrintButton() {
  return (
    <button className="btn" type="button" onClick={() => window.print()}>
      <Icon.doc /> Print packet
    </button>
  );
}
