"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signContract } from "@/app/contracts-actions";

export function SignPad({ token }: { token: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set up high-DPI canvas
    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a1814";
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function moveStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!(e.buttons & 1) && e.pointerType === "mouse") return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  }
  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function clear() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Type your full legal name.");
      return;
    }
    if (!hasInk) {
      setError("Please draw your signature in the box.");
      return;
    }
    if (!agreed) {
      setError("Tap the agreement checkbox to confirm.");
      return;
    }
    const c = canvasRef.current;
    if (!c) return;
    const dataUrl = c.toDataURL("image/png");

    const f = new FormData();
    f.set("token", token);
    f.set("signed_name", name.trim());
    f.set("signature_url", dataUrl);

    start(async () => {
      const r = await signContract(f);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="sign-block">
      <div className="form-grid">
        <div>
          <label className="form-label">Type your full legal name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full legal name"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="form-label">Draw your signature</label>
          <div className="sign-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="sign-canvas"
              onPointerDown={startStroke}
              onPointerMove={moveStroke}
              onPointerUp={endStroke}
              onPointerLeave={endStroke}
            />
            {!hasInk && <div className="sign-canvas-hint">Sign here</div>}
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="cancel-link"
              onClick={clear}
              disabled={!hasInk}
            >
              Clear
            </button>
          </div>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: 12,
            border: "1px solid var(--hair)",
            borderRadius: "var(--r-2)",
            background: "var(--paper)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45 }}>
            I have read this agreement, the typed name above is my legal name,
            and I intend the drawn signature to bind me to this contract.
          </span>
        </label>

        {error && <div className="notice warn">{error}</div>}

        <button className="btn primary block" type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Sign and submit"}
        </button>
      </div>
    </form>
  );
}
