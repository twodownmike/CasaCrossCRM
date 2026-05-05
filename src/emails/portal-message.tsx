import { Text, Link } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout, s } from "./_layout";

// Team receives this when a portal user sends a message
type ToTeamProps = {
  senderName: string;
  eventName: string;
  body: string;
  replyUrl: string;
};

export function PortalMessageToTeam({ senderName, eventName, body, replyUrl }: ToTeamProps) {
  return (
    <EmailLayout preview={`New message from ${senderName} — ${eventName}`}>
      <Text style={s.h1}>New message</Text>
      <Text style={s.body_text}>
        <strong>{senderName}</strong> sent a message about{" "}
        <strong>{eventName}</strong>:
      </Text>
      <Text style={s.highlight}>{body}</Text>
      <Link href={replyUrl} style={s.button}>
        Reply in Portal tab
      </Link>
    </EmailLayout>
  );
}

export async function portalMessageToTeamEmail(props: ToTeamProps): Promise<{ html: string; text: string }> {
  const html = await render(<PortalMessageToTeam {...props} />);
  const text = [
    `New message from ${props.senderName} — ${props.eventName}`,
    "",
    props.body,
    "",
    `Reply: ${props.replyUrl}`,
  ].join("\n");
  return { html, text };
}

// Portal user receives this when the team sends a message
type ToVendorProps = {
  recipientName: string;
  eventName: string;
  body: string;
  portalUrl: string;
};

export function PortalMessageToVendor({ recipientName, eventName, body, portalUrl }: ToVendorProps) {
  return (
    <EmailLayout preview={`New message from Casa Cross — ${eventName}`}>
      <Text style={s.h1}>Hi {recipientName},</Text>
      <Text style={s.body_text}>
        You have a new message about <strong>{eventName}</strong>:
      </Text>
      <Text style={s.highlight}>{body}</Text>
      <Link href={portalUrl} style={s.button}>
        View &amp; Reply
      </Link>
      <Text style={{ ...s.muted, marginTop: 16 }}>{portalUrl}</Text>
    </EmailLayout>
  );
}

export async function portalMessageToVendorEmail(props: ToVendorProps): Promise<{ html: string; text: string }> {
  const html = await render(<PortalMessageToVendor {...props} />);
  const text = [
    `Hi ${props.recipientName},`,
    "",
    `New message about ${props.eventName}:`,
    "",
    props.body,
    "",
    `View and reply: ${props.portalUrl}`,
    "",
    "— Casa Cross Events",
  ].join("\n");
  return { html, text };
}
