"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Gauge, Volume2, Download, Zap, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import HumanVerification from "./HumanVerification";

export const QUALITIES = ["480p", "720p", "1080p", "4K"] as const;
export const AUDIOS = ["Stereo", "5.1 Surround", "Dolby Atmos"] as const;

export type Quality = (typeof QUALITIES)[number];
export type AudioTrack = (typeof AUDIOS)[number];

const Q_KEY = "mb-pref-quality";
const A_KEY = "mb-pref-audio";

interface Props {
    /** Telegram / bot deep link used for the fast download of each quality. */
    downloadBase?: string;
    title?: string;
}

/**
 * Netflix-style quality + audio bar for MOVIE BOX.
 * Preferences persist locally and are used by the download options below.
 */
export default function PlaybackQualityBar({ downloadBase, title }: Props) {
    const [quality, setQuality] = useState<Quality>("1080p");
    const [audio, setAudio] = useState<AudioTrack>("Dolby Atmos");
    const [gateOpen, setGateOpen] = useState(false);
    const [isFull, setIsFull] = useState(false);
    const [human, setHuman] = useState<{ token: string; answer: number } | null>(null);
    const onHuman = useCallback((v: { token: string; answer: number } | null) => setHuman(v), []);

    useEffect(() => {
        const q = localStorage.getItem(Q_KEY) as Quality | null;
        const a = localStorage.getItem(A_KEY) as AudioTrack | null;
        if (q && QUALITIES.includes(q)) setQuality(q);
        if (a && AUDIOS.includes(a)) setAudio(a);
    }, []);

    // Fullscreen for the whole player area (works in browser and inside the app).
    useEffect(() => {
        const onChange = () => setIsFull(Boolean(document.fullscreenElement));
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }
            const target =
                (document.querySelector("[data-mb-player]") as HTMLElement | null) ??
                document.documentElement;
            await target.requestFullscreen?.();
        } catch {
            /* ignore — some in-app webviews block it */
        }
    };

    const pick = (q: Quality) => {
        setQuality(q);
        localStorage.setItem(Q_KEY, q);
    };
    const pickAudio = (a: AudioTrack) => {
        setAudio(a);
        localStorage.setItem(A_KEY, a);
    };

    const downloadHref = downloadBase
        ? `${downloadBase}${downloadBase.includes("?") ? "&" : "?"}q=${encodeURIComponent(quality)}`
        : undefined;

    return (
        <div className="bg-black/60 border-t border-white/5 px-3 md:px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <Gauge className="h-3.5 w-3.5" /> Quality
                </span>
                <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
                    {QUALITIES.map((q) => (
                        <button
                            key={q}
                            onClick={() => pick(q)}
                            className={cn(
                                "rounded-lg px-3 py-1 text-[11px] font-bold transition-all",
                                quality === q
                                    ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <Volume2 className="h-3.5 w-3.5" /> Audio
                </span>
                <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
                    {AUDIOS.map((a) => (
                        <button
                            key={a}
                            onClick={() => pickAudio(a)}
                            className={cn(
                                "rounded-lg px-3 py-1 text-[11px] font-bold transition-all whitespace-nowrap",
                                audio === a
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
                {isFull ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {isFull ? "Exit fullscreen" : "Fullscreen"}
            </button>

            {downloadHref && (
                <button
                    type="button"
                    onClick={() => setGateOpen(true)}
                    title={title ? `Fast download — ${title} (${quality})` : undefined}
                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 px-4 py-2 text-xs font-black text-white transition hover:brightness-110"
                >
                    <Zap className="h-3.5 w-3.5" />
                    Fast download
                    <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[10px]">{quality}</span>
                    <Download className="h-3.5 w-3.5" />
                </button>
            )}

            {gateOpen && downloadHref && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#101014] p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-white">Verify you&apos;re human</h3>
                        <p className="mt-1 text-xs text-gray-400">
                            Solve this quick addition to start the {quality} fast download.
                        </p>
                        <div className="mt-4">
                            <HumanVerification onChange={onHuman} compact />
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setGateOpen(false)}
                                className="flex-1 rounded-xl border border-white/10 py-3 text-xs font-bold text-gray-300 transition hover:text-white"
                            >
                                Cancel
                            </button>
                            <a
                                href={human ? downloadHref : undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    if (!human) e.preventDefault();
                                    else setGateOpen(false);
                                }}
                                aria-disabled={!human}
                                className={cn(
                                    "flex-1 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 py-3 text-center text-xs font-black text-white transition",
                                    human ? "hover:brightness-110" : "pointer-events-none opacity-50"
                                )}
                            >
                                Start download
                            </a>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
