import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { fmtDateFull } from "@/lib/format";
import type { ContractTokenView } from "@/lib/types";

const colors = {
  ink: "#1c1917",
  softInk: "#5f5951",
  muted: "#8d8479",
  line: "#e8dfd5",
  paper: "#fffdf9",
  blush: "#f5e3e6",
  rose: "#a04f5f",
  sage: "#dfe8dc",
  moss: "#60735f",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingHorizontal: 46,
    paddingBottom: 52,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: "Times-Roman",
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: {
    color: colors.rose,
    fontFamily: "Helvetica",
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  status: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    color: colors.moss,
    backgroundColor: colors.sage,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 26,
    fontSize: 27,
    lineHeight: 1.1,
  },
  meta: {
    marginTop: 17,
    marginBottom: 24,
    flexDirection: "row",
    gap: 9,
  },
  metaItem: {
    flex: 1,
    minHeight: 54,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
  },
  label: {
    color: colors.muted,
    fontFamily: "Helvetica",
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  value: {
    marginTop: 5,
    fontSize: 10.5,
    lineHeight: 1.25,
  },
  body: {
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
  },
  heading1: { marginTop: 4, marginBottom: 9, fontSize: 18 },
  heading2: { marginTop: 14, marginBottom: 6, color: colors.rose, fontSize: 14 },
  heading3: { marginTop: 12, marginBottom: 5, fontSize: 11.5 },
  paragraph: { marginBottom: 9, color: colors.softInk },
  bulletRow: { flexDirection: "row", gap: 7, marginBottom: 5, paddingLeft: 4 },
  bullet: { width: 8, color: colors.rose },
  bulletText: { flex: 1, color: colors.softInk },
  rule: { height: 1, marginVertical: 12, backgroundColor: colors.line },
  signatureBlock: {
    marginTop: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#b9c9b5",
    backgroundColor: "#f1f5ef",
  },
  signatureHeading: {
    color: colors.moss,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  signatureRow: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  signatureImage: {
    width: 190,
    height: 70,
    objectFit: "contain",
    backgroundColor: "#ffffff",
  },
  signerName: { fontSize: 15 },
  signerDate: {
    marginTop: 4,
    color: colors.softInk,
    fontFamily: "Helvetica",
    fontSize: 8.5,
  },
  footer: {
    position: "absolute",
    left: 46,
    right: 46,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.muted,
    fontFamily: "Helvetica",
    fontSize: 7.5,
  },
});

function pdfText(value: string | null | undefined) {
  return (value || "")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u00a0/g, " ");
}

function InlineText({ text }: { text: string }) {
  const parts = pdfText(text).split(/(\*\*.+?\*\*|\*.+?\*)/g);
  return (
    <Text>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={index} style={{ fontFamily: "Times-Bold" }}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <Text key={index} style={{ fontFamily: "Times-Italic" }}>
              {part.slice(1, -1)}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
  );
}

function ContractBody({ markdown }: { markdown: string }) {
  return (
    <View style={styles.body}>
      {markdown.replace(/\r\n?/g, "\n").split("\n").map((raw, index) => {
        const line = raw.trim();
        if (!line) return null;
        if (/^---+$/.test(line)) return <View key={index} style={styles.rule} />;
        const h3 = line.match(/^###\s+(.*)$/);
        if (h3) return <Text key={index} style={styles.heading3}><InlineText text={h3[1]} /></Text>;
        const h2 = line.match(/^##\s+(.*)$/);
        if (h2) return <Text key={index} style={styles.heading2}><InlineText text={h2[1]} /></Text>;
        const h1 = line.match(/^#\s+(.*)$/);
        if (h1) return <Text key={index} style={styles.heading1}><InlineText text={h1[1]} /></Text>;
        const bullet = line.match(/^[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bullet}>-</Text>
              <Text style={styles.bulletText}><InlineText text={bullet[1]} /></Text>
            </View>
          );
        }
        return <Text key={index} style={styles.paragraph}><InlineText text={line} /></Text>;
      })}
    </View>
  );
}

export function SignedContractPdf({
  contract,
  includeSignatureImage = true,
}: {
  contract: ContractTokenView;
  includeSignatureImage?: boolean;
}) {
  const signed = contract.status === "signed";
  return (
    <Document title={pdfText(contract.title)} author="Casa Cross Events">
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.brandRow} fixed>
          <Text style={styles.brand}>Casa Cross Events</Text>
          <Text style={styles.status}>{signed ? "Signed agreement" : "Agreement"}</Text>
        </View>

        <Text style={styles.title}>{pdfText(contract.title)}</Text>
        <View style={styles.meta} wrap={false}>
          <View style={styles.metaItem}>
            <Text style={styles.label}>For</Text>
            <Text style={styles.value}>{pdfText(contract.recipient_name)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Event</Text>
            <Text style={styles.value}>{pdfText(contract.event_name)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{pdfText(fmtDateFull(contract.event_date))}</Text>
          </View>
        </View>

        <ContractBody markdown={contract.body_md} />

        {signed && (
          <View style={styles.signatureBlock} wrap={false}>
            <Text style={styles.signatureHeading}>Signed and accepted</Text>
            <View style={styles.signatureRow}>
              {includeSignatureImage && contract.signature_url && (
                <Image src={contract.signature_url} style={styles.signatureImage} />
              )}
              <View>
                <Text style={styles.label}>Electronically signed by</Text>
                <Text style={styles.signerName}>{pdfText(contract.signed_name)}</Text>
                <Text style={styles.signerDate}>
                  Signed {contract.signed_at ? pdfText(fmtDateFull(contract.signed_at.slice(0, 10))) : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Casa Cross Events - Contract record</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export function signedContractFilename(contract: ContractTokenView) {
  const base = `${contract.event_name}-${contract.recipient_name}-signed-contract`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "signed-contract"}.pdf`;
}
