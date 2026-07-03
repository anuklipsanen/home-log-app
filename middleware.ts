import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/auth/callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    pathname.startsWith("/api/auth");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const hasSupabaseSession = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") &&
        cookie.name.includes("auth-token")
    );

  if (!hasSupabaseSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};