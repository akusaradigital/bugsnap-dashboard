import type { Metadata } from "next";

const SITE_URL = "https://bugsnap.akusaraproject.my.id";
const OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: "BugSnap - From Click to Fix" };

/** Build page-level metadata with proper OG/Twitter cards. */
export function pageMeta(opts: {
  title: string;
  description: string;
  canonical: string;
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.canonical },
    openGraph: {
      type: "website",
      title: opts.title,
      description: opts.description,
      url: `${SITE_URL}${opts.canonical}`,
      siteName: "BugSnap",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: ["/opengraph-image.png"],
    },
  };
}
