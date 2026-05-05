"use client";

import { useEffect } from "react";
import { markPortalMessagesRead } from "@/app/actions";

export function MarkRead() {
  useEffect(() => {
    markPortalMessagesRead();
  }, []);
  return null;
}
