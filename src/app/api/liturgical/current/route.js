import { NextResponse } from "next/server";
import { getLiturgicalInfo } from "@/lib/LiturgicalCalendarService";

export async function GET() {
  try {
    const currentDate = new Date();
    const liturgicalInfo = getLiturgicalInfo(currentDate);

    return NextResponse.json(liturgicalInfo);
  } catch (e) {
    console.error("Error in GET /api/liturgical/current:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
