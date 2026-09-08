import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/google-drive";
import { assertPublicUrl } from "@/lib/safe-url";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await authenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Valid Webhook URL is required" }, { status: 400 });
    }

    let target: URL;
    try {
      target = await assertPublicUrl(url);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid webhook URL" },
        { status: 400 }
      );
    }

    const payload = {
      content: "🚀 **BugSnap Webhook Test**: Connection established successfully! You will receive instant notifications whenever a new capture or bug report is saved.",
      text: "🚀 BugSnap Webhook Test: Connection established successfully! You will receive instant notifications whenever a new capture or bug report is saved.",
      embeds: [
        {
          title: "BugSnap Integration Test",
          description: "Your workspace is now wired to receive instant capture alerts with rich DevTools diagnostics.",
          color: 0x6366f1,
          fields: [
            { name: "Status", value: "Active", inline: true },
            { name: "Triggered By", value: user.email || "Workspace Admin", inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Don't let a redirect escape the public-address check above.
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      // Status only — echoing the response body turns this into a read primitive.
      return NextResponse.json(
        { error: `Webhook endpoint responded with status ${res.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach webhook endpoint" },
      { status: 500 }
    );
  }
}
