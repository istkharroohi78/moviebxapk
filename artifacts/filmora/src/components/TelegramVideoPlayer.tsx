"use client";

import { useEffect, useRef } from "react";

interface TelegramVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onBack?: () => void;
}

declare global {
  interface Window {
    FtmPlyr: new (el: HTMLElement | string, opts: Record<string, unknown>) => {
      play: () => void;
      pause: () => void;
      destroy: () => void;
      setSource: (src: string) => void;
    };
  }
}

const FTMPLYR_CSS = "https://cdn.jsdelivr.net/gh/ftmdevz/ftmplyr@V1/ftmplyr.css";
const FTMPLYR_JS  = "https://cdn.jsdelivr.net/gh/ftmdevz/ftmplyr@V1/ftmplyr.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function loadCss(href: string) {
  if (document.querySelector(`link[data-ftmplyr-css]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-ftmplyr-css", "1");
  document.head.appendChild(link);
}

function toAbsoluteUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;
  }
  return src;
}

export default function TelegramVideoPlayer({ src, poster, title, onBack }: TelegramVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ play: () => void; pause: () => void; destroy: () => void; setSource: (src: string) => void } | null>(null);
  const initRef = useRef(false);

  const absoluteSrc = toAbsoluteUrl(src);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (initRef.current) return;
      initRef.current = true;

      loadCss(FTMPLYR_CSS);
      await loadScript(FTMPLYR_JS);

      if (cancelled || !containerRef.current) return;

      playerRef.current = new window.FtmPlyr(containerRef.current, {
        src: absoluteSrc,
        poster: poster ?? "",
        title: title ?? "",
        autoplay: false,
      });
    };

    init().catch(console.error);

    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
      initRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (playerRef.current && initRef.current) {
      playerRef.current.setSource(absoluteSrc);
    }
  }, [absoluteSrc]);

  return (
    <div className="relative w-full bg-black">
      <div ref={containerRef} style={{ width: "100%", aspectRatio: "16/9" }} />
      {onBack && (
        <button
          onClick={onBack}
          className="mt-3 text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1 px-4"
        >
          ← Back to details
        </button>
      )}
    </div>
  );
}
