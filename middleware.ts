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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicRoutes = ["/login", "/auth/callback"];

  const isPublic = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // 🔥 1. Salli aina public routes
  if (isPublic) {
    return response;
  }

  // 🔥 2. TÄRKEIN FIX:
  // Salli request läpi jos user ei vielä ole valmis (callback jälkeen)
  if (!user) {
    return response;
  }

  // 🔥 3. allowed_users check vasta kun user olemassa
  let isAllowed = false;

  if (user.email) {
    const { data } = await supabase
      .from("allowed_users")
      .select("email")
      .eq("email", user.email)
      .maybeSingle();

    isAllowed = !!data;
  }

  // ❌ ei sallittu käyttäjä
  if (!isAllowed) {
    return NextResponse.redirect(
      new URL("/login?error=not-allowed", req.url)
    );
  }

  // 🔁 jos kirjautunut ja menee login-sivulle → ohjaa pois
  if (req.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*).*)",
  ],
};