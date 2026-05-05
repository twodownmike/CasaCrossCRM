import { Text, Link } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout, s } from "./_layout";

type Props = {
  recipientName: string;
  portalUrl: string;
};

export default function PortalInvite({ recipientName, portalUrl }: Props) {
  return (
    <EmailLayout preview={`You've been invited to the Casa Cross portal`}>
      <Text style={s.h1}>Hi {recipientName},</Text>
      <Text style={s.body_text}>
        You've been invited to the <strong>Casa Cross client portal</strong> —
        your private space to view event details, review and sign contracts, and
        message the team directly.
      </Text>
      <Text style={s.body_text}>
        Sign in with this email address to get started. You'll receive a magic
        link — no password needed.
      </Text>
      <Link href={portalUrl} style={s.button}>
        Open your portal
      </Link>
      <Text style={{ ...s.muted, marginTop: 16 }}>{portalUrl}</Text>
    </EmailLayout>
  );
}

export async function portalInviteEmail(props: Props): Promise<{ html: string; text: string }> {
  const html = await render(<PortalInvite {...props} />);
  const text = [
    `Hi ${props.recipientName},`,
    "",
    "You've been invited to the Casa Cross client portal — view event details, sign contracts, and message the team.",
    "",
    `Sign in here (no password needed): ${props.portalUrl}`,
    "",
    "— Casa Cross Events",
  ].join("\n");
  return { html, text };
}
