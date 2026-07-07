import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({
      success: false,
      error: "Missing id",
    });
  }

  // 🔥 poista myös event
  await supabase
    .from("events")
    .delete()
    .eq("sport_activity_id", id);

  const { error } = await supabase
    .from("sport_activities")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }

  return NextResponse.json({ success: true });
}