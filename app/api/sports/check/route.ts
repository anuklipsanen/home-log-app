import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const { memberId, startTime, duration } = await req.json();

  const { data } = await supabase
    .from("sport_activities")
    .select("id")
    .eq("member_id", memberId)
    .eq("start_time", startTime)
    .eq("duration_seconds", duration)
    .maybeSingle();

  return NextResponse.json({
    exists: !!data,
  });
}