"use client";

import { useState } from "react";
import Link from "next/link";
import { StaticShell } from "@/components/StaticShell";
import { useT } from "@/components/I18nProvider";
import { Reveal } from "@/components/site/motion";
import { Icon } from "@/lib/iconify";

function CodeBlock({ code, copyKey, copiedKey, onCopy }: { code: string; copyKey: string; copiedKey: string | null; onCopy: (text: string, key: string) => void }) {
  const { t } = useT();
  return (
    <div className="rounded-lg border border-site-border bg-site-surface-2 p-4 font-mono text-xs min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center justify-end pb-2 mb-2 border-b border-site-border-subtle">
        <button
          type="button"
          onClick={() => onCopy(code, copyKey)}
          className="inline-flex items-center gap-1.5 text-xs text-site-text-2 hover:text-site-text px-2.5 py-1 min-h-[36px] rounded bg-site-surface border border-site-border-subtle transition-colors shrink-0 touch-manipulation"
        >
          <Icon icon={copiedKey === copyKey ? "lucide:check" : "lucide:copy"} className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{copiedKey === copyKey ? t("docs.terminalCopied") : t("docs.copyCode")}</span>
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-all text-site-text overflow-x-auto max-w-full w-full">{code}</pre>
    </div>
  );
}

export function McpDocsContent() {
  const { t } = useT();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const claudeCodeCmd = `claude mcp add --scope user -e BUGSNAP_API_KEY=bugsnap_xxx --transport stdio bugsnap -- npx -y bugsnap-mcp`;

  const claudeDesktopJson = `{
  "mcpServers": {
    "bugsnap": {
      "command": "npx",
      "args": ["-y", "bugsnap-mcp"],
      "env": {
        "BUGSNAP_API_KEY": "bugsnap_xxx"
      }
    }
  }
}`;

  const cursorJson = `{
  "mcpServers": {
    "bugsnap": {
      "command": "npx",
      "args": ["-y", "bugsnap-mcp"],
      "env": {
        "BUGSNAP_API_KEY": "bugsnap_xxx"
      }
    }
  }
}`;

  const inspectorCmd = `BUGSNAP_API_KEY=bugsnap_xxx npx @modelcontextprotocol/inspector npx -y bugsnap-mcp`;

  const clients = [
    {
      id: "claude-code",
      name: "Claude Code",
      icon: "lucide:terminal",
      code: claudeCodeCmd,
      note: "Writes to your user-level config, available in every project. Use --scope project instead to share it with your team via .mcp.json.",
    },
    {
      id: "claude-desktop",
      name: "Claude Desktop",
      icon: "lucide:bot",
      code: claudeDesktopJson,
      note: "Paste into claude_desktop_config.json, then fully restart Claude Desktop.\nmacOS: ~/Library/Application Support/Claude/claude_desktop_config.json\nWindows: %APPDATA%\\Claude\\claude_desktop_config.json",
    },
    {
      id: "cursor",
      name: "Cursor",
      icon: "lucide:mouse-pointer-click",
      code: cursorJson,
      note: "Paste into .cursor/mcp.json (project) or your global Cursor MCP settings.",
    },
  ];

  const tools = [
    { name: t("docs.mcpToolListName"), desc: t("docs.mcpToolListDesc") },
    { name: t("docs.mcpToolGetName"), desc: t("docs.mcpToolGetDesc") },
  ];

  return (
    <StaticShell title={t("docs.mcp")} subtitle={t("docs.mcpSubtitle")}>
      <div className="space-y-10 font-site">
        <Reveal>
          <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:zap" className="w-5 h-5 text-site-accent shrink-0" aria-hidden="true" />
              <h3 className="text-base font-bold text-site-text">{t("docs.mcp")}</h3>
            </div>
            <p className="text-xs text-site-text-2 leading-relaxed">{t("docs.mcpIntro")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-site-text">{t("docs.mcpStep1Title")}</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">{t("docs.mcpStep1Desc")}</p>
            <Link
              href="/settings?tab=integrations#bugsnap-api-keys"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              {t("docs.mcpStep1Cta")}
              <Icon icon="lucide:arrow-right" className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-5 shadow-xs min-w-0">
            <div>
              <h3 className="text-base font-bold text-site-text">{t("docs.mcpStep2Title")}</h3>
              <p className="text-xs text-site-text-2 leading-relaxed mt-1">{t("docs.mcpStep2Desc")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clients.map((client) => (
                <div key={client.id} className="rounded-lg border border-site-border-subtle p-3 sm:p-4 space-y-2.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon icon={client.icon} className="w-4 h-4 text-site-text-2 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-bold text-site-text">{client.name}</span>
                  </div>
                  <CodeBlock code={client.code} copyKey={client.id} copiedKey={copiedKey} onCopy={copyToClipboard} />
                  <p className="text-[11px] text-site-text-2 leading-relaxed whitespace-pre-line break-words">{client.note}</p>
                </div>
              ))}

              <div className="rounded-lg border border-site-border-subtle p-3 sm:p-4 space-y-2.5 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:link" className="w-4 h-4 text-site-text-2 shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-site-text">Any other MCP client</span>
                </div>
                <CodeBlock code={cursorJson} copyKey="generic" copiedKey={copiedKey} onCopy={copyToClipboard} />
                <p className="text-[11px] text-site-text-2 leading-relaxed">
                  Most MCP clients (Windsurf, Cline, VS Code, ...) read the same <code className="font-mono break-all">mcpServers</code> shape from their own config file.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-site-text">{t("docs.mcpStep3Title")}</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">{t("docs.mcpStep3Desc")}</p>
            <div className="space-y-2">
              <div className="rounded-lg bg-site-surface-2 border border-site-border-subtle px-3 py-2 text-xs text-site-text italic break-words">
                &ldquo;Fix this bug: https://bugsnap.akusaraproject.my.id/v/&lt;capture-id&gt;&rdquo;
              </div>
              <div className="rounded-lg bg-site-surface-2 border border-site-border-subtle px-3 py-2 text-xs text-site-text italic break-words">
                &ldquo;List my open BugSnap bugs&rdquo;
              </div>
            </div>
          </div>
        </Reveal>

        {/* Tools reference */}
        <Reveal delay={0.32}>
          <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-4 shadow-xs min-w-0">
            <div>
              <h3 className="text-base font-bold text-site-text">{t("docs.mcpToolsTitle")}</h3>
              <p className="text-xs text-site-text-2 leading-relaxed mt-1">{t("docs.mcpToolsDesc")}</p>
            </div>
            <div className="divide-y divide-site-border-subtle">
              {tools.map((tool) => (
                <div key={tool.name} className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 min-w-0">
                  <code className="text-xs font-mono font-semibold text-site-accent shrink-0 break-all sm:w-56">{tool.name}</code>
                  <p className="text-xs text-site-text-2 leading-relaxed min-w-0">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Test without a client */}
        <Reveal delay={0.4}>
          <div className="rounded-xl border border-site-border bg-site-surface p-4 sm:p-8 space-y-4 shadow-xs min-w-0">
            <h3 className="text-base font-bold text-site-text">{t("docs.mcpTestTitle")}</h3>
            <p className="text-xs text-site-text-2 leading-relaxed">{t("docs.mcpTestDesc")}</p>
            <CodeBlock code={inspectorCmd} copyKey="inspector" copiedKey={copiedKey} onCopy={copyToClipboard} />
          </div>
        </Reveal>

        <Reveal delay={0.48}>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/docs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              <Icon icon="lucide:arrow-left" className="w-3.5 h-3.5" aria-hidden="true" />
              {t("docs.title")}
            </Link>
            <span className="text-site-text-2 text-xs">•</span>
            <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
              {t("docs.contactSupport")}
            </Link>
          </div>
        </Reveal>
      </div>
    </StaticShell>
  );
}
