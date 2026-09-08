"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSearchOverlayProps {
    isOpen: boolean;
    isListening: boolean;
    transcript: string;
    onClose: () => void;
}

const BARS = [0, 1, 2, 3, 4, 5, 6];
const RINGS = [1, 2, 3];

export default function VoiceSearchOverlay({ isOpen, isListening, transcript, onClose }: VoiceSearchOverlayProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.93)", backdropFilter: "blur(24px) saturate(0.4)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                >
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Title */}
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-sm font-semibold tracking-widest uppercase mb-12"
                    >
                        Voice Search
                    </motion.p>

                    {/* Pulsing rings + mic */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 22 }}
                        className="relative flex items-center justify-center mb-10"
                    >
                        {isListening && RINGS.map((i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full border border-accent/50"
                                initial={{ width: 88, height: 88, opacity: 0.8 }}
                                animate={{ width: 88 + i * 72, height: 88 + i * 72, opacity: 0 }}
                                transition={{
                                    duration: 2.2,
                                    delay: i * 0.45,
                                    repeat: Infinity,
                                    ease: "easeOut",
                                }}
                            />
                        ))}

                        <motion.div
                            animate={isListening
                                ? { scale: [1, 1.06, 1], boxShadow: ["0 0 0px 0px rgba(255,159,28,0)", "0 0 32px 10px rgba(255,159,28,0.35)", "0 0 0px 0px rgba(255,159,28,0)"] }
                                : { scale: 1, boxShadow: "none" }
                            }
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            className={cn(
                                "relative z-10 w-[88px] h-[88px] rounded-full flex items-center justify-center transition-colors duration-500",
                                isListening
                                    ? "bg-accent"
                                    : "bg-white/10 border-2 border-white/20"
                            )}
                        >
                            <Mic className={cn("h-10 w-10", isListening ? "text-black" : "text-gray-300")} />
                        </motion.div>
                    </motion.div>

                    {/* Waveform bars */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-[5px] mb-10"
                        style={{ height: 52 }}
                    >
                        {BARS.map((i) => (
                            <motion.div
                                key={i}
                                className="w-[5px] rounded-full bg-accent"
                                animate={isListening
                                    ? {
                                        scaleY: [0.15, 1, 0.35, 0.85, 0.2, 0.7, 0.15],
                                        opacity: [0.4, 1, 0.65, 1, 0.5, 0.9, 0.4],
                                    }
                                    : { scaleY: 0.12, opacity: 0.25 }
                                }
                                transition={{
                                    duration: 1.4,
                                    delay: i * 0.12,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                style={{ height: 52, originY: "50%" }}
                            />
                        ))}
                    </motion.div>

                    {/* Status / transcript */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={transcript || (isListening ? "listening" : "starting")}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="text-center px-8 max-w-sm"
                        >
                            {transcript ? (
                                <>
                                    <p className="text-xl font-bold text-white leading-snug mb-2">"{transcript}"</p>
                                    <p className="text-sm text-accent font-semibold">Searching...</p>
                                </>
                            ) : (
                                <p className="text-base text-gray-300">
                                    {isListening ? "Listening… speak now" : "Starting microphone..."}
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Hint */}
                    {!transcript && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.45 }}
                            transition={{ delay: 0.6 }}
                            className="absolute bottom-10 text-xs text-gray-500 text-center"
                        >
                            Tap outside or press ✕ to cancel
                        </motion.p>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
