import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, "", options);
        },
      },
    }
  );

  // 🔥 TÄRKEÄ: tämä päivittää session cookiet oikein
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  const publicRoutes = ["/login", "/auth/callback"];

  const isPublic = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // 🔒 Ei kirjautunut → login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🔁 Kirjautunut → pois loginista
  if (isLoggedIn && req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

// 🔥 TÄRKEÄ: älä koske _next assetteihin
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*).*)",
  ],
};