"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import BrandLogo from "./BrandLogo";
import HumanVerification from "./HumanVerification";

export default function LoginForm() {
    const router = useRouter();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [remember, setRemember] = useState(true);

    // Remember the Gmail address used last time on this device.
    useEffect(() => {
        const saved = localStorage.getItem("mb-last-email");
        if (saved) setEmail(saved);
        else setRemember(localStorage.getItem("mb-remember-email") !== "off");
    }, []);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [human, setHuman] = useState<{ token: string; answer: number } | null>(null);
    const onHuman = useCallback((v: { token: string; answer: number } | null) => setHuman(v), []);

    async function sendCode(e?: React.FormEvent) {
        e?.preventDefault();
        setError(null);
        if (!human) {
            setError("Please solve the human verification question first.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, humanToken: human.token, humanAnswer: human.answer }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not send the code.");
            if (remember) {
                localStorage.setItem("mb-last-email", email);
                localStorage.setItem("mb-remember-email", "on");
            } else {
                localStorage.removeItem("mb-last-email");
                localStorage.setItem("mb-remember-email", "off");
            }
            setStep("code");
            setNotice(`We sent a 6-digit code to ${email}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    async function verify(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not verify the code.");
            router.push("/account");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen flex items-center justify-center px-4 py-28 overflow-hidden">
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-red-600/30 via-orange-500/20 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/60 p-8 backdrop-blur-2xl shadow-[0_30px_90px_-30px_rgba(255,80,0,0.5)]">
                <div className="flex flex-col items-center text-center">
                    <BrandLogo showBy />
                    <h1 className="mt-6 text-2xl font-black tracking-tight text-white">
                        {step === "email" ? "Sign in with Gmail" : "Enter your code"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        {step === "email"
                            ? "We'll email you a one-time code — no password needed."
                            : notice}
                    </p>
                </div>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {step === "email" ? (
                    <form onSubmit={sendCode} className="mt-7 space-y-4">
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                required
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="yourname@gmail.com"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-4 text-sm text-white placeholder-gray-500 outline-none transition focus:border-orange-500/60 focus:bg-white/[0.07]"
                            />
                        </div>
                        <label className="flex cursor-pointer items-center gap-2.5 px-1 text-xs text-gray-400">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="h-4 w-4 accent-orange-500"
                            />
                            Remember my Gmail on this device
                        </label>
                        <HumanVerification onChange={onHuman} />
                        <button
                            type="submit"
                            disabled={loading || !human}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 py-4 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                            {loading ? "Sending code..." : "Send login code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verify} className="mt-7 space-y-4">
                        <div className="relative">
                            <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                            <input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                required
                                autoFocus
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                placeholder="123456"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-4 pl-12 pr-4 text-center text-lg font-bold tracking-[0.5em] text-white placeholder-gray-600 outline-none transition focus:border-orange-500/60 focus:bg-white/[0.07]"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 py-4 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            {loading ? "Verifying..." : "Verify & sign in"}
                        </button>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(null); }} className="hover:text-white">
                                Change email
                            </button>
                            <button type="button" onClick={() => sendCode()} className="inline-flex items-center gap-1.5 hover:text-white">
                                <RotateCcw className="h-3 w-3" /> Resend code
                            </button>
                        </div>
                    </form>
                )}

                <p className="mt-8 text-center text-[11px] leading-relaxed text-gray-600">
                    By signing in you agree to keep MOVIE BOX for personal use only.
                </p>
            </div>
        </main>
    );
}
