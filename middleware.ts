import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  // Check auth for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth",
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/reset-password", // ✅ Add this
    "/auth/debug",          // ✅ Add this  
    "/auth/admin",          // ✅ Add this
    "/auth/diagnose",       // ✅ Add this
    "/",
    "/images",
    "/favicon.ico",
    "/_next",
    "/.well-known", // Add this for browser dev tools
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  console.log("🔍 Middleware running on:", request.nextUrl.pathname);

  if (isPublicRoute) {
    console.log("✅ Public route detected:", request.nextUrl.pathname);
    return response;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("🚫 No user found, redirecting to auth from:", request.nextUrl.pathname);
    const redirectUrl = new URL("/auth", request.url); // ✅ Change to /auth instead of /auth/login
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  console.log("✅ User authenticated:", user.email);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that handle their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
