# Filmora

A cinematic dark-mode movie streaming and discovery platform synced with a Telegram bot. Movies are indexed from Telegram channels by a Python bot, enriched with TMDB metadata, and displayed on the web app.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/filmora run dev` — run the React web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `cd bot && python3 bot.py` — run the Telegram bot (requires Python 3.11+)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React + Vite + Tailwind CSS v4 + Framer Motion
- API: Express 5 + Mongoose (MongoDB)
- DB: MongoDB (shared between Node API and Python bot)
- Bot: Python 3.11 + Pyrogram (Telegram MTProto)
- TMDB API: movie enrichment (posters, ratings, genres)
- Build: esbuild (API), Vite (frontend)
- Deployment: Docker + Supervisor (runs API + bot together)

## Where things live

- `artifacts/filmora/` — React web app (cinematic movie browser)
- `artifacts/api-server/` — Express API server (connects to MongoDB)
- `artifacts/api-server/src/lib/mongodb.ts` — MongoDB connection + Movie model
- `artifacts/api-server/src/routes/movies/` — movie/genre/language API routes
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `bot/bot.py` — Telegram bot entry point
- `bot/database.py` — MongoDB operations (shared schema with API server)
- `bot/config.py` — bot configuration via env vars
- `bot/imdb_helper.py` — TMDB enrichment helper
- `bot/utils.py` — file name parsing, quality/language detection
- `Dockerfile` — multi-stage Docker build (Node API + Python bot)
- `docker/supervisord.conf` — runs API server + bot together

## Architecture decisions

- Both the Node.js API and Python bot share the same MongoDB collection (`Media`) — bot writes, API reads
- Movie metadata (TMDB poster, backdrop, rating, genres) is fetched at index time by the bot and stored in MongoDB
- File links use Telegram's `send_cached_media` via bot deep links (`/start file_<file_id>`)
- The API does not use Drizzle/PostgreSQL — all data is in MongoDB via Mongoose
- Docker deployment uses Supervisor to run both services in one container

## Bot Setup

Copy `bot/.env.example` to `bot/.env` and fill in:

```
API_ID=           # from my.telegram.org
API_HASH=         # from my.telegram.org
TELEGRAM_BOT_TOKEN=   # from @BotFather
MONGODB_URI=      # already set as secret
TMDB_API_KEY=     # already set as secret
INDEX_CHANNELS=   # comma-separated channel IDs (e.g. -1001234567890)
ADMINS=           # your Telegram user ID
WEBSITE_URL=      # your deployed site URL
```

Run: `cd bot && pip install -r requirements.txt && python3 bot.py`

Admin commands in Telegram:
- `/index -100XXXXXXXXX` — index all files from a channel
- `/stats` — show total files and users
- `/broadcast` — broadcast message to all users

## Product

- **Home page** — cinematic hero + Latest/Trending/Top Rated carousels
- **Movies page** — full grid with genre/language/quality filters + pagination
- **Movie detail** — TMDB backdrop, poster, rating, download/stream via Telegram
- **Genres page** — browse by genre with counts
- **Search** — instant search across all indexed movies

## Gotchas

- Bot requires `API_ID` + `API_HASH` (Pyrogram needs MTProto credentials, not just a bot token). Get from https://my.telegram.org
- The `INDEX_CHANNELS` must be negative integers (e.g. `-1001234567890`)
- For the bot to index a channel, it must be **added as admin** to that channel
- TMDB enrichment happens automatically at index time; re-indexing updates metadata
- `VITE_BOT_USERNAME` env var controls the Telegram deep link on the download button

## User preferences

- Python bot (not Node.js) — use Dockerfile for deployment
- MongoDB shared between bot and web API
