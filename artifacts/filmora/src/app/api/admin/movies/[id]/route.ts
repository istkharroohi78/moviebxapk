import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, computeAdminToken, ADMIN_COOKIE } from "@/lib/adminAuth";

const API_BASE = process.env.INTERNAL_API_URL ?? "http://localhost:80/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/admin/movies/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": computeAdminToken() },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
