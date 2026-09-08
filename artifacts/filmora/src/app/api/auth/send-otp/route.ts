import { NextResponse } from "next/server";
import { canResend, generateOtp, isValidEmail, saveOtp } from "@/lib/authServer";
import { siteConfig } from "@/lib/config";
import { verifyHumanChallenge } from "@/lib/humanCheck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function otpEmailHtml(code: string) {
  return `
  <div style="background:#0b0b0d;padding:32px 0;font-family:'Segoe UI',Roboto,Arial,sans-serif">
    <div style="max-width:460px;margin:0 auto;background:#141418;border:1px solid #24242c;border-radius:20px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#FF3D3D,#FF8A00);padding:22px 26px">
        <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px">MOVIE BOX</div>
        <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.85);margin-top:4px">by Beta Bot Hub</div>
      </div>
      <div style="padding:28px 26px;color:#e9e9ee">
        <h2 style="margin:0 0 8px;font-size:18px">Your login code</h2>
        <p style="margin:0 0 20px;font-size:13px;color:#9c9caa">Use this one-time code to sign in to MOVIE BOX. It expires in 10 minutes.</p>
        <div style="text-align:center;font-size:34px;font-weight:900;letter-spacing:12px;color:#FFB020;background:#1d1d24;border:1px solid #2c2c36;border-radius:14px;padding:16px 0">${code}</div>
        <p style="margin:20px 0 0;font-size:12px;color:#71717f">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const { email, humanToken, humanAnswer } = await req.json();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!verifyHumanChallenge(humanToken, humanAnswer)) {
      return NextResponse.json(
        { error: "Human verification failed. Please solve the addition again." },
        { status: 400 }
      );
    }
    if (!canResend(email)) {
      return NextResponse.json({ error: "Please wait a moment before requesting a new code." }, { status: 429 });
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      return NextResponse.json(
        { error: "Email login is not configured yet. Set GMAIL_USER and GMAIL_APP_PASSWORD." },
        { status: 500 }
      );
    }

    const code = generateOtp();
    saveOtp(email, code);

    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${siteConfig.name}" <${user}>`,
      to: email,
      subject: `${code} is your ${siteConfig.name} login code`,
      text: `Your ${siteConfig.name} login code is ${code}. It expires in 10 minutes.`,
      html: otpEmailHtml(code),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp failed", err);
    return NextResponse.json({ error: "Could not send the code. Please try again." }, { status: 500 });
  }
}
