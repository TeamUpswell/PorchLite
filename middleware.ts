import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  console.log("🔍 Middleware running on:", pathname);

  // Define public routes that don't need authentication
  const publicRoutes = [
    "/",
    "/auth",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/login",
    "/signup",
    "/.well-known",
    "/images",
    "/favicon.ico",
    "/_next",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    console.log("✅ Public route detected:", pathname);
    return res;
  }

  // For protected routes, check authentication
  console.log("🔒 Protected route detected:", pathname);

  const supabase = createMiddlewareClient({ req: request, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("🔑 Session check result:", !!session);

  if (!session) {
    console.log("❌ No session, redirecting to auth");
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  console.log("✅ Session valid, allowing access");

  // If attempting to access the problematic route
  if (request.nextUrl.pathname === "/properties/create") {
    // Redirect to a temporary page that explains
    return NextResponse.redirect(new URL("/account/properties", request.url));
  }

  // Continue processing other routes
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};