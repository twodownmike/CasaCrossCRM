export type RoleKind =
  | "photographer"
  | "model"
  | "vendor"
  | "venue"
  | "hmua"
  | "stylist"
  | "sponsor";

export type EventStatus = "confirmed" | "planning" | "pending" | "wrapped";
export type PayStatus = "paid" | "partial" | "due" | "comp";
export type ContractStatus = "signed" | "sent" | "unsent";

export type Person = {
  id: string;
  name: string;
  role: RoleKind;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  location: string | null;
  bio: string | null;
  specialty: string | null;
  initials: string | null;
  tint: string | null;
  ink: string | null;
  joined_at: string | null;
};

export type EventRow = {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  date: string;
  time_label: string | null;
  cover: string | null;
  cover_image_url: string | null;
  venue_id: string | null;
  location: string | null;
  status: EventStatus;
  stage: string | null;
  capacity: number | null;
  tags: string[] | null;
  moodboard: string[] | null;
};

export type Participant = {
  id: string;
  event_id: string;
  person_id: string;
  role: RoleKind;
  role_note: string | null;
  rate: number;
  paid: number;
  status: PayStatus;
  contract: ContractStatus;
  due_date: string | null;
};

export type Task = {
  id: string;
  event_id: string | null;
  title: string;
  done: boolean;
  due: string | null;
};

export type Activity = {
  id: string;
  event_id: string | null;
  what: string;
  who: string | null;
  tone: string | null;
  occurred_at: string;
};

export type Message = {
  id: string;
  event_id: string;
  sender_id: string | null;
  sender_name: string | null;
  text: string;
  created_at: string;
};

export type Note = {
  id: string;
  person_id: string;
  body: string;
  created_at: string;
};

export const ROLE_META: Record<RoleKind, { label: string; plural: string }> = {
  photographer: { label: "Photographer", plural: "Photographers" },
  model: { label: "Model", plural: "Models" },
  vendor: { label: "Vendor", plural: "Vendors" },
  venue: { label: "Venue", plural: "Venues" },
  hmua: { label: "Hair & Makeup", plural: "Hair & Makeup" },
  stylist: { label: "Stylist", plural: "Stylists" },
  sponsor: { label: "Sponsor", plural: "Sponsors" },
};

export const ROLE_ORDER: RoleKind[] = [
  "venue",
  "photographer",
  "model",
  "hmua",
  "stylist",
  "vendor",
  "sponsor",
];

export const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  planning: "Planning",
  pending: "Pending",
  wrapped: "Wrapped",
  paid: "Paid",
  partial: "Partial",
  due: "Due",
  comp: "Comp",
  signed: "Signed",
  sent: "Sent",
  unsent: "Unsent",
};
