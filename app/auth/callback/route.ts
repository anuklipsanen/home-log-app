import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(error);
      return NextResponse.redirect(
        new URL("/login?error=session", request.url)
      );
    }
  }

  const res = NextResponse.redirect(new URL("/", request.url));
  res.headers.set("Cache-Control", "no-store");

  return res;
}