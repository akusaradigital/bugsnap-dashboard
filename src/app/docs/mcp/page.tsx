import { pageMeta } from "@/lib/pageMeta";
import { McpDocsContent } from "./McpDocsContent";

export const metadata = pageMeta({
  title: "MCP for AI Agents - BugSnap",
  description: "Connect BugSnap to Claude Code, Cursor, or any MCP-compatible AI agent so it can create full bug reports, including recordings, with one command.",
  canonical: "/docs/mcp",
});

export default function McpDocsPage() {
  return <McpDocsContent />;
}
