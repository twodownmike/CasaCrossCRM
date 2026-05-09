import type { RoleKind } from "@/lib/types";
import { ROLE_META, STATUS_LABEL } from "@/lib/types";

const STATUS_CLASS: Record<string, string> = {
  confirmed: "confirmed",
  planning: "planning",
  pending: "pending",
  wrapped: "wrapped",
  paid: "confirmed",
  partial: "planning",
  due: "warn",
  comp: "wrapped",
  signed: "confirmed",
  opened: "planning",
  sent: "planning",
  unsent: "warn",
  na: "wrapped",
};

export function StatusPill({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const cls = STATUS_CLASS[status] || "pending";
  return (
    <span className={`pill ${cls}`}>
      <span className="dot" />
      {label || STATUS_LABEL[status] || status}
    </span>
  );
}

export function RolePill({ role }: { role: RoleKind }) {
  return (
    <span className={`pill role-${role}`}>{ROLE_META[role]?.label || role}</span>
  );
}
