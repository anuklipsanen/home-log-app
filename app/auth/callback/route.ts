import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set(name, value, options) {
          response.cookies.set(name, value, options);
        },
        remove(name, options) {
          response.cookies.set(name, "", options);
        },
      },
    }
  );

  if (code) {
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      return NextResponse.redirect(new URL("/login", url.origin));
    }

    // 🔒 allowed_users check
    const { data: allowedUser } = await supabase
      .from("allowed_users")
      .select("email")
      .eq("email", user.email)
      .single();

    if (!allowedUser) {
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL("/login?error=not_allowed", url.origin)
      );
    }
  }

  return response;
}