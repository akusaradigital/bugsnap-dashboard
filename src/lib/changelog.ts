export interface ChangelogItem {
  type: "feat" | "fix" | "perf" | "docs" | "chore" | "other";
  text: string;
}

export interface ChangelogRelease {
  id: string;
  project: "dashboard" | "extension" | "mcp";
  projectLabel: string;
  date: string;
  version: string;
  rawTitle: string;
  rawMarkdown: string;
  items: ChangelogItem[];
}

export function parseChangelog(md: string): ChangelogRelease[] {
  const lines = md.split(/\r?\n/);
  const releases: ChangelogRelease[] = [];
  let currentProject: "dashboard" | "extension" | "mcp" | null = null;
  let currentRelease: ChangelogRelease | null = null;

  for (const line of lines) {
    const projMatch = line.match(/^##\s+\[?(bugsnap-dashboard|bugsnap-extension|bugsnap-mcp|dashboard|extension|mcp)\]?/i);
    if (projMatch) {
      const raw = projMatch[1].toLowerCase();
      currentProject = raw.includes("dash") ? "dashboard" : raw.includes("ext") ? "extension" : "mcp";
      continue;
    }

    const relMatch = line.match(/^###\s+(.+)$/);
    if (relMatch && currentProject) {
      const title = relMatch[1].trim();
      const dateMatch = title.match(/(\d{4}-\d{2}-\d{2})/);
      const verMatch = title.match(/\b(v\d+\.\d+\.\d+(?:-[\w.]+)?)\b/i) || title.match(/\(([^)]+)\)/);
      const date = dateMatch ? dateMatch[1] : "";
      const version = verMatch ? verMatch[1] : "";
      const projLabel = currentProject === "dashboard" ? "Dashboard" : currentProject === "extension" ? "Extension" : "MCP";

      currentRelease = {
        id: `${currentProject}-${date || Math.random().toString(36).substring(2, 7)}`,
        project: currentProject,
        projectLabel: projLabel,
        date,
        version,
        rawTitle: title,
        rawMarkdown: "",
        items: [],
      };
      releases.push(currentRelease);
      continue;
    }

    if (currentRelease) {
      currentRelease.rawMarkdown += line + "\n";
      const itemMatch = line.match(/^[-*]\s+(.+)$/);
      if (itemMatch) {
        const itemContent = itemMatch[1].trim();
        const typeMatch = itemContent.match(/^\*\*?(feat|fix|perf|docs|chore|refactor)\*\*?:\s*(.+)$/i);
        if (typeMatch) {
          const rawType = typeMatch[1].toLowerCase();
          const mappedType: ChangelogItem["type"] =
            rawType === "refactor" ? "chore" : (rawType as ChangelogItem["type"]);
          currentRelease.items.push({
            type: mappedType,
            text: typeMatch[2].trim(),
          });
        } else {
          currentRelease.items.push({
            type: "other",
            text: itemContent,
          });
        }
      }
    }
  }

  return releases;
}
