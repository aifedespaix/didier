import type { Metadata } from "next";
import { SITE } from "~/config/site";

export function getBaseUrl(): string {
  // Prefer explicit public URL, then Vercel env, fallback to localhost
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  return (envUrl || SITE.url).replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function defaultMetadata(): Metadata {
  const base = getBaseUrl();
  return {
    metadataBase: new URL(base),
    title: {
      default: SITE.name,
      template: SITE.titleTemplate,
    },
    description: SITE.description,
    applicationName: SITE.name,
    generator: "Next.js",
    keywords: SITE.keywords,
    authors: [{ name: SITE.creator }],
    creator: SITE.creator,
    publisher: SITE.creator,
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      url: base,
      siteName: SITE.name,
      title: SITE.name,
      description: SITE.description,
      locale: SITE.locale,
      images: [
        {
          url: absoluteUrl(SITE.defaultOgImage),
          width: 1200,
          height: 630,
          alt: `${SITE.name} Open Graph`,
        },
      ],
    },
    twitter: {
      card: SITE.twitter.card,
      creator: SITE.twitter.handle,
      site: SITE.twitter.site,
      title: SITE.name,
      description: SITE.description,
      images: [absoluteUrl(SITE.defaultOgImage)],
    },
    robots: {
      index: process.env.NODE_ENV === "production",
      follow: process.env.NODE_ENV === "production",
      googleBot: {
        index: process.env.NODE_ENV === "production",
        follow: process.env.NODE_ENV === "production",
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "technology",
    alternates: {
      canonical: base,
    },
    icons: {
      icon: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
    themeColor: SITE.themeColor,
  } satisfies Metadata;
}

export function pageMetadata(
  params: {
    title?: string;
    description?: string;
    url?: string; // absolute or path
    image?: string; // absolute or path
    canonical?: string; // absolute or path
  } = {},
): Metadata {
  const base = getBaseUrl();
  const url = params.url ? absoluteUrl(params.url) : base;
  const image = params.image ? absoluteUrl(params.image) : absoluteUrl(SITE.defaultOgImage);
  const title = params.title || SITE.name;
  const description = params.description || SITE.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: params.canonical ? absoluteUrl(params.canonical) : url,
    },
  } satisfies Metadata;
}

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: base,
    sameAs: [
      // add socials if/when available
    ],
  } satisfies JsonLd;
}

export function webSiteJsonLd(): JsonLd {
  const base = getBaseUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: base,
    inLanguage: SITE.locale.replace("_", "-"),
    description: SITE.description,
  } satisfies JsonLd;
}
