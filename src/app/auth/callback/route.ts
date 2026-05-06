import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  return value?.startsWith("/") ? value : "/home";
}

function loginUrl(origin: string, next: string, error?: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("next", next);
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(requestUrl.searchParams.get("next"));
  const supabase = createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(loginUrl(origin, next, error.message));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(loginUrl(origin, next, error.message));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(loginUrl(origin, next));
}
