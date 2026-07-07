import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { normalizeSportType } from "@/lib/normalizeSportType";
import { getSportType } from "@/lib/sportTypes";

/* 🔥 helper */
function formatDuration(seconds?: number) {
  if (!seconds) return "";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h === 0) {
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();

    const { memberId, title, notes, parsed } = body;

    if (!memberId || !parsed) {
      return NextResponse.json({
        success: false,
        error: "Puuttuva data",
      });
    }

    /* ---------------- NORMALISOINTI ---------------- */

    const activityType = normalizeSportType(parsed.activityType);
    const sport = getSportType(activityType);

    /* ---------------- INSERT SPORT ACTIVITY ---------------- */

    const { data: activity, error } = await supabase
      .from("sport_activities")
      .insert({
        member_id: memberId,

        activity_type: activityType,
        activity_sub_type: parsed.activitySubType ?? null,

        title: title || parsed.title || sport.label,

        notes: notes || null,
        notes_imported: parsed.notesImported ?? null,

        duration_seconds: Math.round(parsed.durationSeconds ?? 0),

        distance_meters: parsed.distanceMeters
          ? Math.round(parsed.distanceMeters)
          : null,

        calories: parsed.calories ?? null,

        avg_heart_rate: parsed.avgHeartRate ?? null,
        max_heart_rate: parsed.maxHeartRate ?? null,

        elevation_gain_meters: parsed.elevationGainMeters ?? null,

        file_type: parsed.fileType,
        original_filename: parsed.fileName ?? null,
      })
      .select()
      .single();

    if (error || !activity) {
      return NextResponse.json({
        success: false,
        error: error?.message || "Insert failed",
      });
    }

    /* ---------------- CREATE EVENT ---------------- */

    const description = [
      parsed.distanceMeters
        ? `${(parsed.distanceMeters / 1000).toFixed(1)} km`
        : null,

      parsed.durationSeconds
        ? formatDuration(parsed.durationSeconds)
        : null,

      parsed.calories ? `${parsed.calories} kcal` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const { error: eventError } = await supabase.from("events").insert({
  title: `${sport.emoji} ${title || sport.label}`,

  // 🔥 TÄMÄ ON KRIITTINEN
  event_date: parsed.startTime.slice(0, 10),
  date: parsed.startTime.slice(0, 10),

  description,

  source_type: "sport",
  sport_activity_id: activity.id,

  // 🔥 ettei RLS tai NOT NULL kaada
  usage_place: "muu",
  maintenance_type: "muu",
    });

    if (eventError) {
  console.error("Event insert error:", eventError);

  return NextResponse.json({
    success: false,
    error: "Event insert failed: " + eventError.message,
  });
}

    /* ---------------- DONE ---------------- */

    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}