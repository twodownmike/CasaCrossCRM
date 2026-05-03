"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastCtx = (message: string) => void;

const Ctx = createContext<ToastCtx>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);

  const push = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 1900);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className={`toast ${msg ? "show" : ""}`}>{msg}</div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
