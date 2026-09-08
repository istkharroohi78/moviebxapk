"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Server, Maximize2, Minimize2, RefreshCcw, Share2, Check, Loader2, AlertCircle, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveToRecentlyPlayed } from "@/lib/storage";
import Dropdown from "@/components/ui/Dropdown";
import PlaybackQualityBar from "@/components/PlaybackQualityBar";
import { siteConfig } from "@/lib/config";

interface VideoPlayerProps {
    type: "movie" | "tv";
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tmdbData: any;
    season?: number;
    episode?: number;
    initialServer?: number;
    onSeasonChange?: (season: number) => void;
    onEpisodeChange?: (episode: number) => void;
}

type ServerStatus = "idle" | "loading" | "success" | "error";

const SERVERS = [
    {
        name: "Videasy",
        movie: (id: string) => `https://player.videasy.net/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
    },
    {
        name: "VidSrc PM",
        movie: (id: string) => `https://vidsrc.pm/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
    },
    {
        name: "Vidlink",
        movie: (id: string) => `https://vidlink.pro/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    },
    {
        name: "VidSrc CC",
        movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`,
    },
    {
        name: "Vidfast",
        movie: (id: string) => `https://vidfast.net/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidfast.net/tv/${id}/${s}/${e}`,
    },
    {
        name: "Vidking",
        movie: (id: string) => `https://www.vidking.net/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
    },
    {
        name: "Vidify",
        movie: (id: string) => `https://pro.vidify.top/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://pro.vidify.top/embed/tv/${id}/${s}/${e}`,
    },
    {
        name: "PrimeSRC",
        movie: (id: string) => `https://primesrc.me/embed/movie?tmdb=${id}`,
        show: (id: string, s: number, e: number) => `https://primesrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
    },
    {
        name: "Vidzee",
        movie: (id: string) => `https://player.vidzee.wtf/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://player.vidzee.wtf/embed/tv/${id}/${s}/${e}`,
    },
    {
        name: "2Embed",
        movie: (id: string) => `https://www.2embed.skin/embed/${id}`,
        show: (id: string, s: number, e: number) => `https://www.2embed.skin/embedtv/${id}&s=${s}&e=${e}`,
    },
    {
        name: "Peachify",
        movie: (id: string) => `https://peachify.top/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://peachify.top/embed/tv/${id}/${s}/${e}`,
    },
    {
        name: "HNEmbed",
        movie: (id: string) => `https://hnembed.cc/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://hnembed.cc/embed/tv/${id}/${s}/${e}`,
    },
];

const LOAD_TIMEOUT_MS = 10000; // 10 seconds before declaring server "failed"

