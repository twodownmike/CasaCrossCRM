import { Text, Link } from "@react-email/components";
import { render } from "@react-email/render";
import { EmailLayout, s } from "./_layout";

type Field = { label: string; value: string };

type Props = {
  applicantName: string;
  roleLabel: string;
  fields: Field[];
  message: string | null;
  inboxUrl: string;
};

export default function Application({ applicantName, roleLabel, fields, message, inboxUrl }: Props) {
  return (
    <EmailLayout preview={`New ${roleLabel.toLowerCase()} application — ${applicantName}`}>
      <Text style={s.h1}>New application</Text>
      <Text style={s.body_text}>
        Someone just submitted the public intake form. Details below — open the
        inbox to approve or archive.
      </Text>
      {fields.map(({ label, value }) => (
        <Text key={label} style={{ ...s.body_text, margin: "0 0 6px" }}>
          <span style={{ color: "#9a948a", fontSize: "12px" }}>{label}</span>
          <br />
          <strong>{value}</strong>
        </Text>
      ))}
      {message && (
        <Text style={{ ...s.highlight, marginTop: 16 }}>{message}</Text>
      )}
      <Link href={inboxUrl} style={{ ...s.button, marginTop: 8, display: "inline-block" }}>
        Open inbox
      </Link>
    </EmailLayout>
  );
}

export async function applicationEmail(props: Props): Promise<{ html: string; text: string }> {
  const html = await render(<Application {...props} />);
  const text = [
    `New ${props.roleLabel.toLowerCase()} application — ${props.applicantName}`,
    "",
    ...props.fields.map(({ label, value }) => `${label}: ${value}`),
    props.message ? `\nNote: ${props.message}` : "",
    `\nReview: ${props.inboxUrl}`,
  ].join("\n");
  return { html, text };
}
