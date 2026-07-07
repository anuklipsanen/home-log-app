import { XMLParser } from "fast-xml-parser";
import FitParser from "fit-file-parser";

export type ParsedActivity = {
  title: string;
  activityType?: string | null;
  activitySubType?: string | null;
  notesImported?: string | null;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  distanceMeters?: number;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  elevationGainMeters?: number;
  fileType: "fit" | "gpx" | "tcx";
  rawData: unknown;
};

export async function parseActivityFile({
  buffer,
  filename,
}: {
  buffer: Buffer;
  filename: string;
}): Promise<ParsedActivity> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "fit") return parseFit(buffer);
  if (ext === "gpx") return parseGpx(buffer);
  if (ext === "tcx") return parseTcx(buffer);

  throw new Error("Tiedostotyyppiä ei tueta. Käytä FIT-, GPX- tai TCX-tiedostoa.");
}

function parseFit(buffer: Buffer): Promise<ParsedActivity> {
  return new Promise((resolve, reject) => {
    const fitParser = new FitParser({
      force: true,
      speedUnit: "m/s",
      lengthUnit: "m",
      temperatureUnit: "celsius",
      elapsedRecordField: true,
      mode: "both",
    });

    const arrayBuffer = buffer.buffer.slice(
  buffer.byteOffset,
  buffer.byteOffset + buffer.byteLength
) as ArrayBuffer;

fitParser.parse(arrayBuffer, (error: string | undefined, data: any) => {
  if (error) return reject(new Error(error));

      const session = Array.isArray(data.sessions)
        ? data.sessions[0]
        : data.sessions;

      const records = Array.isArray(data.records) ? data.records : [];

      const startTime =
        session?.start_time ??
        records[0]?.timestamp ??
        new Date().toISOString();

      const durationSeconds =
        session?.total_timer_time ??
        session?.total_elapsed_time ??
        undefined;

      const endTime =
        durationSeconds && startTime
          ? new Date(new Date(startTime).getTime() + durationSeconds * 1000).toISOString()
          : undefined;

      resolve({
        title: "Urheilusuoritus",
        activityType: session?.sport ?? null,
        activitySubType: session?.sub_sport ?? null,
        notesImported: session?.description ?? null,
        startTime: new Date(startTime).toISOString(),
        endTime,
        durationSeconds,
        distanceMeters: session?.total_distance,
        calories: session?.total_calories,
        avgHeartRate: session?.avg_heart_rate,
        maxHeartRate: session?.max_heart_rate,
        elevationGainMeters: session?.total_ascent,
        fileType: "fit",
        rawData: {
          sessions: data.sessions,
          laps: data.laps,
          records: records.slice(0, 500),
        },
      });
    });
  });
}

function parseGpx(buffer: Buffer): ParsedActivity {
  const xml = buffer.toString("utf-8");
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml);

  const trk = data.gpx?.trk;
  const name = trk?.name ?? "Urheilusuoritus";

  const points = trk?.trkseg?.trkpt ?? [];
  const pointArray = Array.isArray(points) ? points : [points];

  const firstPoint = pointArray[0];
  const lastPoint = pointArray[pointArray.length - 1];

  return {
    title: name,
    activityType: "sport",
    activitySubType: null,
    notesImported: trk?.desc ?? trk?.cmt ?? null,
    startTime: firstPoint?.time ?? new Date().toISOString(),
    endTime: lastPoint?.time,
    fileType: "gpx",
    rawData: data,
  };
}

function parseTcx(buffer: Buffer): ParsedActivity {
  const xml = buffer.toString("utf-8");
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml);

  const activity = data.TrainingCenterDatabase?.Activities?.Activity;
  const lap = Array.isArray(activity?.Lap) ? activity.Lap[0] : activity?.Lap;

  return {
    title: "Urheilusuoritus",
    activityType: activity?.["@_Sport"] ?? null,
    activitySubType: null,
    notesImported: activity?.Notes ?? null,
    startTime: activity?.Id ?? new Date().toISOString(),
    durationSeconds: Number(lap?.TotalTimeSeconds) || undefined,
    distanceMeters: Number(lap?.DistanceMeters) || undefined,
    calories: Number(lap?.Calories) || undefined,
    avgHeartRate: Number(lap?.AverageHeartRateBpm?.Value) || undefined,
    maxHeartRate: Number(lap?.MaximumHeartRateBpm?.Value) || undefined,
    fileType: "tcx",
    rawData: data,
  };
}