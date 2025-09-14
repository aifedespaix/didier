import type { MetadataRoute } from "next";
import { getBaseUrl } from "~/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();
  const isProd = process.env.NODE_ENV === "production";
  return {
    rules: [
      {
        userAgent: "*",
        allow: isProd ? "/" : [],
        disallow: isProd ? ["/api/"] : ["/"],
      },
    ],
    sitemap: isProd ? `${base}/sitemap.xml` : undefined,
    host: base,
  };
}

