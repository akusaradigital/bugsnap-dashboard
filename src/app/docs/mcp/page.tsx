import { pageMeta } from "@/lib/pageMeta";
import { McpDocsContent } from "./McpDocsContent";

export const metadata = pageMeta({
  title: "Connect BugSnap to Claude Code, Cursor & MCP Agents",
  description: "Connect BugSnap to Claude Code, Claude Desktop, Cursor, or any MCP-compatible AI agent so it can read full bug report context - including the screenshot - with one tool call.",
  canonical: "/docs/mcp",
});

export default function McpDocsPage() {
  return <McpDocsContent />;
}
