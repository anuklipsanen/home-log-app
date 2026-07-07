import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { parseActivityFile } from "@/lib/sports/parseActivityFile";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  try {
    // 📦 FormData
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId") as string | null;
    const titleInput = formData.get("title") as string | null;
    const notesInput = formData.get("notes") as string | null;

    if (!file || !memberId) {
      return NextResponse.json(
        { error: "Tiedosto tai henkilö puuttuu" },
        { status: 400 }
      );
    }

    // 🔄 buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 🧠 parse
    const parsed = await parseActivityFile({
      buffer,
      filename: file.name,
    });

    // 👤 hae jäsen
    const { data: member } = await supabase
      .from("household_members")
      .select("name")
      .eq("id", memberId)
      .single();

    // 💾 tallenna activity
    const { data: activity, error: activityError } = await supabase
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
      return NextResponse.json(
        { error: activityError?.message ?? "Insert failed" },
        { status: 500 }
      );
    }

    // 🗓️ event
    await supabase.from("events").insert({
      title: `${member?.name ?? "Urheilu"} – ${titleInput || "Urheilusuoritus"}`,

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

    return NextResponse.json({
      success: true,
      activity,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Virhe" },
      { status: 500 }
    );
  }
}

function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}