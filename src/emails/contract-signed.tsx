import { Text, Link } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout, s } from "./_layout";

type Props = {
  signerName: string;
  contractTitle: string;
  eventName: string;
  contractUrl: string;
};

export default function ContractSigned({ signerName, contractTitle, eventName, contractUrl }: Props) {
  return (
    <EmailLayout preview={`${signerName} signed ${contractTitle}`}>
      <Text style={s.h1}>{signerName} signed</Text>
      <Text style={s.body_text}>
        <strong>{contractTitle}</strong> for <strong>{eventName}</strong> has
        been signed by {signerName}. The signed copy is now on file.
      </Text>
      <Link href={contractUrl} style={s.button}>
        View contract
      </Link>
    </EmailLayout>
  );
}

export async function contractSignedEmail(props: Props): Promise<{ html: string; text: string }> {
  const html = await render(<ContractSigned {...props} />);
  const text = [
    `${props.signerName} signed ${props.contractTitle} — ${props.eventName}`,
    "",
    `View the signed contract: ${props.contractUrl}`,
  ].join("\n");
  return { html, text };
}
