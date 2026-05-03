import { listPeople } from "@/lib/queries";
import { ROLE_META, ROLE_ORDER, type RoleKind, type Person } from "@/lib/types";
import { PeopleSearch } from "./people-search";
import { PeopleTabs } from "./people-tabs";
import { Avatar } from "@/components/avatar";
import { RolePill } from "@/components/pill";
import { Icon } from "@/components/icons";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string };
}) {
  const role = (searchParams.role as RoleKind) || "all";
  const q = (searchParams.q || "").toLowerCase();
  const all = await listPeople();

  let list = all;
  if (role !== ("all" as RoleKind)) list = list.filter((p) => p.role === role);
  if (q)
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q),
    );

  const grouped: Partial<Record<RoleKind, Person[]>> = {};
  list.forEach((p) => {
    (grouped[p.role] ||= []).push(p);
  });

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-text">
          <div className="eyebrow">Roster</div>
          <h1>
            The <em>people</em>
          </h1>
          <div className="sub">
            {all.length} contacts across {Object.keys(ROLE_META).length} roles
          </div>
        </div>
        <div className="page-head-actions">
          <Link href="/people/new" className="btn primary">
            <Icon.plus /> Add person
          </Link>
        </div>
      </div>

      <PeopleSearch initialQ={searchParams.q || ""} role={role} />

      <PeopleTabs role={role} q={searchParams.q || ""} />

      {role === ("all" as RoleKind) ? (
        <>
          {ROLE_ORDER.filter((r) => grouped[r]).map((r) => (
            <div key={r}>
              <div className="section-label" style={{ marginTop: 24 }}>
                <h2>{ROLE_META[r].plural}</h2>
                <span className="muted" style={{ fontSize: 12 }}>
                  {grouped[r]!.length}
                </span>
              </div>
              <div style={{ padding: "0 var(--s-5)" }}>
                <div className="card elev">
                  {grouped[r]!.map((p) => (
                    <PersonRow key={p.id} person={p} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ padding: "16px var(--s-5)" }}>
          <div className="card elev">
            {list.map((p) => (
              <PersonRow key={p.id} person={p} />
            ))}
          </div>
        </div>
      )}

      {list.length === 0 && (
        <div className="empty">
          <h3>No matches</h3>
          <div>Try a different search.</div>
        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

function PersonRow({ person }: { person: Person }) {
  const subtitle = person.specialty || person.bio || person.location;
  return (
    <Link
      href={`/people/${person.id}`}
      className="card-row"
      style={{ alignItems: "flex-start", paddingTop: 14, paddingBottom: 14 }}
    >
      <Avatar person={person} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
            {person.name}
          </span>
          <RolePill role={person.role} />
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--ink-3)",
              marginTop: 4,
              lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {subtitle}
          </div>
        )}
        {(person.specialty || person.bio) && person.location && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--ink-4)",
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon.pin />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {person.location}
            </span>
          </div>
        )}
      </div>
      <Icon.chev style={{ color: "var(--ink-4)", marginTop: 8 }} />
    </Link>
  );
}
