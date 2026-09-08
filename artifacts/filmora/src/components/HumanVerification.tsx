"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, RotateCcw, Loader2 } from "lucide-react";

interface Challenge {
    a: number;
    b: number;
    token: string;
}

interface Props {
    /** Called with (token, answer) whenever the entered sum is correct, or null when not. */
    onChange: (value: { token: string; answer: number } | null) => void;
    compact?: boolean;
}

/**
 * Human verification — simple number addition.
 * The challenge is generated + signed on the server (/api/human-check),
 * so the answer cannot be faked from the browser.
 */
export default function HumanVerification({ onChange, compact }: Props) {
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        setAnswer("");
        onChange(null);
        try {
            const res = await fetch("/api/human-check", { cache: "no-store" });
            setChallenge(await res.json());
        } catch {
            setChallenge(null);
        } finally {
            setLoading(false);
        }
    }, [onChange]);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const ok = !!challenge && answer !== "" && Number(answer) === challenge.a + challenge.b;

    useEffect(() => {
        onChange(ok && challenge ? { token: challenge.token, answer: Number(answer) } : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ok, answer, challenge]);

    return (
        <div
            className={`rounded-2xl border border-white/10 bg-white/[0.03] ${compact ? "p-3" : "p-4"}`}
        >
            <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <ShieldCheck className="h-3.5 w-3.5" /> Human verification
                </span>
                <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 transition hover:text-white"
                >
                    <RotateCcw className="h-3 w-3" /> New question
                </button>
            </div>

            {loading || !challenge ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading question…
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="select-none rounded-xl bg-black/50 px-4 py-3 text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-amber-300">
                        {challenge.a} + {challenge.b} = ?
                    </div>
                    <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))}
                        placeholder="?"
                        aria-label="Answer of the addition"
                        className={`w-24 rounded-xl border bg-white/[0.04] py-3 text-center text-base font-bold text-white outline-none transition ${
                            answer === ""
                                ? "border-white/10"
                                : ok
                                  ? "border-emerald-500/60"
                                  : "border-red-500/50"
                        }`}
                    />
                    {ok && <ShieldCheck className="h-5 w-5 text-emerald-400" />}
                </div>
            )}
        </div>
    );
}
