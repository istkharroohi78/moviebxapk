import React from "react";
import { MovieRowSkeleton } from "@/components/Skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-prime-dark overflow-hidden">
            {/* Hero Skeleton */}
            <div className="relative w-full h-[82vh] animate-pulse" style={{ background: "var(--skeleton-bg)" }}>
                <div className="absolute bottom-20 left-8 md:left-12 space-y-5 w-full max-w-2xl pr-8">
                    <div className="h-14 w-3/4 rounded-2xl" style={{ background: "var(--skeleton-shine)" }} />
                    <div className="flex space-x-3">
                        <div className="h-4 w-20 rounded-md" style={{ background: "var(--skeleton-shine)" }} />
                        <div className="h-4 w-20 rounded-md" style={{ background: "var(--skeleton-shine)" }} />
                        <div className="h-4 w-20 rounded-md" style={{ background: "var(--skeleton-shine)" }} />
                    </div>
                    <div className="h-16 w-full rounded-2xl" style={{ background: "var(--skeleton-shine)" }} />
                    <div className="flex space-x-3 pt-2">
                        <div className="h-11 w-32 rounded-full" style={{ background: "var(--skeleton-shine)" }} />
                        <div className="h-11 w-28 rounded-full" style={{ background: "var(--skeleton-shine)" }} />
                    </div>
                    <div className="h-3 w-28 rounded-md" style={{ background: "var(--skeleton-shine)" }} />
                </div>
            </div>

            {/* Rows Skeletons */}
            <div className="relative z-40 -mt-16 space-y-8">
                <MovieRowSkeleton />
                <MovieRowSkeleton />
                <MovieRowSkeleton />
            </div>
        </main>
    );
}
