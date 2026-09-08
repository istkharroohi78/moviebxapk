"use client";

import React, { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { isHistoryEnabled, setHistoryEnabled, clearRecentlyPlayed } from "@/lib/storage";

/**
 * Watch-history on/off switch for MOVIE BOX.
 * When OFF, nothing new is stored and the "Continue watching" row stays hidden.
 */
export default function HistorySettings() {
    const [on, setOn] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setOn(isHistoryEnabled());
    }, []);

    if (!mounted) return null;

    const toggle = () => {
        const next = !on;
        setOn(next);
        setHistoryEnabled(next);
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                        <History className="h-4 w-4" /> Watch history
                    </div>
                    <p className="mt-2 text-sm text-gray-400">
                        {on
                            ? "We keep track of what you play so you can continue watching."
                            : "History is off — nothing you play is saved on this device."}
                    </p>
                </div>
                <button
                    role="switch"
                    aria-checked={on}
                    aria-label="Toggle watch history"
                    onClick={toggle}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-gradient-to-r from-red-600 to-orange-500" : "bg-white/15"
                        }`}
                >
                    <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"
                            }`}
                    />
                </button>
            </div>
            <button
                onClick={() => clearRecentlyPlayed()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-500/40 hover:text-red-300"
            >
                <Trash2 className="h-3.5 w-3.5" /> Clear history
            </button>
        </div>
    );
}
