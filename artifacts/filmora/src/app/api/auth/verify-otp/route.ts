import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_S,
  createSessionToken,
  isValidEmail,
  verifyOtp,
} from "@/lib/authServer";
import { upsertUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !isValidEmail(email) || !code) {
      return NextResponse.json({ error: "Enter your email and the 6-digit code." }, { status: 400 });
    }

    const result = verifyOtp(email, String(code).trim());
    if (result === "expired") return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    if (result === "too_many") return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
    if (result === "invalid") return NextResponse.json({ error: "Wrong code. Please check and try again." }, { status: 400 });

    const name = String(email).split("@")[0].replace(/[._-]+/g, " ");
    const user = await upsertUser({ email: String(email).toLowerCase(), name });

    const res = NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name, picture: user.picture },
    });
    res.cookies.set(SESSION_COOKIE, createSessionToken({ email: user.email, name: user.name, picture: user.picture }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_S,
    });
    return res;
  } catch (err) {
    console.error("verify-otp failed", err);
    return NextResponse.json({ error: "Could not verify the code. Please try again." }, { status: 500 });
  }
}
