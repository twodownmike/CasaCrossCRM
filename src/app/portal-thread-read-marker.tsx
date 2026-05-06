"use client";

import { useEffect } from "react";
import {
  markPortalThreadRead,
  markTeamPortalThreadRead,
} from "@/app/portal-actions";

export function PortalThreadReadMarker({
  eventId,
  personId,
  kind,
}: {
  eventId: string;
  personId: string;
  kind: "team" | "portal";
}) {
  useEffect(() => {
    const form = new FormData();
    form.set("event_id", eventId);
    form.set("person_id", personId);
    if (kind === "team") {
      markTeamPortalThreadRead(form);
    } else {
      markPortalThreadRead(form);
    }
  }, [eventId, personId, kind]);

  return null;
}
