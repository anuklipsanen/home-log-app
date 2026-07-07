import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    const {
  id,
  title,
  notes,
  distance_meters,
  duration_seconds,
  calories,
  activity_type,
} = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID puuttuu" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sport_activities")
      .update({
        title,
        notes,
        distance_meters,
        duration_seconds,
        calories,
        activity_type,
      })
      .eq("id", id);

    if (error) {
      console.log("UPDATE ERROR:", error); // 🔥 DEBUG
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Virhe" },
      { status: 500 }
    );
  }
}