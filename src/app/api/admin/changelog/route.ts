import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { checkAdminAuth } from "@/lib/admin-auth";
import { parseChangelog } from "@/lib/changelog";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { authorized } = await checkAdminAuth(req);

  if (!authorized) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  try {
    const candidatePaths = [
      path.join(process.cwd(), "CHANGELOG.md"),
      path.join(process.cwd(), "../CHANGELOG.md"),
      path.join(__dirname, "../../../../../CHANGELOG.md"),
    ];

    let raw = "";
    for (const p of candidatePaths) {
      try {
        raw = await fs.readFile(p, "utf8");
        if (raw) break;
      } catch {
        // try next path
      }
    }

    if (!raw) {
      return NextResponse.json(
        { error: "CHANGELOG.md not found on server filesystem." },
        { status: 404 }
      );
    }

    const releases = parseChangelog(raw);
    const dates = Array.from(new Set(releases.map((r) => r.date).filter(Boolean)));

    return NextResponse.json({
      raw,
      releases,
      projects: [
        { id: "dashboard", label: "Dashboard", repo: "bugsnap-dashboard", version: "v0.14.0" },
        { id: "extension", label: "Extension", repo: "bugsnap-extension", version: "v1.0.72" },
        { id: "mcp", label: "MCP Server", repo: "bugsnap-mcp", version: "v0.3.1" },
      ],
      dates,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Failed to read changelog" },
      { status: 500 }
    );
  }
}
