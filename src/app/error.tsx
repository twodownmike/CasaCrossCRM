"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="phone-frame">
      <div className="empty" style={{ marginTop: 80 }}>
        <h3>Something broke</h3>
        <div style={{ marginBottom: 18 }}>{error.message}</div>
        <button className="btn primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