export default function VideoPlayer({
    type,
    id,
    tmdbData,
    season: controlledSeason,
    episode: controlledEpisode,
    initialServer,
    onSeasonChange,
    onEpisodeChange
}: VideoPlayerProps) {
    const [internalSeason, setInternalSeason] = useState(1);
    const [internalEpisode, setInternalEpisode] = useState(1);
    const [selectedServer, setSelectedServer] = useState(initialServer ?? 0);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [playerKey, setPlayerKey] = useState(0);
    const [copied, setCopied] = useState(false);
    const [statuses, setStatuses] = useState<Record<number, ServerStatus>>({});
    const [autoSwitching, setAutoSwitching] = useState(false);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const isControlled = controlledSeason !== undefined && controlledEpisode !== undefined;
    const currentSeason = isControlled ? controlledSeason : internalSeason;
    const currentEpisode = isControlled ? controlledEpisode : internalEpisode;

    const clearLoadTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Find next non-errored server index, wrapping around
    const findNextServer = useCallback((from: number, currentStatuses: Record<number, ServerStatus>): number | null => {
        for (let i = 1; i < SERVERS.length; i++) {
            const idx = (from + i) % SERVERS.length;
            if (currentStatuses[idx] !== "error") return idx;
        }
        return null; // All servers failed
    }, []);

    const startLoadTimer = useCallback((serverIdx: number) => {
        clearLoadTimeout();
        setStatuses(prev => ({ ...prev, [serverIdx]: "loading" }));
        timeoutRef.current = setTimeout(() => {
            // Server timed out → mark as error and auto-switch
            setStatuses(prev => {
                const next = { ...prev, [serverIdx]: "error" as ServerStatus };
                return next;
            });
            // Auto-switch to next available server
            setSelectedServer(prev => {
                setStatuses(statuses => {
                    const failed = { ...statuses, [serverIdx]: "error" as ServerStatus };
                    const nextIdx = findNextServer(serverIdx, failed);
                    if (nextIdx !== null && nextIdx !== serverIdx) {
                        setAutoSwitching(true);
                        setTimeout(() => {
                            setSelectedServer(nextIdx);
                            setPlayerKey(k => k + 1);
                            setAutoSwitching(false);
                        }, 300);
                    }
                    return failed;
                });
                return prev;
            });
        }, LOAD_TIMEOUT_MS);
    }, [clearLoadTimeout, findNextServer]);

    // When server changes, reset and start timeout
    useEffect(() => {
        setStatuses(prev => ({
            ...prev,
            [selectedServer]: prev[selectedServer] === "success" ? "success" : "loading"
        }));
        if (statuses[selectedServer] !== "success") {
            startLoadTimer(selectedServer);
        }
        return clearLoadTimeout;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServer, playerKey]);

    const handleIframeLoad = useCallback(() => {
        clearLoadTimeout();
        setStatuses(prev => ({ ...prev, [selectedServer]: "success" }));
        setAutoSwitching(false);
    }, [clearLoadTimeout, selectedServer]);

    const handleIframeError = useCallback(() => {
        clearLoadTimeout();
        setStatuses(prev => {
            const failed = { ...prev, [selectedServer]: "error" as ServerStatus };
            const nextIdx = findNextServer(selectedServer, failed);
            if (nextIdx !== null) {
                setAutoSwitching(true);
                setTimeout(() => {
                    setSelectedServer(nextIdx);
                    setPlayerKey(k => k + 1);
                    setAutoSwitching(false);
                }, 300);
            }
            return failed;
        });
    }, [clearLoadTimeout, findNextServer, selectedServer]);

    const handleManualServerSwitch = (idx: number) => {
        if (idx === selectedServer) {
            // Re-try current
            setPlayerKey(k => k + 1);
            return;
        }
        clearLoadTimeout();
        setSelectedServer(idx);
        setPlayerKey(k => k + 1);
    };

    // Save to recently played
    useEffect(() => {
        if (tmdbData) {
            saveToRecentlyPlayed({
                id,
                type,
                title: tmdbData.title || tmdbData.name,
                overview: tmdbData.overview,
                poster_path: tmdbData.poster_path,
                backdrop_path: tmdbData.backdrop_path,
                vote_average: tmdbData.vote_average,
                release_date: tmdbData.release_date,
                first_air_date: tmdbData.first_air_date,
                last_played: Date.now(),
                season: type === "tv" ? currentSeason : undefined,
                episode: type === "tv" ? currentEpisode : undefined,
                tagline: tmdbData.tagline,
            });
        }
    }, [id, type, tmdbData, currentSeason, currentEpisode]);

    // Space key → focus iframe
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.code === "Space" || e.key === " ") {
                e.preventDefault();
                iframeRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/watch/${type}/${id}?resume=true` +
            (type === "tv" ? `&s=${currentSeason}&e=${currentEpisode}` : "") +
            `&server=${selectedServer}`;
        navigator.clipboard.writeText(shareUrl)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
            .catch(() => {});
    };

    const handleSeasonChange = (s: number) => {
        if (isControlled) onSeasonChange?.(s);
        else { setInternalSeason(s); setInternalEpisode(1); }
    };
    const handleEpisodeChange = (e: number) => {
        if (isControlled) onEpisodeChange?.(e);
        else setInternalEpisode(e);
    };

    const currentServer = SERVERS[selectedServer];
    const playerUrl = type === "movie"
        ? currentServer.movie(id)
        : currentServer.show(id, currentSeason, currentEpisode);

    const seasons = (tmdbData?.seasons as Array<{ season_number: number; name?: string; episode_count: number }>) || [];

    const allFailed = SERVERS.every((_, i) => statuses[i] === "error");

    const statusDot = (idx: number) => {
        const s = statuses[idx];
        if (s === "success") return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />;
        if (s === "loading" && idx === selectedServer) return <Loader2 className="w-2.5 h-2.5 animate-spin text-accent flex-shrink-0" />;
        if (s === "error") return <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />;
        return <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />;
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* Player Frame */}
            <div className={cn(
                "relative w-full aspect-[14/10] sm:aspect-video md:h-[85vh] bg-black group transition-all duration-500",
                isTheaterMode && "md:h-[90vh] z-40"
            )}>
                {/* Loading overlay */}
                {(statuses[selectedServer] === "loading" || autoSwitching) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-3 pointer-events-none">
                        <Loader2 className="w-10 h-10 animate-spin text-accent" />
                        <p className="text-sm text-gray-300 font-medium">
                            {autoSwitching ? "Switching to next server…" : `Loading ${currentServer.name}…`}
                        </p>
                    </div>
                )}

                {/* All servers failed overlay */}
                {allFailed && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 gap-4">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <div className="text-center">
                            <p className="text-white font-bold text-lg">All servers unavailable</p>
                            <p className="text-gray-400 text-sm mt-1">Try again later or check your connection</p>
                        </div>
                        <button
                            onClick={() => {
                                setStatuses({});
                                setSelectedServer(0);
                                setPlayerKey(k => k + 1);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-black font-bold text-sm hover:opacity-90 transition"
                        >
                            <RefreshCcw className="w-4 h-4" /> Retry All
                        </button>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    key={`${selectedServer}-${currentSeason}-${currentEpisode}-${playerKey}`}
                    src={playerUrl}
                    className="w-full h-full border-none"
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                    referrerPolicy="origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                />

                {/* Theater mode shadow */}
                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <PlaybackQualityBar
                downloadBase={siteConfig.telegram}
                title={tmdbData?.title || tmdbData?.name}
            />

            {/* Control Bar */}
            <div className="bg-prime-card p-3 md:p-4 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
                {/* Server Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center text-gray-400 gap-1 shrink-0">
                        <Wifi className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Source</span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                        {SERVERS.map((server, idx) => {
                            const st = statuses[idx];
                            const isSelected = selectedServer === idx;
                            const isFailed = st === "error";
                            return (
                                <button
                                    key={server.name}
                                    onClick={() => handleManualServerSwitch(idx)}
                                    title={isFailed ? `${server.name} — unavailable` : server.name}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap",
                                        isSelected && !isFailed
                                            ? "bg-accent text-black shadow-md"
                                            : isFailed
                                            ? "bg-red-500/10 text-red-400/60 line-through cursor-not-allowed"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {statusDot(idx)}
                                    {server.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => { clearLoadTimeout(); setPlayerKey(k => k + 1); }}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Reload Player"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </button>

                    <button
                        onClick={handleShare}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all border text-xs font-bold",
                            copied
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-white/5 text-gray-300 hover:text-white border-white/5 hover:border-white/10"
                        )}
                        title="Copy Playback Link"
                    >
                        {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Share2 className="h-3.5 w-3.5" /> Share</>}
                    </button>

                    {/* Theater Mode */}
                    <button
                        onClick={() => setIsTheaterMode(!isTheaterMode)}
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white transition-all border border-white/5 text-xs font-bold"
                    >
                        {isTheaterMode
                            ? <><Minimize2 className="h-3.5 w-3.5" /> Normal</>
                            : <><Maximize2 className="h-3.5 w-3.5" /> Theater</>}
                    </button>

                    {/* TV Controls */}
                    {type === "tv" && seasons.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Season</span>
                                <Dropdown
                                    value={currentSeason}
                                    onChange={(val) => handleSeasonChange(Number(val))}
                                    options={seasons.map((s) => ({
                                        value: s.season_number,
                                        label: s.name || `Season ${s.season_number}`
                                    }))}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-[#1a242f] hover:bg-[#1a242f]/80 border-none shadow-none font-bold"
                                    menuClassName="min-w-[140px] bottom-full mb-2 mt-0 top-auto origin-bottom-left"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Episode</span>
                                <Dropdown
                                    value={currentEpisode}
                                    onChange={(val) => handleEpisodeChange(Number(val))}
                                    options={Array.from(
                                        { length: seasons.find((s) => s.season_number === currentSeason)?.episode_count || 50 },
                                        (_, i) => ({ value: i + 1, label: `Episode ${i + 1}` })
                                    )}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-[#1a242f] hover:bg-[#1a242f]/80 border-none shadow-none font-bold"
                                    menuClassName="min-w-[140px] bottom-full mb-2 mt-0 top-auto origin-bottom-left"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
