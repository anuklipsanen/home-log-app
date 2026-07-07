import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { parseActivityFile } from "@/lib/sports/parseActivityFile";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    // 📦 1. FormData
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId") as string | null;

    if (!file || !memberId) {
      return NextResponse.json(
        { error: "Tiedosto tai henkilö puuttuu" },
        { status: 400 }
      );
    }

    // 🔄 2. Muunna bufferiksi
    const buffer = Buffer.from(await file.arrayBuffer());

    // 🧠 3. Parsitaan tiedosto
    const parsed = await parseActivityFile({
      buffer,
      filename: file.name,
    });

    // 👤 4. Hae jäsenen nimi
    const { data: member } = await supabase
      .from("household_members")
      .select("name")
      .eq("id", memberId)
      .single();

    // 💾 5. Tallenna sport_activities
    const { data: activity, error: activityError } = await supabase
      .from("sport_activities")
      .insert({
        member_id: memberId,

        activity_type: parsed.activityType,
        activity_sub_type: parsed.activitySubType,

        title: parsed.title,

        notes_imported: parsed.notesImported ?? null,
        notes: null,

        start_time: parsed.startTime,
        end_time: parsed.endTime ?? null,

        duration_seconds: Math.round(parsed.durationSeconds ?? 0),

        distance_meters: parsed.distanceMeters
          ? Math.round(parsed.distanceMeters)
          : null,

        calories: parsed.calories ?? null,

        avg_heart_rate: parsed.avgHeartRate ?? null,
        max_heart_rate: parsed.maxHeartRate ?? null,

        elevation_gain_meters: parsed.elevationGainMeters ?? null,

        file_type: parsed.fileType,
        original_filename: file.name,
      })
      .select()
      .single();

    if (activityError || !activity) {
      console.error("ACTIVITY ERROR:", activityError);
      return NextResponse.json(
        { error: activityError?.message ?? "Activity insert failed" },
        { status: 500 }
      );
    }

    // 🗓️ 6. Luo events-tapahtuma
    const { error: eventError } = await supabase.from("events").insert({
      title: `${member?.name ?? "Urheilu"} – Urheilusuoritus`,

      start_time: parsed.startTime,
      end_time: parsed.endTime ?? null,

      source_type: "sport",
      sport_activity_id: activity.id,

      description: [
        parsed.distanceMeters
          ? `${(parsed.distanceMeters / 1000).toFixed(1)} km`
          : null,

        parsed.durationSeconds
          ? formatDuration(parsed.durationSeconds)
          : null,

        parsed.avgHeartRate
          ? `keskisyke ${parsed.avgHeartRate}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });

    if (eventError) {
      console.error("EVENT ERROR:", eventError);
    }

    // ✅ 7. Palauta onnistuminen
    return NextResponse.json({
      success: true,
      activity,
    });

  } catch (err: any) {
    console.error("IMPORT ERROR:", err);

    return NextResponse.json(
      { error: err.message ?? "Tuntematon virhe" },
      { status: 500 }
    );
  }
}

// ⏱️ Ajan formatointi
function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}