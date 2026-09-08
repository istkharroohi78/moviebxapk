import { Router, type IRouter } from "express";
import http from "http";
import { MovieModel, BotFileModel, AdminSettingModel, connectMongo } from "../../lib/mongodb";
import {
  ListMoviesQueryParams,
  GetMovieParams,
} from "@workspace/api-zod";

let _indexedOnlyCache: { value: boolean; ts: number } | null = null;

async function getIndexedOnlySetting(): Promise<boolean> {
  const now = Date.now();
  if (_indexedOnlyCache && now - _indexedOnlyCache.ts < 5_000) {
    return _indexedOnlyCache.value;
  }
  const doc = await AdminSettingModel.findOne({ key: "show_indexed_only" }).lean() as { value?: string } | null;
  const value = doc?.value === "1";
  _indexedOnlyCache = { value, ts: now };
  return value;
}

// Bot-indexed docs (via ia_filterdb.py) store the Telegram file_id as the MongoDB _id (a string).
// Enriched docs created by the web API or a separate indexer store fileId / file_id as regular fields.
// A Telegram file_id is a long base64 string — definitely not a 24-char hex MongoDB ObjectId.
function isTelegramFileId(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (/^[0-9a-f]{24}$/i.test(v)) return false; // MongoDB ObjectId — skip
  return v.length > 10;
}

// Handle Python None serialized as the string "None"
function sanitize(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "None" || s === "null" || s === "undefined" || s === "") return null;
  return s;
}

const QUALITY_RE = /\b(4K|2160p|1080p|720p|480p|360p|HDRip|BluRay|WEBRip|WEB-DL|HDTV|CAMRip|HEVC|DVDRip|DVDScr|HDCAM|HDTS)\b/i;
const LANG_RE = /\b(Hindi|English|Tamil|Telugu|Malayalam|Bengali|Punjabi|Kannada|Marathi|Gujarati|Urdu|Korean|Japanese|Chinese|French|Spanish)\b/i;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const AT_RE   = /@\w+/g;

