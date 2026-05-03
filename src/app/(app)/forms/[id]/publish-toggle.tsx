"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateFormMeta } from "@/app/forms-actions";

export function PublishToggle({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    const f = new FormData();
    f.set("id", id);
    f.set("is_published", isPublished ? "off" : "on");
    start(async () => {
      await updateFormMeta(f);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="card elev"
      onClick={toggle}
      disabled={pending}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        textAlign: "left",
        cursor: pending ? "wait" : "pointer",
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          {isPublished ? "Form is live" : "Form is a draft"}
        </div>
        <div
          style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}
        >
          {isPublished
            ? "Anyone with the link can submit responses."
            : "Toggle on to start collecting responses."}
        </div>
      </div>
      <span
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          background: isPublished ? "var(--sage)" : "var(--hair)",
          position: "relative",
          flexShrink: 0,
          transition: "background 150ms",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: isPublished ? 20 : 2,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "white",
            transition: "left 150ms",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </span>
    </button>
  );
}
