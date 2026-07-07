import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("sport_activities")
    .select(`
  id,
  title,
  notes,
  start_time,
  duration_seconds,
  distance_meters,
  calories,              -- 🔥 LISÄTTY
  avg_heart_rate,
  member_id,
  household_members(name)
`)
    .order("start_time", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    activities: data,
  });
}