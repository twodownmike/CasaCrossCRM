import {
  Html,
  Head,
  Body,
  Preview,
  Container,
  Text,
  Hr,
} from "@react-email/components";

const s = {
  body: {
    backgroundColor: "#f4efe5",
    fontFamily: '-apple-system, "Inter", Helvetica, Arial, sans-serif',
    margin: "0",
    padding: "32px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    margin: "0 auto",
    padding: "36px 32px 28px",
    maxWidth: "560px",
  },
  eyebrow: {
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#9a948a",
    fontWeight: "500",
    margin: "0 0 6px",
  },
  h1: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: "400",
    fontSize: "28px",
    color: "#1a1814",
    lineHeight: "1.15",
    margin: "0 0 20px",
    letterSpacing: "-0.01em",
  },
  body_text: {
    fontSize: "14px",
    color: "#3d3a35",
    lineHeight: "1.65",
    margin: "0 0 16px",
  },
  muted: {
    fontSize: "12px",
    color: "#9a948a",
    margin: "0 0 8px",
    wordBreak: "break-all" as const,
  },
  hr: { borderColor: "#ede8df", margin: "24px 0" },
  footer: { fontSize: "11px", color: "#b0aa9e", margin: "0" },
  button: {
    backgroundColor: "#1a1814",
    borderRadius: "999px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "500",
    padding: "13px 26px",
    textDecoration: "none",
  },
  highlight: {
    backgroundColor: "#f4efe5",
    borderRadius: "10px",
    padding: "14px 16px",
    fontSize: "14px",
    lineHeight: "1.55",
    color: "#3d3a35",
    whiteSpace: "pre-wrap" as const,
    margin: "0 0 20px",
  },
} as const;

export { s };

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={s.body}>
        <Container style={s.container}>
          <Text style={s.eyebrow}>Casa Cross Events</Text>
          {children}
          <Hr style={s.hr} />
          <Text style={s.footer}>Casa Cross Events · crm.casacross.org</Text>
        </Container>
      </Body>
    </Html>
  );
}
