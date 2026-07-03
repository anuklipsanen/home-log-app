import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();

    // 🔑 luodaan session
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      return NextResponse.redirect(new URL("/login", url.origin));
    }

    // 🔒 tarkista onko sallittu käyttäjä
    const { data: allowedUser } = await supabase
      .from("allowed_users")
      .select("email")
      .eq("email", user.email)
      .single();

    if (!allowedUser) {
      // ❌ ei oikeuksia → logout
      await supabase.auth.signOut();

      return NextResponse.redirect(
        new URL("/login?error=not_allowed", url.origin)
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}