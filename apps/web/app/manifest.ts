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
  };
}
