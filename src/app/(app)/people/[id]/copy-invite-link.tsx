"use client";

import { useState } from "react";

export function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="btn sm" type="button" onClick={copy}>
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
