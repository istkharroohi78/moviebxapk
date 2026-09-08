import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, computeAdminToken, ADMIN_COOKIE } from "@/lib/adminAuth";

const API_BASE = process.env.INTERNAL_API_URL ?? "http://localhost:80/api";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: { "x-admin-token": computeAdminToken() },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": computeAdminToken(),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
