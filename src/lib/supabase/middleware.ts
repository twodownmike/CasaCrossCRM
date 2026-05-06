import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hostFromUrl(value?: string) {
  if (!value) return "";
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

function redirectToHost(request: NextRequest, host: string) {
  const url = request.nextUrl.clone();
  url.host = host;
  url.protocol = "https:";
  return NextResponse.redirect(url);
}

function isPortalNext(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  return next?.startsWith("/portal") ?? false;
}

function domainRedirect(request: NextRequest) {
  const crmHost = hostFromUrl(process.env.NEXT_PUBLIC_CRM_URL);
  const portalHost = hostFromUrl(
    process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_EVENTS_URL,
  );
  if (!crmHost || !portalHost || crmHost === portalHost) return null;

  const currentHost = request.nextUrl.host;
  const { pathname } = request.nextUrl;
  const isClientPath =
    pathname.startsWith("/apply") ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/f/") ||
    pathname.startsWith("/sign/") ||
    pathname.startsWith("/portal") ||
    (pathname === "/login" && isPortalNext(request)) ||
    (pathname.startsWith("/auth") && isPortalNext(request));
  const isInternalPath =
    pathname === "/" ||
    pathname.startsWith("/home") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/forms") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/account") ||
    (pathname === "/login" && !isPortalNext(request)) ||
    (pathname.startsWith("/auth") && !isPortalNext(request));

  if (currentHost === crmHost && isClientPath) {
    return redirectToHost(request, portalHost);
  }
  if (currentHost === portalHost && isInternalPath) {
    return redirectToHost(request, crmHost);
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  const hostRedirect = domainRedirect(request);
  if (hostRedirect) return hostRedirect;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/e/") ||
    pathname.startsWith("/f/") ||
    pathname.startsWith("/sign/") ||
    pathname.startsWith("/portal/signup");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next?.startsWith("/") ? next : "/home";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    pathname.startsWith("/portal") &&
    !pathname.startsWith("/portal/setup") &&
    !pathname.startsWith("/portal/signup")
  ) {
    const { data: portalUser } = await supabase
      .from("portal_users")
      .select("setup_completed_at")
      .eq("active", true)
      .limit(1)
      .maybeSingle();
    if (portalUser && !portalUser.setup_completed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/setup";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
