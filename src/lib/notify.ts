/**
 * Resend transactional email wrapper.
 * Set RESEND_API_KEY and NOTIFICATION_EMAILS env vars to enable.
 * Failures are logged but never thrown — the caller's primary mutation
 * has already succeeded by the time this runs.
 */

const RESEND_URL = "https://api.resend.com/emails";
const FROM_DEFAULT = "Casa Cross <onboarding@resend.dev>";

async function resend(to: string | string[], subject: string, html: string, text?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM || FROM_DEFAULT;
  if (!apiKey) {
    console.log("[notify] skipping — no RESEND_API_KEY configured");
    return;
  }
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text }),
    });
    if (!res.ok) console.error("[notify] resend rejected", res.status, await res.text());
  } catch (err) {
    console.error("[notify] resend network error", err);
  }
}

/** Send to the configured team address(es). */
export async function sendNotificationEmail({
  subject,
  html,
  text,
}: {
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const recipients = (process.env.NOTIFICATION_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (recipients.length === 0) {
    console.log("[notify] skipping — no NOTIFICATION_EMAILS configured");
    return;
  }
  await resend(recipients, subject, html, text);
}

/** Send to a specific address (e.g. portal user). */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!to) return;
  await resend(to, subject, html, text);
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
