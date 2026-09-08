"use client";

import { useEffect } from "react";
import { setHistoryEnabled } from "@/lib/storage";

/**
 * Lets the MOVIE BOX Android app control site preferences through the URL,
 * e.g. https://site/?history=off  (used by the app's Settings screen).
 */
export default function AppPrefsBridge() {
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const h = params.get("history");
            if (h === "off") setHistoryEnabled(false);
            if (h === "on") setHistoryEnabled(true);
        } catch {
            /* ignore */
        }
    }, []);

    return null;
}
