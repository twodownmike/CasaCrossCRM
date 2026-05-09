import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { fmtDateFull, fmtMoney } from "@/lib/format";
import { ROLE_META, type RoleKind } from "@/lib/types";
import type { EventFull } from "@/lib/queries";

export type PacketContract = {
  participant_id: string;
  title: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  signed_at: string | null;
  created_at: string;
};

export type PacketFormAssignment = {
  participant_id: string;
  sent_at: string | null;
  completed_at: string | null;
  form: { title: string } | { title: string }[] | null;
};

type Props = {
  event: EventFull;
  contracts: PacketContract[];
  formAssignments: PacketFormAssignment[];
};

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
  gold: "#b9905f",
};

const styles = StyleSheet.create({
  page: {
    padding: 42,
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: "Times-Roman",
    fontSize: 10,
  },
  cover: {
    minHeight: "100%",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.rose,
    fontSize: 15,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  coverTitle: {
    marginTop: 78,
    fontSize: 42,
    lineHeight: 1.05,
  },
  coverSubtitle: {
    marginTop: 12,
    color: colors.softInk,
    fontSize: 13,
    lineHeight: 1.5,
  },
  rule: {
    marginVertical: 18,
    height: 1,
    backgroundColor: colors.line,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
  },
  label: {
    color: colors.muted,
    fontSize: 7.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: 6,
    fontSize: 18,
    color: colors.ink,
  },
  footer: {
    color: colors.muted,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pageTitle: {
    fontSize: 22,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    marginBottom: 8,
    color: colors.rose,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  prose: {
    color: colors.softInk,
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailCard: {
    width: "48.7%",
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#ffffff",
  },
  detailValue: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 1.35,
  },
  rosterRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.blush,
  },
  avatarText: {
    color: colors.rose,
    fontSize: 11,
  },
  rosterBody: {
    flex: 1,
  },
  rosterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  personName: {
    fontSize: 12,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    color: colors.moss,
    backgroundColor: colors.sage,
    fontSize: 7.5,
    textTransform: "uppercase",
  },
  metaLine: {
    marginTop: 3,
    color: colors.softInk,
    fontSize: 9,
    lineHeight: 1.35,
  },
  statusGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  statusText: {
    color: colors.muted,
    fontSize: 8,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  taskTitle: {
    fontSize: 10.5,
  },
  taskDue: {
    color: colors.muted,
    fontSize: 8.5,
  },
  note: {
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    backgroundColor: "#ffffff",
  },
});

function latestByParticipant<T extends { participant_id: string; created_at?: string }>(
  rows: T[],
) {
  const map = new Map<string, T>();
  rows.forEach((row) => {
    if (!map.has(row.participant_id)) {
      map.set(row.participant_id, row);
    }
  });
  return map;
}

function roleLabel(role: RoleKind) {
  return ROLE_META[role]?.label || role;
}

function statusLabel(value: string | null | undefined) {
  if (!value) return "Not sent";
  if (value === "na") return "N/A";
  if (value === "unsent") return "Not sent";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function contractDisplayStatus(contract: {
  status: string;
  opened_at?: string | null;
}) {
  if (contract.status === "signed") return "signed";
  if (contract.status === "sent" && contract.opened_at) return "opened";
  return contract.status;
}

function formTitle(row: PacketFormAssignment | undefined) {
  if (!row?.form) return null;
  return Array.isArray(row.form) ? row.form[0]?.title : row.form.title;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function cleanFilenamePart(value: string) {
  return value.replace(/[^\w\s-]/g, "").trim();
}

export function eventPacketFilename(event: EventFull) {
  const name = cleanFilenamePart(event.name).replace(/\s+/g, "-").toLowerCase();
  return `${name || "event"}-packet.pdf`;
}

export function EventPacketPdf({ event, contracts, formAssignments }: Props) {
  const contractsByParticipant = latestByParticipant(contracts);
  const formsByParticipant = latestByParticipant(formAssignments);
  const signedCount = event.participants.filter((p) => {
    const status = contractsByParticipant.get(p.id)?.status || p.contract;
    return status === "signed";
  }).length;
  const sentCount = event.participants.filter((p) => {
    const status = contractsByParticipant.get(p.id)?.status || p.contract;
    return status === "sent" || status === "signed";
  }).length;
  const completedForms = formAssignments.filter((row) => row.completed_at).length;
  const vendorRoles: RoleKind[] = [
    "venue",
    "vendor",
    "hmua",
    "stylist",
    "photographer",
  ];
  const participants = [
    ...event.participants.filter((p) => vendorRoles.includes(p.role)),
    ...event.participants.filter((p) => !vendorRoles.includes(p.role)),
  ];
  const openTasks = event.tasks.filter((task) => !task.done);
  const brief = event.portal_brief || event.description;

  return (
    <Document
      title={`${event.name} Packet`}
      author="Casa Cross Events"
      subject="Event packet"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.cover}>
          <View>
            <Text style={styles.brand}>Casa Cross Events</Text>
            <Text style={styles.coverTitle}>{event.name}</Text>
            <Text style={styles.coverSubtitle}>
              Event packet prepared for planning, vendor coordination, contracts,
              forms, and day-of reference.
            </Text>
          </View>

          <View>
            <View style={styles.rule} />
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.statValue}>{fmtDateFull(event.date)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.statValue}>{event.time_label || "TBD"}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>People</Text>
                <Text style={styles.statValue}>{event.participants.length}</Text>
              </View>
            </View>
            <View style={[styles.summaryGrid, { marginTop: 10 }]}>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Contracts Sent</Text>
                <Text style={styles.statValue}>
                  {sentCount}/{event.participants.length}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Signed</Text>
                <Text style={styles.statValue}>
                  {signedCount}/{event.participants.length}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.label}>Forms Complete</Text>
                <Text style={styles.statValue}>
                  {completedForms}/{formAssignments.length || 0}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            {event.location || "Location TBD"} - Generated{" "}
            {fmtDateFull(new Date().toISOString())}
          </Text>
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.brand}>Casa Cross Events</Text>
            <Text style={styles.pageTitle}>{event.name}</Text>
          </View>
          <Text style={styles.footer}>Event Packet</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule & Location</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailCard}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.detailValue}>{fmtDateFull(event.date)}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.detailValue}>{event.time_label || "TBD"}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.detailValue}>{event.location || "TBD"}</Text>
            </View>
            <View style={styles.detailCard}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.detailValue}>{statusLabel(event.status)}</Text>
            </View>
          </View>
        </View>

        {brief && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Brief</Text>
            <Text style={styles.prose}>{brief}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Prep Items</Text>
          {openTasks.length === 0 ? (
            <Text style={styles.prose}>No open prep items.</Text>
          ) : (
            openTasks.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDue}>
                  {task.due ? `Due ${fmtDateFull(task.due)}` : "No due date"}
                </Text>
              </View>
            ))
          )}
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.brand}>Casa Cross Events</Text>
            <Text style={styles.pageTitle}>Roster</Text>
          </View>
          <Text style={styles.footer}>{event.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People, Roles & Requirements</Text>
          {participants.length === 0 ? (
            <Text style={styles.prose}>No participants added yet.</Text>
          ) : (
            participants.map((participant) => {
              const contract = contractsByParticipant.get(participant.id);
              const form = formsByParticipant.get(participant.id);
              const requiredFormTitle = formTitle(form);
              const contractStatus = contract
                ? contractDisplayStatus(contract)
                : participant.contract;
              const contact = [
                participant.person.email,
                participant.person.phone,
                participant.person.instagram,
              ]
                .filter(Boolean)
                .join(" - ");

              return (
                <View key={participant.id} style={styles.rosterRow} wrap={false}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {participant.person.initials || initials(participant.person.name)}
                    </Text>
                  </View>
                  <View style={styles.rosterBody}>
                    <View style={styles.rosterTop}>
                      <View>
                        <Text style={styles.personName}>{participant.person.name}</Text>
                        <Text style={styles.metaLine}>
                          {roleLabel(participant.role)}
                          {participant.person.specialty
                            ? ` - ${participant.person.specialty}`
                            : ""}
                        </Text>
                      </View>
                      <Text style={styles.pill}>
                        {statusLabel(contractStatus)}
                      </Text>
                    </View>
                    {contact && <Text style={styles.metaLine}>{contact}</Text>}
                    {participant.role_note && (
                      <Text style={styles.metaLine}>{participant.role_note}</Text>
                    )}
                    <View style={styles.statusGrid}>
                      <Text style={styles.statusText}>
                        Contract: {contract?.title || "No generated contract"} -{" "}
                        {statusLabel(contractStatus)}
                      </Text>
                      {requiredFormTitle && (
                        <Text style={styles.statusText}>
                          Form: {requiredFormTitle} -{" "}
                          {form?.completed_at ? "Complete" : form?.sent_at ? "Sent" : "Assigned"}
                        </Text>
                      )}
                      <Text style={styles.statusText}>
                        Rate: {fmtMoney(Number(participant.rate))} - Paid:{" "}
                        {fmtMoney(Number(participant.paid))}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </Page>

      {event.event_notes.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.headerRow} fixed>
            <View>
              <Text style={styles.brand}>Casa Cross Events</Text>
              <Text style={styles.pageTitle}>Internal Notes</Text>
            </View>
            <Text style={styles.footer}>{event.name}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Notes</Text>
            {event.event_notes.slice(0, 8).map((note) => (
              <View key={note.id} style={styles.note}>
                <Text style={styles.label}>{fmtDateFull(note.created_at)}</Text>
                <Text style={[styles.prose, { marginTop: 5 }]}>{note.body}</Text>
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
}
