import { NextResponse } from "next/server";
import { parseActivityFile } from "@/lib/sports/parseActivityFile";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tiedosto puuttuu" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parsed = await parseActivityFile({
      buffer,
      filename: file.name,
    });

    return NextResponse.json({
      success: true,
      parsed,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Virhe" },
      { status: 500 }
    );
  }
}