import Link from "next/link";
import { Icon } from "@/components/icons";
import { EventForm } from "../[id]/edit/event-form";

export default function NewEventPage() {
  return (
    <div className="fade-in">
      <header className="app-header">
        <Link className="icon-btn" href="/events">
          <Icon.back />
        </Link>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          New event
        </div>
        <div style={{ width: 36 }} />
      </header>
      <div className="page-head">
        <div className="eyebrow">Studio</div>
        <h1>
          Create <em>shoot</em>
        </h1>
        <div className="sub">A new styled photoshoot event.</div>
      </div>
      <div style={{ padding: "0 var(--s-5) var(--s-7)" }}>
        <EventForm />
      </div>
    </div>
  );
}
