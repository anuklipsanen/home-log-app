import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    let memberId: string | null = null;
    let titleInput: string | null = null;
    let notesInput: string | null = null;
    let parsed: any;

    // 🔥 JSON flow (preview → save)
    if (req.headers.get("content-type")?.includes("application/json")) {
      const body = await req.json();

      memberId = body.memberId;
      titleInput = body.title;
      notesInput = body.notes;
      parsed = body.parsed;

    } else {
      // fallback (vanha tapa)
      const formData = await req.formData();

      const file = formData.get("file") as File | null;
      memberId = formData.get("memberId") as string | null;

      if (!file || !memberId) {
        return NextResponse.json(
          { error: "Tiedosto tai henkilö puuttuu" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const { parseActivityFile } = await import("@/lib/sports/parseActivityFile");

      parsed = await parseActivityFile({
        buffer,
        filename: file.name,
      });
    }

    if (!memberId || !parsed) {
      return NextResponse.json(
        { error: "Virheellinen data" },
        { status: 400 }
      );
    }

    const duration = Math.round(parsed.durationSeconds ?? 0);

    // 🔍 DUPLIKAATTICHECK
    const { data: existing } = await supabase
      .from("sport_activities")
      .select("id")
      .eq("member_id", memberId)
      .eq("start_time", parsed.startTime)
      .eq("duration_seconds", duration)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: "Tämä suoritus on jo tuotu",
      });
    }

    const { data: member } = await supabase
      .from("household_members")
      .select("name")
      .eq("id", memberId)
      .single();

    const { data: activity, error } = await supabase
      .from("sport_activities")
      .insert({
        member_id: memberId,

        activity_type: parsed.activityType,
        activity_sub_type: parsed.activitySubType,

        title: titleInput || parsed.title,
        notes_imported: parsed.notesImported ?? null,
        notes: notesInput || null,

        start_time: parsed.startTime,
        end_time: parsed.endTime ?? null,

        duration_seconds: duration,
        distance_meters: parsed.distanceMeters
          ? Math.round(parsed.distanceMeters)
          : null,

        calories: parsed.calories ?? null,
        avg_heart_rate: parsed.avgHeartRate ?? null,
        max_heart_rate: parsed.maxHeartRate ?? null,
        elevation_gain_meters: parsed.elevationGainMeters ?? null,
      })
      .select()
      .single();

    if (error || !activity) {
      return NextResponse.json(
        { error: error?.message ?? "Insert failed" },
        { status: 500 }
      );
    }

    await supabase.from("events").insert({
      title: `${member?.name ?? "Urheilu"} – ${titleInput || "Urheilusuoritus"}`,
      start_time: parsed.startTime,
      end_time: parsed.endTime ?? null,
      source_type: "sport",
      sport_activity_id: activity.id,
    });

    return NextResponse.json({
      success: true,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Virhe" },
      { status: 500 }
    );
  }
}