function parseFilename(raw: string | null): {
  cleanTitle: string | null;
  parsedYear: number | null;
  parsedQuality: string | null;
  parsedLang: string | null;
} {
  if (!raw) return { cleanTitle: null, parsedYear: null, parsedQuality: null, parsedLang: null };
  let text = raw
    .replace(AT_RE, "")           // remove ALL @mentions anywhere
    .replace(/\[[^\]]*\]/g, " ")  // remove [bracketed content]
    .replace(/\([^)]*@[^)]*\)/g, " ") // remove (parens with @username)
    .replace(/\s+/g, " ")
    .trim();

  const ym = text.match(YEAR_RE);
  const parsedYear = ym ? parseInt(ym[0]) : null;
  const qm = text.match(QUALITY_RE);
  const parsedQuality = qm ? qm[0] : null;
  const lm = text.match(LANG_RE);
  const parsedLang = lm ? lm[0] : null;

  let cutAt = text.length;
  for (const m of [ym?.[0], qm?.[0]]) {
    if (!m) continue;
    let idx = text.indexOf(m);
    // Back up past any leading bracket/paren/space before the marker e.g. "(2024)"
    while (idx > 0 && /[\s([]/.test(text[idx - 1])) idx--;
    if (idx > 0 && idx < cutAt) cutAt = idx;
  }
  // Strip trailing punctuation, brackets, dashes that may remain after cut
  const cleanTitle = text.substring(0, cutAt).trim().replace(/[\s\-_.|()[\]]+$/, "").trim() || null;

  return { cleanTitle, parsedYear, parsedQuality, parsedLang };
}

function indexedOnlyFilter() {
  return {
    $or: [
      { fileId: { $nin: [null, ""] } },
      { file_id: { $nin: [null, ""] } },
      // Bot-indexed docs: _id IS the Telegram file_id (stored as MongoDB string type)
      { _id: { $type: "string" } },
    ],
  };
}

// Exclude docs that have no usable title AND no file_name to parse one from
const EMPTY_VALS = [null, "", "None", "null", "undefined"];
function hasTitleFilter() {
  return {
    $or: [
      { title: { $nin: EMPTY_VALS } },
      { file_name: { $nin: EMPTY_VALS } },
    ],
  };
}

const router: IRouter = Router();

// GET /stream/:fileId — proxy streaming request to bot's local aiohttp server.
// The bot handles /stream/fid/:fileId using the stored file_ref to reconstruct the
// Telegram FileId without needing message_id (works for all existing indexed docs).
router.get("/stream/:fileId", (req, res): void => {
  const fileId = req.params.fileId;
  const botPort = process.env.BOT_PORT ?? "8082";
  const botPath = `/stream/fid/${encodeURIComponent(fileId)}`;

  const proxyHeaders: Record<string, string> = {};
  if (req.headers.range) proxyHeaders["range"] = req.headers.range;

  const botReq = http.request(
    { hostname: "localhost", port: Number(botPort), path: botPath, method: "GET", headers: proxyHeaders },
    (botRes) => {
      const status = botRes.statusCode ?? 200;
      res.status(status);
      // Forward relevant headers from bot response
      const forward = ["content-type", "content-length", "content-range", "accept-ranges", "content-disposition"];
      for (const h of forward) {
        const v = botRes.headers[h];
        if (v) res.setHeader(h, v);
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      botRes.pipe(res);
    }
  );
  botReq.on("error", () => {
    if (!res.headersSent) res.status(503).json({ error: "Bot stream server unavailable" });
  });
  botReq.end();
});

// Helper to normalise a raw MongoDB doc into the API Movie shape
function toMovie(doc: Record<string, unknown>) {
  const rawId = doc._id;
  const id = String(rawId ?? doc.id);
  const fileIdFromId = isTelegramFileId(rawId) ? String(rawId) : null;
  const fileId = sanitize(doc.fileId) ?? sanitize(doc.file_id) ?? fileIdFromId;

  const rawTitle = sanitize(doc.title);
  const rawFileName = sanitize(doc.file_name);
  const { cleanTitle, parsedYear, parsedQuality, parsedLang } = parseFilename(rawFileName);

  // Build streaming URL:
  //   Primary: bot server with chat_id + message_id + file_unique_id (newly indexed files)
  //   Fallback: internal proxy /api/stream/:fileId → bot's /stream/fid/:fileId (all bot docs)
  const chatId = (doc.chat_id as number | null) ?? null;
  const msgId = (doc.message_id as number | null) ?? null;
  const fileUniqueId = sanitize(doc.file_unique_id);
  const botStreamBase = process.env.BOT_STREAM_URL ?? "";
  let streamUrl: string | null = null;
  if (botStreamBase && chatId && msgId && fileUniqueId && fileUniqueId.length >= 6) {
    const hash = fileUniqueId.substring(0, 6);
    streamUrl = `${botStreamBase}/stream/${chatId}/${hash}${msgId}`;
  } else if (fileId) {
    // Proxy through /api/stream/:fileId → bot local server at :8082/stream/fid/:fileId
    streamUrl = `/api/stream/${encodeURIComponent(fileId)}`;
  }

  return {
    id,
    title: rawTitle ?? cleanTitle ?? rawFileName ?? "Untitled",
    year: (doc.year as number | null) ?? parsedYear ?? null,
    genre: Array.isArray(doc.genre) ? (doc.genre as string[]) : [],
    language: sanitize(doc.language) ?? sanitize((doc.languages as string[] | null)?.[0]) ?? parsedLang ?? null,
    quality: sanitize(doc.quality) ?? parsedQuality ?? null,
    poster: sanitize(doc.poster) ?? null,
    backdrop: sanitize(doc.backdrop) ?? null,
    overview: sanitize(doc.overview) ?? null,
    rating: (doc.rating as number | null) ?? null,
    imdbId: sanitize(doc.imdbId) ?? null,
    fileId,
    streamUrl,
    fileSize: (doc.fileSize as number | null) ?? (doc.file_size as number | null) ?? null,
    caption: sanitize(doc.caption) ?? rawFileName ?? null,
    addedAt: (doc.addedAt as Date | null)?.toISOString?.() ?? new Date().toISOString(),
  };
}

// GET /settings — public settings (e.g. indexedOnly flag for the web player)
router.get("/settings", async (_req, res): Promise<void> => {
  await connectMongo();
  const indexedOnly = await getIndexedOnlySetting();
  res.json({ indexedOnly });
});

// GET /movies/find?title=… — find indexed movie by title (used by web player)
// Searches the enriched "Media" collection first, then the bot's raw file collection.
router.get("/movies/find", async (req, res): Promise<void> => {
  await connectMongo();
  const title = typeof req.query.title === "string" ? req.query.title : "";
  if (!title.trim()) {
    res.status(400).json({ error: "title required" });
    return;
  }

  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const titleRegex = { $regex: escaped, $options: "i" };

  // 1. Try the enriched Media collection first (has TMDB data + fileId)
  let doc = await MovieModel.findOne({
    $and: [
      { $or: [{ title: titleRegex }, { file_name: titleRegex }] },
      { $or: [{ fileId: { $nin: [null, ""] } }, { file_id: { $nin: [null, ""] } }] },
    ],
  }).lean() as Record<string, unknown> | null;

  // 2. Fall back to bot's raw file collection (ia_filterdb.py, _id = Telegram file_id)
  if (!doc) {
    const botDoc = await BotFileModel.findOne({
      file_name: titleRegex,
    }).lean() as Record<string, unknown> | null;
    if (botDoc) doc = botDoc;
  }

  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toMovie(doc));
});

// GET /movies
router.get("/movies", async (req, res): Promise<void> => {
  await connectMongo();

  const parsed = ListMoviesQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const { q, genre, language, quality } = params;
  const page = Number(params.page ?? 1);
  const limit = Math.min(Number(params.limit ?? 20), 50);
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  const indexedOnly = await getIndexedOnlySetting();
  if (indexedOnly) {
    Object.assign(filter, indexedOnlyFilter());
  }

  // Always exclude docs with no usable title (use $and to avoid clobbering $or)
  filter.$and = [...(filter.$and ?? []), hasTitleFilter()];

  if (q) {
    // Use regex on title + file_name — more reliable than $text for bot docs
    const qRe = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ title: qRe }, { file_name: qRe }];
  }
  if (genre) {
    filter.genre = { $in: [genre] };
  }
  if (language) {
    // Bot docs: language stored in field OR embedded in file_name
    const langRe = { $regex: language, $options: "i" };
    const langCond = {
      $or: [{ language: langRe }, { languages: langRe }, { file_name: langRe }],
    };
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, langCond];
      delete filter.$or;
    } else {
      Object.assign(filter, langCond);
    }
  }
  if (quality) {
    // Bot docs: quality stored in field OR embedded in file_name
    const qualRe = { $regex: quality, $options: "i" };
    filter.$and = [
      ...(filter.$and ?? []),
      { $or: [{ quality: qualRe }, { file_name: qualRe }] },
    ];
  }

  const [docs, total] = await Promise.all([
    BotFileModel.find(filter).sort({ addedAt: -1 }).skip(skip).limit(limit).lean(),
    BotFileModel.countDocuments(filter),
  ]);

  res.json({
    items: docs.map(toMovie),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// GET /movies/featured
router.get("/movies/featured", async (_req, res): Promise<void> => {
  await connectMongo();

  const indexedOnly = await getIndexedOnlySetting();
  // Use $and to combine filters safely — spreading two {$or:…} objects overwrites the key
  const baseFilter = indexedOnly
    ? { $and: [indexedOnlyFilter(), hasTitleFilter()] }
    : hasTitleFilter();

  const [latest, topRated] = await Promise.all([
    BotFileModel.find(baseFilter).sort({ addedAt: -1 }).limit(15).lean(),
    BotFileModel.find({ ...baseFilter, rating: { $ne: null } }).sort({ rating: -1 }).limit(15).lean(),
  ]);

  // "Trending" = random sample from last 100
  const recentPool = await BotFileModel.find(baseFilter).sort({ addedAt: -1 }).limit(100).lean();
  const trending = recentPool
    .sort(() => Math.random() - 0.5)
    .slice(0, 15);

  res.json({
    latest: latest.map(toMovie),
    trending: trending.map(toMovie),
    topRated: topRated.map(toMovie),
  });
});

// GET /movies/stats
router.get("/movies/stats", async (_req, res): Promise<void> => {
  await connectMongo();

  const indexedOnly = await getIndexedOnlySetting();
  const statsBaseFilter = indexedOnly
    ? { $and: [indexedOnlyFilter(), hasTitleFilter()] }
    : hasTitleFilter();
  const baseMatch = { $match: statsBaseFilter };

  const [total, genreAgg, languageAgg] = await Promise.all([
    BotFileModel.countDocuments(statsBaseFilter),
    BotFileModel.aggregate([
      baseMatch,
      { $unwind: { path: "$genre", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$genre", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]),
    BotFileModel.aggregate([
      baseMatch,
      { $match: { language: { $ne: null } } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]),
  ]);

  res.json({ total, genres: genreAgg, languages: languageAgg });
});

// GET /movies/:id  (must come AFTER /movies/featured and /movies/stats)
router.get("/movies/:id", async (req, res): Promise<void> => {
  await connectMongo();

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMovieParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid movie id" });
    return;
  }

  let doc;
  try {
    doc = await BotFileModel.findById(parsed.data.id).lean();
  } catch {
    doc = await BotFileModel.findOne({ imdbId: parsed.data.id }).lean();
  }

  if (!doc) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }

  res.json(toMovie(doc as Record<string, unknown>));
});

// GET /tmdb/search?q=… — server-side TMDB proxy (keeps API key secret)
router.get("/tmdb/search", async (req, res): Promise<void> => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!q) { res.status(400).json({ error: "q required" }); return; }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) { res.status(503).json({ error: "TMDB not configured" }); return; }

  try {
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(q)}&page=1`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { res.status(502).json({ error: "TMDB error" }); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await resp.json() as { results?: any[] };
    const results = (data.results ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => r.media_type === "movie" || r.media_type === "tv"
    );

    if (!results.length) { res.status(404).json({ error: "Not found" }); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const best = results[0] as any;
    res.json({
      id: best.id,
      type: best.media_type,
      title: best.title ?? best.name ?? "",
      poster_path: best.poster_path ?? null,
      backdrop_path: best.backdrop_path ?? null,
      release_date: best.release_date ?? best.first_air_date ?? null,
      vote_average: best.vote_average ?? null,
    });
  } catch {
    res.status(502).json({ error: "TMDB request failed" });
  }
});

// GET /genres
router.get("/genres", async (_req, res): Promise<void> => {
  await connectMongo();

  const indexedOnly = await getIndexedOnlySetting();
  const baseMatch = indexedOnly ? { $match: indexedOnlyFilter() } : { $match: {} };

  const agg = await MovieModel.aggregate([
    baseMatch,
    { $unwind: { path: "$genre", preserveNullAndEmptyArrays: false } },
    { $group: { _id: "$genre", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ]);

  res.json(agg);
});

// GET /languages
router.get("/languages", async (_req, res): Promise<void> => {
  await connectMongo();

  const indexedOnly = await getIndexedOnlySetting();
  const baseMatch = indexedOnly ? { $match: indexedOnlyFilter() } : { $match: {} };

  const agg = await MovieModel.aggregate([
    baseMatch,
    { $match: { language: { $ne: null } } },
    { $group: { _id: "$language" } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, name: "$_id" } },
  ]);

  res.json(agg.map((d: { name: string }) => d.name).filter(Boolean));
});

export default router;
