export type SiteConfig = {
  name: string;
  titleTemplate: string;
  description: string;
  /** hostname with protocol, no trailing slash */
  url: string;
  locale: string;
  twitter: {
    handle: string;
    site: string;
    card: "summary" | "summary_large_image";
  };
  creator: string;
  themeColor: string;
  defaultOgImage: string;
  keywords: string[];
};

export const SITE: SiteConfig = {
  name: "Didier",
  titleTemplate: "%s • Didier",
  description:
    "Didier est une application 3D interactive construite avec Next.js, React Three Fiber et Rapier pour des expériences fluides et performantes.",
  url: "https://didier.local", // override via env NEXT_PUBLIC_SITE_URL
  locale: "fr_FR",
  twitter: {
    handle: "@didier_app",
    site: "@didier_app",
    card: "summary_large_image",
  },
  creator: "Didier Team",
  themeColor: "#0ea5e9", // sky-500
  defaultOgImage: "/opengraph-image",
  keywords: [
    "Didier",
    "Next.js",
    "React",
    "Three.js",
    "React Three Fiber",
    "Rapier",
    "Jeu 3D",
  ],
};
