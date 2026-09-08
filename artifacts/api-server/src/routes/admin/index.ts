import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createHmac } from "crypto";
import { MovieModel, AdminSettingModel, connectMongo } from "../../lib/mongodb";

const router: IRouter = Router();

const COOKIE_NAME = "fw_admin_tok";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@filmywave.com",
    password: process.env.ADMIN_PASSWORD ?? "admin123",
    secret: process.env.ADMIN_SECRET ?? "fw-default-admin-secret",
  };
}

function computeToken(): string {
  const { email, password, secret } = getAdminCredentials();
  return createHmac("sha256", secret).update(`${email}::${password}`).digest("hex");
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const expected = computeToken();
  const fromHeader = req.headers["x-admin-token"] as string | undefined;
  const fromCookie = (req as any).cookies?.[COOKIE_NAME] as string | undefined;
  if ((fromHeader && fromHeader === expected) || (fromCookie && fromCookie === expected)) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

// ── POST /api/admin/login ──────────────────────────────────────────────────
router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  const creds = getAdminCredentials();
  if (!email || !password || email !== creds.email || password !== creds.password) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = computeToken();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  res.json({ ok: true });
});

// ── GET /api/admin/session ─────────────────────────────────────────────────
router.get("/admin/session", (req: Request, res: Response): void => {
  const expected = computeToken();
  const fromCookie = (req as any).cookies?.[COOKIE_NAME] as string | undefined;
  const fromHeader = req.headers["x-admin-token"] as string | undefined;
  if ((fromCookie && fromCookie === expected) || (fromHeader && fromHeader === expected)) {
    res.json({ ok: true });
    return;
  }
  res.status(401).json({ ok: false, error: "Not authenticated" });
});

// ── POST /api/admin/logout ─────────────────────────────────────────────────
router.post("/admin/logout", (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  await connectMongo();
  const [total, genreAgg, langAgg] = await Promise.all([
    MovieModel.countDocuments({}),
    MovieModel.aggregate([
      { $unwind: { path: "$genre", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    MovieModel.aggregate([
      { $match: { language: { $nin: [null, ""] } } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);
  res.json({
    total,
    genres: genreAgg.map((g: any) => ({ name: g._id, count: g.count })),
    languages: langAgg.map((l: any) => ({ name: l._id, count: l.count })),
  });
});

// ── GET /api/admin/env ─────────────────────────────────────────────────────
const SENSITIVE = ["TOKEN", "SECRET", "KEY", "HASH", "PASSWORD", "URI", "MONGO", "API_ID", "API_HASH"];

function maskValue(key: string, val: string): string {
  const isSensitive = SENSITIVE.some((p) => key.toUpperCase().includes(p));
  if (!isSensitive || !val) return val;
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••••••" + val.slice(-4);
}

router.get("/admin/env", requireAdmin, (_req: Request, res: Response): void => {
  const safeKeys = [
    "NODE_ENV", "PORT", "BASE_PATH",
    "ADMIN_EMAIL",
    "NEXT_PUBLIC_SITE_NAME", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BOT_USERNAME",
    "NEXT_PUBLIC_CONTACT_EMAIL", "NEXT_PUBLIC_TWITTER_HANDLE", "NEXT_PUBLIC_TAGLINE",
    "NEXT_PUBLIC_SITE_DESCRIPTION", "NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_OLD_DOMAIN",
    "NEXT_PUBLIC_DOWNLOAD_PROXY_URL", "NEXT_PUBLIC_LOGO_PATH", "NEXT_PUBLIC_GSC_VERIFICATION",
    "MONGODB_URI", "TMDB_API_KEY",
    "TELEGRAM_BOT_TOKEN", "API_ID", "API_HASH",
    "INDEX_CHANNELS", "ADMINS", "BOT_NAME", "WEBSITE_URL", "FORCE_SUB_CHANNEL",
    "AUTO_FILTER", "MAX_RESULTS", "SPELL_CHECK", "CUSTOM_CAPTION",
    "ADMIN_SECRET", "ADMIN_PASSWORD", "INTERNAL_API_URL",
    "VITE_BOT_USERNAME",
  ];
  const out: Record<string, string> = {};
  for (const k of safeKeys) {
    if (process.env[k] !== undefined) {
      out[k] = maskValue(k, process.env[k]!);
    }
  }
  res.json(out);
});

// ── GET /api/admin/movies ──────────────────────────────────────────────────
router.get("/admin/movies", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await connectMongo();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const q = (req.query.q as string | undefined)?.trim();

  const filter: any = {};
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { file_name: { $regex: q, $options: "i" } },
    ];
  }

  const [total, items] = await Promise.all([
    MovieModel.countDocuments(filter),
    MovieModel.find(filter)
      .sort({ addedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title year language quality rating poster genre addedAt _id")
      .lean(),
  ]);

  res.json({
    items: items.map((m: any) => ({
      id: m._id.toString(),
      title: m.title ?? "Untitled",
      year: m.year ?? null,
      language: m.language ?? null,
      quality: m.quality ?? null,
      rating: m.rating ?? null,
      poster: m.poster ?? null,
      genre: Array.isArray(m.genre) ? m.genre : [],
      addedAt: m.addedAt ?? null,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// ── GET /api/admin/settings ────────────────────────────────────────────────
router.get("/admin/settings", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  await connectMongo();
  const docs = await AdminSettingModel.find({}).lean();
  const result: Record<string, string> = {};
  for (const doc of docs) {
    result[(doc as { key: string; value: string }).key] = (doc as { key: string; value: string }).value;
  }
  res.json(result);
});

// ── POST /api/admin/settings ───────────────────────────────────────────────
router.post("/admin/settings", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await connectMongo();
  const entries: { key: string; value: string }[] = req.body;
  if (!Array.isArray(entries)) {
    res.status(400).json({ error: "Expected array of {key, value}" });
    return;
  }
  await Promise.all(
    entries.map(({ key, value }) =>
      AdminSettingModel.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      )
    )
  );
  res.json({ ok: true, saved: entries.length });
});

// ── DELETE /api/admin/movies/:id ───────────────────────────────────────────
router.delete("/admin/movies/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  await connectMongo();
  const { id } = req.params;
  let result;
  try {
    result = await MovieModel.findByIdAndDelete(id);
  } catch {
    res.status(400).json({ error: "Invalid movie ID" });
    return;
  }
  if (!result) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
