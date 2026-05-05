import { Text, Link } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout, s } from "./_layout";

type Props = {
  recipientName: string;
  eventName: string;
  signingUrl: string;
};

export default function ContractReady({ recipientName, eventName, signingUrl }: Props) {
  return (
    <EmailLayout preview={`Your agreement for ${eventName} is ready to sign`}>
      <Text style={s.h1}>Hi {recipientName},</Text>
      <Text style={s.body_text}>
        Your booking agreement for <strong>{eventName}</strong> is ready.
        Please review and sign at your earliest convenience.
      </Text>
      <Link href={signingUrl} style={s.button}>
        Review &amp; Sign
      </Link>
      <Text style={{ ...s.muted, marginTop: 16 }}>{signingUrl}</Text>
    </EmailLayout>
  );
}

export async function contractReadyEmail(props: Props): Promise<{ html: string; text: string }> {
  const html = await render(<ContractReady {...props} />);
  const text = [
    `Hi ${props.recipientName},`,
    "",
    `Your booking agreement for ${props.eventName} is ready to sign:`,
    props.signingUrl,
    "",
    "— Casa Cross Events",
  ].join("\n");
  return { html, text };
}
