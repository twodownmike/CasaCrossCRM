import Link from "next/link";

export default function NotFound() {
  return (
    <div className="phone-frame">
      <div className="empty" style={{ marginTop: 80 }}>
        <h3>Not found</h3>
        <div style={{ marginBottom: 18 }}>
          That page didn&apos;t exist, or it was removed.
        </div>
        <Link href="/home" className="btn primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
