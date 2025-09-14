import type { MetadataRoute } from "next";
import { getBaseUrl } from "~/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
  return urls;
}

