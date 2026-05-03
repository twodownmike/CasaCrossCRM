/**
 * Resend transactional email wrapper.
 * Set RESEND_API_KEY and NOTIFICATION_EMAILS env vars to enable.
 * Failures are logged but never thrown — the caller's primary mutation
 * has already succeeded by the time this runs.
 */

const RESEND_URL = "https://api.resend.com/emails";
const FROM_DEFAULT = "Casa Cross <onboarding@resend.dev>";

export async function sendNotificationEmail({
  subject,
  html,
  text,
}: {
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = (process.env.NOTIFICATION_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const from = process.env.NOTIFICATION_FROM || FROM_DEFAULT;

  if (!apiKey || recipients.length === 0) {
    console.log(
      "[notify] skipping — no RESEND_API_KEY or NOTIFICATION_EMAILS configured",
    );
    return;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[notify] resend rejected", res.status, body);
    }
  } catch (err) {
    console.error("[notify] resend network error", err);
  }
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
