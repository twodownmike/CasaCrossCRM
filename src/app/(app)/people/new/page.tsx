import Link from "next/link";
import { Icon } from "@/components/icons";
import { PersonForm } from "../[id]/edit/person-form";

export default function NewPersonPage() {
  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/people">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          New contact
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="eyebrow">Roster</div>
        <h1>
          Add a <em>person</em>
        </h1>
        <div className="sub">A vendor, photographer, model, or partner.</div>
      </div>
      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <PersonForm />
      </div>
    </div>
  );
}
