import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { normalizeSportType } from "@/lib/normalizeSportType";
import { getSportType } from "@/lib/sportTypes";
import { detectSportType } from "@/lib/detectSportType";

/* ---------------- HELPERS ---------------- */

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

/* ---------------- ROUTE ---------------- */

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

    const { memberId, title, notes, parsed, activity_type } = body;

    if (!memberId || !parsed) {
      return NextResponse.json({
        success: false,
        error: "Puuttuva data",
      });
    }

    /* ---------------- START TIME ---------------- */

    const startTime =
      parsed.startTime ||
      parsed.start_time ||
      parsed.timestamp ||
      null;

    if (!startTime) {
      return NextResponse.json({
        success: false,
        error: "Start time puuttuu tiedostosta",
      });
    }

    const eventDate = new Date(startTime)
      .toISOString()
      .slice(0, 10);

    /* ---------------- ACTIVITY TYPE ---------------- */

    // PRIORITEETTI:
    // 1. UI valinta
    // 2. detect
    // 3. parsed fallback
    // 4. other

    const finalType =
      activity_type ||
      detectSportType(parsed) ||
      normalizeSportType(parsed.activityType) ||
      "other";

    const sport = getSportType(finalType);

    /* ---------------- INSERT SPORT ACTIVITY ---------------- */

    const { data: activity, error } = await supabase
      .from("sport_activities")
      .insert({
        member_id: memberId,

        // 🔥 TÄMÄ ON KRIITTINEN KORJAUS
        activity_type: finalType,
        activity_sub_type: finalType,

        title: title || parsed.title || sport.label,

        notes: notes || null,
        notes_imported: parsed.notesImported ?? null,

        start_time: startTime,
        end_time: parsed.endTime ?? null,

        duration_seconds: Math.round(parsed.durationSeconds ?? 0),

        distance_meters: parsed.distanceMeters
          ? Math.round(parsed.distanceMeters)
          : null,

        calories: parsed.calories ?? null,

        avg_heart_rate: parsed.avgHeartRate ?? null,
        max_heart_rate: parsed.maxHeartRate ?? null,

        elevation_gain_meters:
          parsed.elevationGainMeters ?? null,

        file_type: parsed.fileType,
        original_filename: parsed.fileName ?? null,
      })
      .select()
      .single();

    if (error || !activity) {
      return NextResponse.json({
        success: false,
        error: error?.message || "Sport insert failed",
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

      parsed.calories
        ? `${parsed.calories} kcal`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const { error: eventError } = await supabase.from("events").insert({
      // 🔥 EI "Urheilusuoritus" enää
      title: title || sport.label,

      description: `${sport.emoji} ${title || sport.label} ${
        description ? "· " + description : ""
      }`,

      event_date: eventDate,
      date: eventDate,

      source_type: "sport",
      sport_activity_id: activity.id,

      usage_place: "muu",
      maintenance_type: "muu",
    });

    if (eventError) {
      console.error("EVENT ERROR:", eventError);

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
    console.error("IMPORT ERROR:", err);

    return NextResponse.json({
      success: false,
      error: err.message,
    });
  }
}