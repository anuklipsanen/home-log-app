import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { parseActivityFile } from "@/lib/sports/parseActivityFile";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Tiedosto puuttuu" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const results = [];

    for (const entry of entries) {
      if (!entry.entryName.endsWith(".fit")) continue;

      const fileBuffer = entry.getData();

      try {
        const parsed = await parseActivityFile({
          buffer: fileBuffer,
          filename: entry.entryName,
        });

        results.push(parsed);
      } catch (err) {
        console.log("Parse error:", entry.entryName);
      }
    }

    return NextResponse.json({
      success: true,
      activities: results,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Virhe" },
      { status: 500 }
    );
  }
}