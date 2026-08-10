import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WildGap",
    short_name: "WildGap",
    description: "Turn biodiversity observation gaps into field missions.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f2",
    theme_color: "#173f35",
  };
}
