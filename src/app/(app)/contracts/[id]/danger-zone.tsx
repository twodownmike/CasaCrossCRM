"use client";

import { useState, useTransition } from "react";
import { deleteContract, voidContract } from "@/app/contracts-actions";

/**
 * Read-only contracts (signed / void) still need a way to be voided
 * or deleted. Both flows require a double-confirm — Yes/No prompt
 * AND typing "DELETE" / "VOID" — because deleting a signed agreement
 * removes the audit artifact and can't be undone.
 */
export function DangerZone({
  id,
  status,
}: {
  id: string;
  status: "signed" | "sent" | "draft" | "void";
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function doVoid() {
    if (
      !confirm(
        "Void this contract? It will no longer be considered valid. The signed artifact stays on file.",
      )
    )
      return;
    const typed = window.prompt(
      'Type VOID (in caps) to confirm:',
      "",
    );
    if (typed?.trim() !== "VOID") {
      setMsg("Void cancelled — confirmation didn't match.");
      return;
    }
    const f = new FormData();
    f.set("id", id);
    start(async () => {
      await voidContract(f);
    });
  }

  function doDelete() {
    const isSigned = status === "signed";
    const warning = isSigned
      ? "Delete this SIGNED contract permanently? This destroys the signature audit trail and can't be undone. Consider voiding instead."
      : "Delete this contract permanently? The participant's contract status will reset to 'unsent'.";
    if (!confirm(warning)) return;
    const typed = window.prompt(
      'To confirm, type DELETE (in caps):',
      "",
    );
    if (typed?.trim() !== "DELETE") {
      setMsg("Delete cancelled — confirmation didn't match.");
      return;
    }
    const f = new FormData();
    f.set("id", id);
    start(async () => {
      await deleteContract(f);
    });
  }

  return (
    <div>
      <div
        className="muted"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 10,
          color: "var(--terracotta)",
        }}
      >
        Danger zone
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {status !== "void" && (
          <button
            type="button"
            className="btn"
            onClick={doVoid}
            disabled={pending}
            style={{ color: "var(--terracotta)" }}
          >
            Void
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={doDelete}
          disabled={pending}
          style={{ color: "var(--terracotta)" }}
        >
          {status === "signed" ? "Delete signed contract" : "Delete"}
        </button>
      </div>
      {msg && (
        <div className="notice warn" style={{ marginTop: 10 }}>
          {msg}
        </div>
      )}
      {status === "signed" && (
        <p
          className="muted"
          style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}
        >
          Deleting a signed contract removes the signature image, name,
          IP, and timestamp permanently. <strong>Void</strong> keeps the
          artifact for the record but flags it invalid.
        </p>
      )}
    </div>
  );
}
