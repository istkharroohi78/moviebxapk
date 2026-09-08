import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE, getAdminCredentials } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const { email } = getAdminCredentials();
  return NextResponse.json({ authenticated: true, email });
}
