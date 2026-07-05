import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const cookieStore = await cookies();

  let response = NextResponse.redirect(
    new URL("/", request.url)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            path: "/",
            sameSite: "lax",
            secure: true,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: "",
            path: "/",
            sameSite: "lax",
            secure: true,
            ...options,
          });
        },
      },
    }
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("SESSION ERROR:", error);

    if (error) {
      return NextResponse.redirect(
        new URL("/login?error=session", request.url)
      );
    }
  }

  response.headers.set("Cache-Control", "no-store");

  return response;
}