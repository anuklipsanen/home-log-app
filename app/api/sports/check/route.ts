import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const { memberId, startTime, duration } = await req.json();

    if (!memberId || !startTime) {
      return NextResponse.json(
        { error: "Puuttuvat tiedot" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sport_activities")
      .select("id, title, notes") // 🔥 TÄRKEÄ
      .eq("member_id", memberId)
      .eq("start_time", startTime)
      .eq("duration_seconds", duration)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!data,
      activity: data || null, // 🔥 TÄRKEÄ
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Virhe" },
      { status: 500 }
    );
  }
}