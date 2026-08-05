"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { signOpenContract } from "@/app/contracts-actions";
import { mdToHtml, fillSignerName } from "@/lib/contracts";
import { fmtMoney } from "@/lib/format";

/**
 * Signing flow for open (shared-link) contracts: the visitor types their
 * own name — which fills into the contract body live — plus their email,
 * then draws a signature. The link stays open for the next signer.
 */
export function OpenSignFlow({
  token,
  bodyMd,
  paymentRequired,
  paymentAmount,
  studioVenmoUrl,
  studioName,
}: {
  token: string;
  bodyMd: string;
  paymentRequired: boolean;
  paymentAmount: number | null;
  studioVenmoUrl: string | null;
  studioName: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInk, setHasInk] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const hasBody = bodyMd.trim() !== "";
  const filledHtml = useMemo(
    () => (hasBody ? mdToHtml(fillSignerName(bodyMd, name)) : ""),
    [bodyMd, name, hasBody],
  );

  useEffect(() => {
    if (done) return;
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
  }, [done]);

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
    if (!email.trim()) {
      setError("Enter your email address.");
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
    f.set("signer_email", email.trim());
    f.set("signature_url", dataUrl);

    start(async () => {
      const r = await signOpenContract(f);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <>
        <div className="sign-block signed">
          <div className="eyebrow">Signed</div>
          <div className="sign-strip">
            <div>
              <div className="sign-name">{name.trim()}</div>
              <div className="sign-when">
                Thanks — your signature is on file. You can close this page.
              </div>
            </div>
          </div>
        </div>
        {paymentRequired && studioVenmoUrl && (
          <div
            className="sign-block"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--hair)",
              textAlign: "center",
              padding: 28,
            }}
          >
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              One last thing
            </div>
            <h2
              style={{
                margin: "0 0 6px",
                fontFamily: "var(--serif-display)",
                fontWeight: 400,
                fontSize: 28,
                letterSpacing: "-0.01em",
              }}
            >
              Send your payment
            </h2>
            {paymentAmount != null && (
              <div
                className="money"
                style={{ fontSize: 36, margin: "10px 0 6px" }}
              >
                {fmtMoney(Number(paymentAmount))}
              </div>
            )}
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                margin: "0 0 22px",
                color: "var(--ink-3)",
                fontFamily: "var(--serif)",
              }}
            >
              Pay {studioName || "Casa Cross Events"} via Venmo to confirm
              your booking.
            </p>
            <a
              className="btn primary"
              href={studioVenmoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#3D95CE",
                borderColor: "#3D95CE",
                padding: "14px 28px",
                fontSize: 15,
              }}
            >
              Pay with Venmo
            </a>
            <p
              className="muted"
              style={{ fontSize: 11, marginTop: 16, lineHeight: 1.5 }}
            >
              Opens venmo.com — please include the event name in the note so
              we can match it to your booking.
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {hasBody && (
        <div
          className="sign-body"
          dangerouslySetInnerHTML={{ __html: filledHtml }}
        />
      )}

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
            <p
              className="muted"
              style={{ fontSize: 11, marginTop: 6, lineHeight: 1.4 }}
            >
              Your name fills into the agreement above as you type.
            </p>
          </div>

          <div>
            <label className="form-label">Your email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
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
            <div
              style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}
            >
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
              I have read this agreement, the typed name above is my legal
              name, and I intend the drawn signature to bind me to this
              contract.
            </span>
          </label>

          {error && <div className="notice warn">{error}</div>}

          <button className="btn primary block" type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Sign and submit"}
          </button>
        </div>
      </form>
    </>
  );
}
