import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: "Unlimited movies and TV shows for free. Movies | Series | Anime | More.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "any",
    scope: "/",
    icons: [
      { src: siteConfig.logoPath, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: siteConfig.logoPath, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: siteConfig.logoPath, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: siteConfig.logoPath, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
