"use client";

const LS_PREFIX = process.env.NEXT_PUBLIC_LS_PREFIX ?? "fw_";
const RECENTLY_PLAYED_KEY = `${LS_PREFIX}recently_played`;
const WATCHLIST_KEY = `${LS_PREFIX}watchlist`;
const MAX_RECENT = 20;
const HISTORY_FLAG_KEY = `${LS_PREFIX}history_enabled`;

/** Watch-history on/off switch (default: ON). */
export function isHistoryEnabled(): boolean {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(HISTORY_FLAG_KEY) !== "off";
}

export function setHistoryEnabled(on: boolean) {
    if (typeof window === "undefined") return;
    localStorage.setItem(HISTORY_FLAG_KEY, on ? "on" : "off");
    window.dispatchEvent(new Event("historySettingChanged"));
}

export function clearRecentlyPlayed() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RECENTLY_PLAYED_KEY);
    cachedRecentlyPlayed = [];
    window.dispatchEvent(new Event("recentlyPlayedUpdated"));
}

export interface RecentItem {
    id: string;
    type: "movie" | "tv";
    title: string;
    overview?: string;
    poster_path: string;
    backdrop_path?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    last_played: number;
    season?: number;
    episode?: number;
    tagline?: string;
}

let cachedWatchlist: RecentItem[] | null = null;
let cachedRecentlyPlayed: RecentItem[] | null = null;

if (typeof window !== "undefined") {
    window.addEventListener("watchlistUpdated", () => { cachedWatchlist = null; });
    window.addEventListener("recentlyPlayedUpdated", () => { cachedRecentlyPlayed = null; });
}

export function saveToRecentlyPlayed(item: RecentItem) {
    if (typeof window === "undefined") return;
    if (!isHistoryEnabled()) return;
    try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
        let items: RecentItem[] = stored ? JSON.parse(stored) : [];
        items = items.filter(i => !(i.id === item.id && i.type === item.type));
        items.unshift({ ...item, last_played: Date.now() });
        if (items.length > MAX_RECENT) items = items.slice(0, MAX_RECENT);
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(items));
        cachedRecentlyPlayed = items;
        window.dispatchEvent(new Event("recentlyPlayedUpdated"));
    } catch { }
}

export function getRecentlyPlayed(): RecentItem[] {
    if (typeof window === "undefined") return [];
    if (!isHistoryEnabled()) return [];
    if (cachedRecentlyPlayed !== null) return cachedRecentlyPlayed;
    try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
        cachedRecentlyPlayed = stored ? JSON.parse(stored) : [];
        return cachedRecentlyPlayed!;
    } catch { return []; }
}

export function removeFromRecentlyPlayed(id: string, type: string) {
    if (typeof window === "undefined") return;
    try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
        if (!stored) return;
        let items: RecentItem[] = JSON.parse(stored);
        items = items.filter(i => !(i.id === id && i.type === type));
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(items));
        cachedRecentlyPlayed = items;
        window.dispatchEvent(new Event("recentlyPlayedUpdated"));
    } catch { }
}

export function addToWatchlist(item: RecentItem) {
    if (typeof window === "undefined") return;
    try {
        const stored = localStorage.getItem(WATCHLIST_KEY);
        const items: RecentItem[] = stored ? JSON.parse(stored) : [];
        const exists = items.some(i => i.id === item.id && i.type === item.type);
        if (exists) return;
        items.unshift({ ...item, last_played: Date.now() });
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
        cachedWatchlist = items;
        window.dispatchEvent(new Event("watchlistUpdated"));
    } catch { }
}

export function removeFromWatchlist(id: string, type: string) {
    if (typeof window === "undefined") return;
    try {
        const stored = localStorage.getItem(WATCHLIST_KEY);
        if (!stored) return;
        let items: RecentItem[] = JSON.parse(stored);
        items = items.filter(i => !(i.id === id && i.type === type));
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
        cachedWatchlist = items;
        window.dispatchEvent(new Event("watchlistUpdated"));
    } catch { }
}

export function isInWatchlist(id: string, type: string): boolean {
    return getWatchlist().some(i => i.id === id && i.type === type);
}

export function getWatchlist(): RecentItem[] {
    if (typeof window === "undefined") return [];
    if (cachedWatchlist !== null) return cachedWatchlist;
    try {
        const stored = localStorage.getItem(WATCHLIST_KEY);
        cachedWatchlist = stored ? JSON.parse(stored) : [];
        return cachedWatchlist!;
    } catch { return []; }
}
