import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth if Supabase is not configured (dev mode without env vars)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login (except public routes).
  // /try and /essai are the conversion-funnel entry points: a public
  // project form that defers signup until *after* the user has invested
  // in describing their project. We deliberately keep these routes open
  // so the form is the very first thing prospects see.
  const publicRoutes = ["/", "/login", "/signup", "/pricing", "/try", "/essai", "/auth/callback"];
  // Public API routes (webhooks, cron jobs, ingestion, organic feed for Botato)
  const publicApiRoutes = ["/api/stripe/webhook", "/api/alerts", "/api/alerts/send", "/api/ingest", "/api/cron", "/api/stats", "/api/carousels"];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  ) ||
    request.nextUrl.pathname.startsWith("/auth/") ||
    request.nextUrl.pathname.startsWith("/legal/") ||
    publicApiRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
