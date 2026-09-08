import { NextRequest, NextResponse } from "next/server";
import { computeAdminToken, getAdminCredentials, ADMIN_COOKIE, COOKIE_MAX_AGE } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const creds = getAdminCredentials();

    if (email !== creds.email || password !== creds.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = computeAdminToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
