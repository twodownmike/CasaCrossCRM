import type { Person } from "@/lib/types";
import { deriveInitials } from "@/lib/format";

type Size = "sm" | "lg" | "xl";

export function Avatar({
  person,
  size,
}: {
  person: Pick<Person, "name" | "initials" | "tint" | "ink">;
  size?: Size;
}) {
  const cls = ["avatar"];
  if (size) cls.push(size);
  const initials =
    person.initials || deriveInitials(person.name || "");
  return (
    <span
      className={cls.join(" ")}
      style={{
        background: person.tint || "var(--hair-2)",
        color: person.ink || "var(--ink-2)",
      }}
    >
      {initials}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
}: {
  people: Array<Pick<Person, "id" | "name" | "initials" | "tint" | "ink">>;
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="avatar-stack">
      {shown.map((p) => (
        <Avatar key={p.id} person={p} size="sm" />
      ))}
      {extra > 0 && <span className="more">+{extra}</span>}
    </span>
  );
}
