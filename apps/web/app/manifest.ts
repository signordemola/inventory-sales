import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NaijaStock",
    short_name: "NaijaStock",
    description: "Nigeria's enterprise inventory & POS system",
    start_url: "/pos",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#16a34a",
    orientation: "any",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
