import { NextResponse } from "next/server";
import { parseActivityFile } from "@/lib/sports/parseActivityFile";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const memberId = formData.get("memberId");

    if (!file) {
      return NextResponse.json(
        { error: "Tiedosto puuttuu" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parsed = await parseActivityFile({
      buffer,
      filename: file.name,
    });

    console.log("PARSED DATA:", parsed);

    return NextResponse.json({
      success: true,
      parsed,
    });

  } catch (err: any) {
    console.error("IMPORT ERROR:", err);

    return NextResponse.json(
      { error: err.message ?? "Tuntematon virhe" },
      { status: 500 }
    );
  }
}