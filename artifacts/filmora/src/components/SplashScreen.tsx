"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/lib/config";

const DURATION = 2500;

const MBLogoSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" className="w-20 h-20" aria-hidden="true">
        <defs>
            <linearGradient id="sp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3D3D" />
                <stop offset="55%" stopColor="#FF8A00" />
                <stop offset="100%" stopColor="#FFC93C" />
            </linearGradient>
        </defs>
        <rect x="2" y="2" width="40" height="40" rx="11" ry="11" fill="url(#sp-grad)" />
        <rect x="7" y="11" width="30" height="22" rx="4" fill="rgba(0,0,0,0.32)" />
        <polygon points="19,16 19,28 30,22" fill="white" />
        <rect x="7" y="7" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.55)" />
        <rect x="7" y="34" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
    </svg>
);

export default function SplashScreen() {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (window.location.pathname.startsWith("/admin")) return;
        if (window.location.pathname.startsWith("/watch")) return;
        try {
            if (sessionStorage.getItem("splash-shown")) return;
        } catch (_) {}

        setVisible(true);

        const start = Date.now();
        const tick = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.min((elapsed / DURATION) * 100, 100));
        }, 30);

        const timer = setTimeout(() => {
            clearInterval(tick);
            setProgress(100);
            setVisible(false);
            try { sessionStorage.setItem("splash-shown", "1"); } catch (_) {}
        }, DURATION);

        return () => {
            clearTimeout(timer);
            clearInterval(tick);
        };
    }, []);

    const parts = siteConfig.name.split(" ");
    const first = parts[0];
    const rest = parts.slice(1).join(" ");

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
                    style={{ background: "#000" }}
                >
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,61,61,0.18) 0%, rgba(255,201,60,0.08) 40%, transparent 70%)",
                        }}
                    />

                    <motion.div
                        className="absolute rounded-full border border-orange-500/20"
                        animate={{ width: [180, 280, 180], height: [180, 280, 180], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute rounded-full border border-amber-400/15"
                        animate={{ width: [140, 240, 140], height: [140, 240, 140], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 3, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                        className="relative z-10 mb-5"
                    >
                        <MBLogoSVG />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="relative z-10 text-[34px] font-black tracking-tight leading-none mb-3"
                    >
                        <span className="text-white">{first} </span>
                        <span
                            style={{
                                background: "linear-gradient(135deg, #FF3D3D 0%, #FFC93C 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            {rest}
                        </span>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 0.7, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="relative z-10 text-[11px] font-bold tracking-[0.3em] uppercase text-amber-300/80 mb-14"
                    >
                        {siteConfig.brandBy}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="relative z-10 w-48 h-[3px] rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.10)" }}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                width: `${progress}%`,
                                background: "linear-gradient(90deg, #FF3D3D, #FFC93C)",
                                boxShadow: "0 0 8px rgba(255,138,0,0.6)",
                                transition: "width 0.03s linear",
                            }}
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="relative z-10 flex gap-1.5 mt-4"
                    >
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                                transition={{ duration: 1.1, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        ))}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
