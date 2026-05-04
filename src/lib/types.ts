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
export type ContractStatus = "signed" | "sent" | "unsent" | "na";

export type Person = {
  id: string;
  name: string;
  legal_name: string | null;
  preferred_name: string | null;
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
  is_public: boolean | null;
  public_slug: string | null;
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

export type EventNote = {
  id: string;
  event_id: string;
  body: string;
  created_at: string;
  created_by: string | null;
};

export type MoodImage = {
  id: string;
  event_id: string;
  url: string;
  caption: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  event_id: string;
  description: string;
  category: string | null;
  amount: number;
  vendor_id: string | null;
  vendor_name: string | null;
  spent_at: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
};

export const EXPENSE_CATEGORIES = [
  "Venue",
  "Props",
  "Supplies",
  "Food & drink",
  "Travel",
  "Equipment rental",
  "Marketing",
  "Other",
] as const;

export type ContractDocStatus = "draft" | "sent" | "signed" | "void";

export type ContractTemplate = {
  id: string;
  name: string;
  description: string | null;
  body_md: string;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Contract = {
  id: string;
  event_id: string;
  participant_id: string;
  template_id: string | null;
  title: string;
  body_md: string;
  pdf_url: string | null;
  status: ContractDocStatus;
  share_token: string;
  sent_at: string | null;
  signed_at: string | null;
  signature_url: string | null;
  signed_name: string | null;
  signer_ip: string | null;
  signer_ua: string | null;
  payment_required: boolean;
  payment_amount: number | null;
  created_at: string;
};

export type ContractTokenView = {
  id: string;
  title: string;
  body_md: string;
  pdf_url: string | null;
  status: ContractDocStatus;
  sent_at: string | null;
  signed_at: string | null;
  signature_url: string | null;
  signed_name: string | null;
  event_name: string;
  event_date: string;
  event_location: string | null;
  recipient_name: string;
  payment_required: boolean;
  payment_amount: number | null;
  studio_venmo_url: string | null;
  studio_name: string | null;
};

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

export type FormRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_published: boolean;
  thank_you_message: string | null;
  created_at: string;
  updated_at: string;
};

export type FormField = {
  id: string;
  form_id: string;
  position: number;
  field_key: string;
  label: string;
  type: FormFieldType;
  options: string[] | null;
  required: boolean;
  placeholder: string | null;
  helper: string | null;
};

export type FormResponse = {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  created_at: string;
};

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Short text",
  email: "Email",
  phone: "Phone",
  url: "Website / URL",
  number: "Number",
  date: "Date",
  textarea: "Long text",
  select: "Dropdown",
  checkbox: "Checkbox",
};

export type SubmissionStatus = "pending" | "reviewing" | "invited" | "approved" | "archived";

export type Submission = {
  id: string;
  role: RoleKind;
  name: string;
  legal_name: string | null;
  preferred_name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  location: string | null;
  specialty: string | null;
  portfolio_url: string | null;
  message: string | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  converted_person_id: string | null;
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
  na: "N/A",
};
