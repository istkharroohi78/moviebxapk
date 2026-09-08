import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/adminAuth";

const SENSITIVE_KEYS = [
  "MONGODB_URI", "API_HASH", "TELEGRAM_BOT_TOKEN", "TMDB_API_KEY",
  "ADMIN_PASSWORD", "ADMIN_SECRET", "API_ID", "NEXTAUTH_SECRET",
];

function maskValue(key: string, value: string): string {
  const isSensitive = SENSITIVE_KEYS.some((s) => key.toUpperCase().includes(s));
  if (!isSensitive) return value;
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••••••" + value.slice(-4);
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const SKIP = ["NODE_PATH", "npm_config_cache", "npm_execpath"];
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (SKIP.includes(key) || !value) continue;
    env[key] = maskValue(key, value);
  }

  return NextResponse.json(env);
}
