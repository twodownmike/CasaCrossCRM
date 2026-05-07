"use client";

import { Icon } from "@/components/icons";

export function PacketPrintButton({ eventId }: { eventId: string }) {
  return (
    <a
      className="btn"
      href={`/events/${eventId}/packet.pdf`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon.doc /> Download packet PDF
    </a>
  );
}
