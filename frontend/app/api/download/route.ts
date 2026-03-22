import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Proxy download requests to the FastAPI backend.
 * This makes downloads same-origin so the browser respects `a.download` filename.
 *
 * Usage: GET /api/download?path=/api/report/{session_id}/pdf
 */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") ?? "";
  if (!path) {
    return NextResponse.json({ error: "Missing path param" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}${path}`);
    const body = await res.arrayBuffer();

    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("Content-Type", ct);
    const cd = res.headers.get("content-disposition");
    if (cd) headers.set("Content-Disposition", cd);

    return new NextResponse(body, { status: res.status, headers });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}
