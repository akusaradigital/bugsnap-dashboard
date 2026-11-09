import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase-server";

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bugsnap.akusaraproject.my.id";
const fullDayLogo = `${siteUrl}/bugsnap-full-day.png`;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  if (!id) return {};

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("get_public_capture", {
      p_id: id,
      p_password: null,
    });

    if (error || !data || data.length === 0) {
      return {};
    }

    const row = data[0] as {
      title?: string | null;
      type?: string | null;
      drive_url?: string | null;
      status?: string | null;
    };

    // If capture is locked, expired, not found, or otherwise restricted,
    // fall back to root layout generic BugSnap metadata (avoids leaking private info).
    if (row.status !== "ok") {
      return {};
    }

    const captureTitle = row.title?.trim() || "Bug Report";
    const typeLabel = row.type === "video" ? "Video recording" : "Annotated screenshot";
    const description = `${typeLabel} bug report shared via BugSnap.`;
    return {
      title: captureTitle,
      description,
      openGraph: {
        title: `BugSnap | ${captureTitle}`,
        description,
        type: "website",
        images: [
          {
            url: fullDayLogo,
            width: 1200,
            height: 1200,
            alt: "BugSnap - From Click to Fix",
          },
        ],
      },
      twitter: {
        card: "summary",
        title: `BugSnap | ${captureTitle}`,
        description,
        images: [fullDayLogo],
      },
    };
  } catch {
    return {};
  }
}

export default function SingleCaptureLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
