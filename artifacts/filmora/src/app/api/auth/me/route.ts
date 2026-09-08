import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, readSessionToken } from "@/lib/authServer";
import { getUser } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const session = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ user: null });

  const stored = await getUser(session.email);
  return NextResponse.json({
    user: {
      email: session.email,
      name: stored?.name ?? session.name,
      picture: stored?.picture ?? session.picture,
      memberSince: stored?.createdAt ?? null,
    },
  });
}
