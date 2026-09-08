"use client";
import { useTheme } from "@/lib/theme";

const BLOBS: Record<string, { a: string; b: string; c: string; d: string }> = {
  beta:           { a:"rgba(212,160,23,0.18)", b:"rgba(196,154,18,0.14)", c:"rgba(232,196,80,0.11)", d:"rgba(184,134,11,0.09)" },
  rcb:            { a:"rgba(220,30,0,0.16)",   b:"rgba(232,176,0,0.13)", c:"rgba(200,10,0,0.11)",   d:"rgba(230,160,0,0.08)" },
  "neon-galaxy":  { a:"rgba(180,0,255,0.13)",  b:"rgba(217,70,239,0.11)",c:"rgba(140,0,230,0.09)",  d:"rgba(100,0,200,0.07)" },
  "ocean-pulse":  { a:"rgba(6,182,212,0.15)",  b:"rgba(20,184,166,0.12)",c:"rgba(8,145,178,0.10)",  d:"rgba(6,182,212,0.07)" },
  "sunset-cinema":{ a:"rgba(249,115,22,0.17)", b:"rgba(236,72,153,0.13)",c:"rgba(220,80,10,0.11)",  d:"rgba(240,100,50,0.08)" },
  "emerald-night":{ a:"rgba(16,185,129,0.15)", b:"rgba(5,150,105,0.12)", c:"rgba(52,211,153,0.10)", d:"rgba(16,185,129,0.07)" },
};

const blobBase: React.CSSProperties = {
  position: "absolute",
  borderRadius: "50%",
  willChange: "transform",
  transform: "translateZ(0)",
};

/* 12 sparkle dots scattered across the viewport */
const SPARKLES = [
  { top: "8%",  left: "12%",  delay: "0s",    dur: "4.2s",  size: 6  },
  { top: "15%", left: "72%",  delay: "1.1s",  dur: "5.8s",  size: 4  },
  { top: "28%", left: "88%",  delay: "0.4s",  dur: "3.9s",  size: 7  },
  { top: "42%", left: "5%",   delay: "2.0s",  dur: "6.1s",  size: 5  },
  { top: "55%", left: "55%",  delay: "0.7s",  dur: "4.6s",  size: 8  },
  { top: "62%", left: "30%",  delay: "1.6s",  dur: "5.2s",  size: 4  },
  { top: "70%", left: "80%",  delay: "0.2s",  dur: "3.7s",  size: 6  },
  { top: "80%", left: "18%",  delay: "2.4s",  dur: "4.9s",  size: 5  },
  { top: "88%", left: "64%",  delay: "1.3s",  dur: "6.4s",  size: 7  },
  { top: "22%", left: "42%",  delay: "3.1s",  dur: "5.0s",  size: 4  },
  { top: "48%", left: "93%",  delay: "0.9s",  dur: "4.3s",  size: 5  },
  { top: "6%",  left: "52%",  delay: "2.8s",  dur: "3.5s",  size: 6  },
];

/* ✦ shape drawn as SVG */
const StarSVG = ({ size, color }: { size: number; color: string }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 0 L11.8 8.2 L20 10 L11.8 11.8 L10 20 L8.2 11.8 L0 10 L8.2 8.2 Z"
      fill={color}
    />
  </svg>
);

export default function ShivBackground() {
  const { mode, theme } = useTheme();
  if (mode !== "shiv") return null;

  const c = BLOBS[theme] ?? BLOBS.beta;

  /* pick sparkle color per theme */
  const sparkleColor = theme === "rcb"
    ? "rgba(220,30,0,0.55)"
    : theme === "neon-galaxy"
      ? "rgba(200,80,255,0.55)"
      : theme === "ocean-pulse"
        ? "rgba(6,182,212,0.55)"
        : theme === "sunset-cinema"
          ? "rgba(249,115,22,0.55)"
          : theme === "emerald-night"
            ? "rgba(16,185,129,0.55)"
            : "rgba(184,134,11,0.65)";

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        userSelect: "none",
      }}
    >
      {/* ── Floating blobs ── */}
      <div style={{ ...blobBase, width:"80vw", height:"70vh", top:"-20vh", left:"-15vw",
        background:`radial-gradient(ellipse 60% 55% at 40% 45%, ${c.a} 0%, transparent 100%)`,
        animation:"ftm-blob-a 26s ease-in-out infinite" }} />
      <div style={{ ...blobBase, width:"72vw", height:"72vh", bottom:"-22vh", right:"-16vw",
        background:`radial-gradient(ellipse 58% 60% at 55% 50%, ${c.b} 0%, transparent 100%)`,
        animation:"ftm-blob-b 32s ease-in-out infinite", animationDelay:"-12s" }} />
      <div style={{ ...blobBase, width:"55vw", height:"52vh", top:"28vh", left:"26vw",
        background:`radial-gradient(ellipse 55% 50% at 50% 50%, ${c.c} 0%, transparent 100%)`,
        animation:"ftm-blob-c 20s ease-in-out infinite", animationDelay:"-6s" }} />
      <div style={{ ...blobBase, width:"36vw", height:"35vh", top:"8vh", right:"10vw",
        background:`radial-gradient(ellipse 52% 48% at 50% 50%, ${c.d} 0%, transparent 100%)`,
        animation:"ftm-blob-d 15s ease-in-out infinite", animationDelay:"-4s" }} />

      {/* ── Sparkle stars ── */}
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            animation: `ftm-sparkle ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
            willChange: "transform, opacity",
            filter: "drop-shadow(0 0 3px rgba(184,134,11,0.5))",
          }}
        >
          <StarSVG size={s.size} color={sparkleColor} />
        </div>
      ))}

      {/* ── Subtle diagonal light streak ── */}
      <div
        style={{
          position: "absolute",
          width: "120vw",
          height: "2px",
          top: "35%",
          left: "-10vw",
          background: `linear-gradient(90deg, transparent 0%, ${sparkleColor.replace("0.65", "0.12")} 40%, ${sparkleColor.replace("0.65", "0.20")} 50%, ${sparkleColor.replace("0.65", "0.12")} 60%, transparent 100%)`,
          transform: "rotate(-8deg)",
          animation: "ftm-blob-a 18s ease-in-out infinite",
          animationDelay: "-7s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
