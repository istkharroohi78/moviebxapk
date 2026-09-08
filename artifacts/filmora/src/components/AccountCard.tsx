"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Mail, CalendarDays, Clapperboard, Bookmark } from "lucide-react";
import HistorySettings from "./HistorySettings";

interface Props {
    email: string;
    name: string;
    memberSince: string | null;
    loginCount: number;
}

export default function AccountCard({ email, name, memberSince, loginCount }: Props) {
    const router = useRouter();
    const initials = (name || email).trim().slice(0, 2).toUpperCase();

    async function signOut() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
    }

    return (
        <main className="min-h-screen px-4 pt-28 pb-24">
            <div className="mx-auto w-full max-w-3xl">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-8 backdrop-blur-2xl">
                    <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-red-600/30 to-orange-500/10 blur-3xl" />
                    <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 text-2xl font-black text-white">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-black capitalize tracking-tight text-white">{name}</h1>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm text-gray-400">
                                <Mail className="h-4 w-4" /> {email}
                            </p>
                        </div>
                        <button
                            onClick={signOut}
                            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                            <LogOut className="h-4 w-4" /> Sign out
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                            <CalendarDays className="h-4 w-4" /> Member since
                        </div>
                        <p className="mt-2 text-lg font-bold text-white">
                            {memberSince ? new Date(memberSince).toLocaleDateString() : "Today"}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500">
                            <Clapperboard className="h-4 w-4" /> Sign-ins
                        </div>
                        <p className="mt-2 text-lg font-bold text-white">{loginCount}</p>
                    </div>
                </div>

                <div className="mt-6">
                    <HistorySettings />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/watchlist" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110">
                        <Bookmark className="h-4 w-4" /> My List
                    </Link>
                    <Link href="/movies" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10">
                        Browse movies
                    </Link>
                </div>
            </div>
        </main>
    );
}
