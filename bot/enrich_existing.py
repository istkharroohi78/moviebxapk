"""
Background enrichment script — fills poster/backdrop/rating/overview for all
existing bot docs that have no TMDB data. Run once from the bot directory:

    cd bot && python3 enrich_existing.py

TMDB free-tier rate limit: 40 requests / 10 s.  The script automatically
throttles to stay within that limit.
"""
import asyncio
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    from tmdb_helper import get_movie_info, TMDB_API_KEY
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run:  pip install motor pymongo")
    sys.exit(1)

MONGODB_URI      = os.environ.get("MONGODB_URI", "")
COLLECTION_NAME  = os.environ.get("COLLECTION_NAME", "test")
DB_NAME          = "test"

# Regexes (same as ia_filterdb.enrich_with_tmdb)
_AT_RE      = re.compile(r"@\w+")
_YEAR_RE    = re.compile(r"(?<!\d)(19|20)\d{2}(?!\d)")
_QUALITY_RE = re.compile(
    r"\b(4k|2160p|1080p|720p|480p|360p|hdrip|bluray|webrip|web[\-. ]?dl|hevc|x265|x264|dvdrip)\b",
    re.IGNORECASE,
)
_SE_RE      = re.compile(r"\bS\d{1,2}E\d{1,2}\b", re.IGNORECASE)

BATCH     = 40   # requests per window
WINDOW    = 11   # seconds per window (slight buffer over 10 s)


def clean_title(file_name: str) -> tuple[str, int | None]:
    """Strip channel tags, quality keywords, etc. Return (clean_title, year)."""
    t = _AT_RE.sub("", file_name).strip()
    t = re.sub(r"[\[\]\(\)\{\}]", " ", t).strip()

    # Strip season/episode marker — TV show title is before S01E01
    se_m = _SE_RE.search(t)
    if se_m:
        t = t[: se_m.start()].strip()

    year_m = _YEAR_RE.search(t)
    year   = int(year_m.group(0)) if year_m else None
    if year_m:
        t = t[: year_m.start()].strip()

    qual_m = _QUALITY_RE.search(t)
    if qual_m:
        t = t[: qual_m.start()].strip()

    t = re.sub(r"[\s\-_.|]+$", "", t).strip()
    return t, year


async def enrich_doc(col, doc: dict) -> bool:
    """Fetch TMDB data and update the document. Returns True on success."""
    file_id  = doc["_id"]
    raw_name = doc.get("file_name") or doc.get("title") or ""
    if not raw_name:
        return False

    title, year = clean_title(raw_name)
    if len(title) < 2:
        return False

    try:
        info = await get_movie_info(title, year)
    except Exception:
        return False

    if not info:
        return False

    update: dict = {}
    if info.get("poster_path"):
        update["poster"]   = info["poster_path"]
    if info.get("backdrop_path"):
        update["backdrop"] = info["backdrop_path"]
    if info.get("rating"):
        try:
            update["rating"] = float(info["rating"])
        except (ValueError, TypeError):
            pass
    if info.get("plot"):
        update["overview"] = info["plot"]
    elif info.get("overview"):
        update["overview"] = info["overview"]
    if info.get("title"):
        update["title"] = info["title"]
    if info.get("year"):
        update["year"] = info["year"]
    if info.get("tmdb_id"):
        update["tmdbId"] = int(info["tmdb_id"])
    if info.get("genres"):
        update["genre"] = [g.strip() for g in info["genres"].split(",") if g.strip()]
    if info.get("media_type"):
        update["mediaType"] = info["media_type"]

    if update:
        await col.update_one({"_id": file_id}, {"$set": update})
        return True
    return False


async def main() -> None:
    if not MONGODB_URI:
        print("ERROR: MONGODB_URI env var not set.")
        sys.exit(1)
    if not TMDB_API_KEY:
        print("ERROR: TMDB_API_KEY env var not set.")
        sys.exit(1)

    client = AsyncIOMotorClient(MONGODB_URI)
    col    = client[DB_NAME][COLLECTION_NAME]

    # Only process docs with no poster yet
    query  = {"$or": [{"poster": None}, {"poster": {"$exists": False}}, {"poster": ""}]}
    total  = await col.count_documents(query)
    print(f"Found {total} docs without TMDB poster data. Starting enrichment…\n")

    if total == 0:
        print("Nothing to do!")
        client.close()
        return

    processed = 0
    enriched  = 0
    window_start = time.monotonic()
    window_count = 0

    cursor = col.find(query, {"_id": 1, "file_name": 1, "title": 1})
    async for doc in cursor:
        # Rate-limit: max BATCH requests per WINDOW seconds
        if window_count >= BATCH:
            elapsed = time.monotonic() - window_start
            if elapsed < WINDOW:
                await asyncio.sleep(WINDOW - elapsed)
            window_start = time.monotonic()
            window_count = 0

        ok = await enrich_doc(col, doc)
        window_count += 1
        processed   += 1
        if ok:
            enriched += 1

        title_preview = (doc.get("file_name") or doc.get("title") or "")[:50]
        symbol = "✓" if ok else "–"
        print(f"[{processed:>5}/{total}] {symbol}  {title_preview}")

    print(f"\n✅  Done — enriched {enriched} / {total} docs.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
