import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const pin = process.env.ACCESS_PIN;

  // No PIN configured — open access
  if (!pin) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = await request.json();
    if (body.pin === pin) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "Wrong PIN" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
