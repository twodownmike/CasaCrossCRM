import { fmtDateFull, fmtMoney } from "./format";

export const MERGE_FIELDS = [
  ["{{participant_name}}", "What they go by (preferred name)"],
  ["{{participant_legal_name}}", "Legal name for contracts"],
  ["{{participant_email}}", "Their email"],
  ["{{participant_phone}}", "Their phone"],
  ["{{role}}", "Their role on this shoot"],
  ["{{rate}}", "Their rate (formatted as $)"],
  ["{{rate_paid}}", "Already paid (formatted as $)"],
  ["{{event_name}}", "Event name"],
  ["{{event_date}}", "Event date (full)"],
  ["{{event_time}}", "Event time label"],
  ["{{event_location}}", "Event location"],
  ["{{studio_name}}", "Casa Cross Events"],
  ["{{today}}", "Today's date (full)"],
] as const;

export type MergeContext = {
  participantName: string;
  participantLegalName: string | null;
  participantEmail: string | null;
  participantPhone: string | null;
  role: string;
  rate: number;
  ratePaid: number;
  eventName: string;
  eventDate: string;
  eventTime: string | null;
  eventLocation: string | null;
};

export function renderMerge(template: string, ctx: MergeContext): string {
  const replacements: Record<string, string> = {
    "{{participant_name}}": ctx.participantName,
    "{{participant_legal_name}}":
      ctx.participantLegalName || ctx.participantName,
    "{{participant_email}}": ctx.participantEmail || "—",
    "{{participant_phone}}": ctx.participantPhone || "—",
    "{{role}}": ctx.role,
    "{{rate}}": fmtMoney(ctx.rate),
    "{{rate_paid}}": fmtMoney(ctx.ratePaid),
    "{{event_name}}": ctx.eventName,
    "{{event_date}}": fmtDateFull(ctx.eventDate),
    "{{event_time}}": ctx.eventTime || "TBD",
    "{{event_location}}": ctx.eventLocation || "TBD",
    "{{studio_name}}": "Casa Cross Events",
    "{{today}}": fmtDateFull(new Date().toISOString().slice(0, 10)),
  };
  return template.replace(/\{\{[a-z_]+\}\}/gi, (m) => replacements[m] ?? m);
}

/**
 * Tiny markdown subset → safe HTML.
 * Supports: # / ## / ### headings, **bold**, *italic*, blank-line paragraphs,
 * - bullet lists, --- horizontal rules, line breaks via two spaces or a trailing backslash.
 */
export function mdToHtml(md: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inList = false;

  function flushList() {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  }

  function inline(s: string): string {
    const hardBreak = s.endsWith("\\");
    const text = hardBreak ? s.slice(0, -1).trimEnd() : s;
    return escape(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/  $/g, "<br/>") + (hardBreak ? "<br/>" : "");
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "") {
      flushList();
      continue;
    }
    if (/^---+$/.test(line)) {
      flushList();
      out.push("<hr/>");
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.*)$/))) {
      flushList();
      out.push(`<h3>${inline(m[1])}</h3>`);
      continue;
    }
    if ((m = line.match(/^##\s+(.*)$/))) {
      flushList();
      out.push(`<h2>${inline(m[1])}</h2>`);
      continue;
    }
    if ((m = line.match(/^#\s+(.*)$/))) {
      flushList();
      out.push(`<h1>${inline(m[1])}</h1>`);
      continue;
    }
    if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    flushList();
    out.push(`<p>${inline(line)}</p>`);
  }
  flushList();
  return out.join("\n");
}

export function generateShareToken(): string {
  // 32 chars from a 24-byte random buffer, base64url-safe-ish
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
    .join("");
}

export const DEFAULT_TEMPLATE_BODY = `# Casa Cross Events — Booking Agreement

This agreement confirms the booking of **{{participant_name}}** as **{{role}}** for the event **{{event_name}}** on **{{event_date}}** at **{{event_location}}**.

## Compensation
The agreed rate for this booking is **{{rate}}**, payable per the studio's payment terms.

## Responsibilities
- Arrive at the call time and location specified by the studio.
- Provide your own gear / wardrobe / supplies as agreed unless the studio has noted otherwise.
- Communicate any conflicts or changes as early as possible.

## Image Rights
Casa Cross Events retains the right to use images from this shoot for editorial, marketing, social, and portfolio purposes. The participant retains the right to use the images for their own portfolio with credit to Casa Cross Events.

## Cancellation
If the participant cancels within 7 days of the event, any deposits paid are non-refundable. The studio may reschedule the event with at least 7 days' notice.

---

By signing below, I confirm that I have read and agree to this agreement.

Signed by: **{{participant_legal_name}}**
Date: **{{today}}**
`;
