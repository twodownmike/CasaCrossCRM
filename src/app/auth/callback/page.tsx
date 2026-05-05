"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

function Exchange() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const nextParam = searchParams.get("next");
    const next = nextParam?.startsWith("/") ? nextParam : "/home";
    const supabase = createClient();

    async function exchange() {
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        if (error) {
          router.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
        } else {
          router.replace(next);
        }
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
        } else {
          router.replace(next);
        }
        return;
      }

      router.replace("/login");
    }

    exchange();
  }, []);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <Exchange />
    </Suspense>
  );
}
