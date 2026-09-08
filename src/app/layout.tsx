import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BugSnap - Free Bug Reporting Tool & Screen Recorder for Chrome",
    template: "%s | BugSnap",
  },
  description:
    "BugSnap is a free screen recorder and developer bug reporting tool. Capture screenshots, screen videos with audio, console errors, and network logs saved straight to your Google Drive.",
  keywords: [
    "bug reporting tool",
    "screen recorder chrome extension",
    "bug reporter",
    "developer screen recorder",
    "devtools recorder",
    "console log recorder",
    "network request recorder",
    "qa testing tool",
    "visual bug tracker",
    "screen capture chrome",
    "screen recording google drive",
    "rekam layar chrome",
    "aplikasi bug report",
    "BugSnap",
    "From Click to Fix",
    "akusara digital",
  ],
  authors: [{ name: "Akusara Digital", url: "https://akusaradigital.com" }],
  creator: "Akusara Digital",
  publisher: "BugSnap",
  applicationName: "BugSnap",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "BugSnap",
    title: "BugSnap - Free Bug Reporting Tool & Screen Recorder for Chrome",
    description:
      "Capture bugs with console logs, network requests, and screen recordings in one click. Free Chrome extension with automatic Google Drive storage.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "BugSnap - From Click to Fix" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BugSnap - Free Bug Reporting Tool & Screen Recorder for Chrome",
    description:
      "Capture bugs with console logs, network requests, and screen recordings in one click. Free Chrome extension with automatic Google Drive storage.",
    images: ["/twitter-image.png"],
  },
  verification: {
    google: "googlee6dec3ee74d840e8.html",
  },
  other: {
    "google-site-verification": "googlee6dec3ee74d840e8.html",
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#software`,
      name: "BugSnap",
      alternateName: "BugSnap - From Click to Fix",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Chrome, Windows, macOS, Linux",
      url: siteUrl,
      downloadUrl: "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf",
      installUrl: "https://chromewebstore.google.com/detail/klbgjodcbhopcjpfehjkbgofjdelohlf",
      description:
        "BugSnap is an all-in-one bug reporting tool and screen recorder for Chrome. Capture screenshots and video recordings with console errors and network logs, stored directly in Google Drive.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Organization",
        name: "Akusara Digital",
        url: "https://akusaradigital.com",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "BugSnap",
      description: "Bug Reporting Tool and Screen Recorder for Chrome",
      publisher: {
        "@type": "Organization",
        name: "Akusara Digital",
        url: "https://akusaradigital.com",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${siteUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How does the Google Drive integration work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All captures are stored directly in your own Google Drive under a dedicated BugSnap folder. You retain full ownership and control of your files - delete or manage them anytime from Drive. We never hold your recordings on our servers.",
          },
        },
        {
          "@type": "Question",
          name: "Are the attached DevTools logs secure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Only diagnostic information - console errors, failed requests, and environment metadata - is captured. Sensitive data like passwords and tokens is never recorded.",
          },
        },
        {
          "@type": "Question",
          name: "Is BugSnap really free forever?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! The core screen recorder and Google Drive storage integration is completely free. Paid plans unlock advanced team controls for growing teams.",
          },
        },
        {
          "@type": "Question",
          name: "Do my team members need the extension to view links?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Anyone you share a link with can view the recording, screenshots, and attached context directly in their web browser without downloading the extension.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <I18nProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
