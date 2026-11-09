import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const APP_DIR = path.join(SRC_DIR, "app");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

/**
 * Recursively discover all registered Next.js 14 App Router routes.
 * Accounts for route groups (e.g. (app)) which do not add segments to URL pathname.
 */
function discoverAppRoutes(appDir) {
  const routes = new Set();
  const dynamicRoutes = [];

  function traverse(dir, currentRoute = "") {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const seg = entry.name;
        // Route groups like (app) do not affect URL pathname
        const nextRoute = seg.startsWith("(") && seg.endsWith(")")
          ? currentRoute
          : `${currentRoute}/${seg}`;
        traverse(path.join(dir, seg), nextRoute);
      } else if (/^page\.(tsx|jsx|js|ts)$/.test(entry.name)) {
        const resolvedRoute = currentRoute === "" ? "/" : currentRoute;
        routes.add(resolvedRoute);
        if (resolvedRoute.includes("[")) {
          dynamicRoutes.push(resolvedRoute);
        }
      }
    }
  }

  traverse(appDir);
  return { routes, dynamicRoutes };
}

/**
 * Discover all registered API route handlers (/api/...).
 */
function discoverApiRoutes(appDir) {
  const apiRoutes = new Set();
  const apiDir = path.join(appDir, "api");
  if (!fs.existsSync(apiDir)) return apiRoutes;

  function traverse(dir, currentRoute = "/api") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        traverse(path.join(dir, entry.name), `${currentRoute}/${entry.name}`);
      } else if (/^route\.(ts|js)$/.test(entry.name)) {
        apiRoutes.add(currentRoute);
      }
    }
  }

  traverse(apiDir);
  return apiRoutes;
}

/**
 * Recursively discover all static assets in public/.
 */
function discoverPublicAssets(publicDir) {
  const assets = new Set();
  if (!fs.existsSync(publicDir)) return assets;

  function traverse(dir, relPath = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = relPath ? `${relPath}/${entry.name}` : `/${entry.name}`;
      if (entry.isDirectory()) {
        traverse(path.join(dir, entry.name), entryRel);
      } else {
        assets.add(entryRel);
      }
    }
  }

  traverse(publicDir);
  return assets;
}

/**
 * Walk directory and return all matching source code files.
 */
function walkSourceFiles(dir, extensions = [".tsx", ".ts", ".jsx", ".js"]) {
  const fileList = [];
  function traverse(current) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
          traverse(full);
        }
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        fileList.push(full);
      }
    }
  }
  traverse(dir);
  return fileList;
}

/**
 * Matches route pattern against dynamic route specifications.
 * e.g. /v/cap_123 against /v/[id]
 * /blog/some-slug against /blog/[slug]
 * /extension/firefox against /extension/[browser]
 */
function matchesDynamicRoute(cleanPath, dynamicRoutes) {
  for (const dynRoute of dynamicRoutes) {
    const regexPattern = "^" + dynRoute
      .replace(/\[\.\.\.([^\]]+)\]/g, "(.+)")
      .replace(/\[([^\]]+)\]/g, "([^/]+)") + "$";
    if (new RegExp(regexPattern).test(cleanPath)) {
      return true;
    }
  }
  return false;
}

function isValidRoute(cleanPath) {
  if (cleanPath === "" || cleanPath === "/") return true;
  return (
    REGISTERED_ROUTES.has(cleanPath) ||
    PUBLIC_ASSETS.has(cleanPath) ||
    API_ROUTES.has(cleanPath) ||
    matchesDynamicRoute(cleanPath, DYNAMIC_ROUTES)
  );
}

const { routes: REGISTERED_ROUTES, dynamicRoutes: DYNAMIC_ROUTES } = discoverAppRoutes(APP_DIR);
const API_ROUTES = discoverApiRoutes(APP_DIR);
const PUBLIC_ASSETS = discoverPublicAssets(PUBLIC_DIR);

// ---------------------------------------------------------------------------
// 1. App Router & Static Asset Inventory Discovery
// ---------------------------------------------------------------------------
describe("Zero-Broken-Link Quality Gate: Route & Asset Discovery", () => {
  it("discovers all registered Next.js 14 App Router routes successfully", () => {
    assert(REGISTERED_ROUTES.size >= 40, `Expected at least 40 registered routes, found ${REGISTERED_ROUTES.size}`);
    assert(REGISTERED_ROUTES.has("/"), "Root landing page '/' must be registered");
    assert(REGISTERED_ROUTES.has("/dashboard"), "/dashboard must be registered");
    assert(REGISTERED_ROUTES.has("/captures"), "/captures must be registered");
    assert(REGISTERED_ROUTES.has("/settings"), "/settings must be registered");
    assert(REGISTERED_ROUTES.has("/docs"), "/docs must be registered");
    assert(REGISTERED_ROUTES.has("/docs/integrations"), "/docs/integrations must be registered");
    assert(REGISTERED_ROUTES.has("/docs/mcp"), "/docs/mcp must be registered");
    assert(REGISTERED_ROUTES.has("/features"), "/features must be registered");
    assert(REGISTERED_ROUTES.has("/solutions"), "/solutions must be registered");
    assert(REGISTERED_ROUTES.has("/how-it-works"), "/how-it-works must be registered");
    assert(REGISTERED_ROUTES.has("/pricing"), "/pricing must be registered");
    assert(REGISTERED_ROUTES.has("/blog"), "/blog must be registered");
    assert(REGISTERED_ROUTES.has("/blog/[slug]"), "/blog/[slug] dynamic route must be registered");
    assert(REGISTERED_ROUTES.has("/extension"), "/extension must be registered");
    assert(REGISTERED_ROUTES.has("/extension/[browser]"), "/extension/[browser] dynamic route must be registered");
    assert(REGISTERED_ROUTES.has("/v/[id]"), "/v/[id] dynamic capture view route must be registered");
    assert(REGISTERED_ROUTES.has("/visual-compare"), "/visual-compare must be registered");
    assert(REGISTERED_ROUTES.has("/compare"), "/compare must be registered");
    assert(REGISTERED_ROUTES.has("/admin"), "/admin must be registered");
  });

  it("discovers public static assets and verifies essential brand vectors", () => {
    assert(PUBLIC_ASSETS.size > 20, "Expected static assets in public/");
    assert(PUBLIC_ASSETS.has("/logo-day.svg"), "logo-day.svg must exist in public/");
    assert(PUBLIC_ASSETS.has("/logo-dark.svg"), "logo-dark.svg must exist in public/");
    assert(PUBLIC_ASSETS.has("/icon.svg"), "icon.svg must exist in public/");
    assert(PUBLIC_ASSETS.has("/bugsnap-404.svg"), "bugsnap-404.svg must exist in public/");
    assert(PUBLIC_ASSETS.has("/bugsnap-404-dark.svg"), "bugsnap-404-dark.svg must exist in public/");
  });
});

// ---------------------------------------------------------------------------
// 2. Global Codebase UI Link Crawler & Dead Route Verification
// ---------------------------------------------------------------------------
describe("Zero-Broken-Link Quality Gate: Global Link Crawler", () => {
  const srcFiles = walkSourceFiles(SRC_DIR);

  // Regex patterns to extract links
  // 1. JSX href="..." or href='...'
  const regexHrefQuotes = /<[a-zA-Z0-9_.]+\s+[^>]*?href\s*=\s*["']([^"']+)["']/g;
  // 2. JSX href={"..."} or href={'...'}
  const regexHrefBraces = /<[a-zA-Z0-9_.]+\s+[^>]*?href\s*=\s*\{\s*["']([^"']+)["']\s*\}/g;
  // 3. JSX href={`...`}
  const regexHrefTemplate = /<[a-zA-Z0-9_.]+\s+[^>]*?href\s*=\s*\{\s*`([^`]+)`\s*\}/g;
  // 4. Object property href: "..." or href: '...'
  const regexHrefProp = /\bhref\s*:\s*["']([^"']+)["']/g;
  // 5. Object property href: `...`
  const regexHrefPropTemplate = /\bhref\s*:\s*`([^`]+)`/g;

  const extractedLinks = [];

  for (const filePath of srcFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

    const scan = (regex, type) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const rawHref = match[1];
        const line = content.slice(0, match.index).split("\n").length;
        extractedLinks.push({ file: relPath, rawHref, type, line });
      }
    };

    scan(regexHrefQuotes, "jsx-quote");
    scan(regexHrefBraces, "jsx-brace");
    scan(regexHrefTemplate, "jsx-template");
    scan(regexHrefProp, "prop-quote");
    scan(regexHrefPropTemplate, "prop-template");
  }

  it("ensures zero empty '#' or '#/' placeholder links in UI", () => {
    const invalidPlaceholders = extractedLinks.filter((item) => {
      const trimmed = item.rawHref.trim();
      return trimmed === "#" || trimmed === "" || trimmed === "#/" || trimmed === "javascript:void(0)" || trimmed === "javascript:;";
    });

    assert.deepEqual(
      invalidPlaceholders,
      [],
      `Found ${invalidPlaceholders.length} empty '#' or dead placeholder links:\n` +
        invalidPlaceholders.map((p) => `  - ${p.file}:${p.line} -> '${p.rawHref}'`).join("\n")
    );
  });

  it("validates in-page anchor links point to existing IDs in the respective file or layout", () => {
    // Collect local in-page anchors: href="#some-anchor"
    const inPageAnchors = extractedLinks.filter(
      (item) => item.rawHref.startsWith("#") && item.rawHref.length > 1
    );

    assert(inPageAnchors.length > 0, "Expected in-page skip/anchor links to be found");

    for (const anchorItem of inPageAnchors) {
      const anchorId = anchorItem.rawHref.slice(1);
      // Skip dynamic template anchors like #${h.id}
      if (anchorId.includes("${")) continue;

      const fileContent = fs.readFileSync(path.join(ROOT_DIR, anchorItem.file), "utf8");
      const hasId =
        fileContent.includes(`id="${anchorId}"`) ||
        fileContent.includes(`id='${anchorId}'`) ||
        fileContent.includes(`id={\`${anchorId}\`}`) ||
        fileContent.includes(`id="${anchorId}`);

      // Accessibility skip links like #main-content or #main-admin-content can be targeted across layout
      let layoutHasId = false;
      if (!hasId && (anchorId === "main-content" || anchorId === "main-admin-content")) {
        const layoutFile = anchorId === "main-admin-content"
          ? path.join(APP_DIR, "admin/layout.tsx")
          : path.join(APP_DIR, "(app)/layout.tsx");
        if (fs.existsSync(layoutFile)) {
          const layoutContent = fs.readFileSync(layoutFile, "utf8");
          layoutHasId = layoutContent.includes(`id="${anchorId}"`);
        }
      }

      assert(
        hasId || layoutHasId,
        `In-page anchor '${anchorItem.rawHref}' in ${anchorItem.file}:${anchorItem.line} does not target any element with id='${anchorId}'`
      );
    }
  });

  it("validates every internal link (starting with '/') resolves to a valid route, asset, or API handler", () => {
    const internalLinks = extractedLinks.filter((item) => item.rawHref.startsWith("/"));
    assert(internalLinks.length > 30, "Expected multiple internal links across codebase");

    const deadLinks = [];

    for (const item of internalLinks) {
      // Normalize dynamic template strings: e.g. `/v/${item.id}` -> `/v/test-slug`
      let normalized = item.rawHref.replace(/\$\{[^}]+\}/g, "test-slug");

      // Strip query parameters and hash fragments
      const cleanPath = normalized.split("?")[0].split("#")[0];

      // Empty string means it was just an anchor on root e.g. /#features
      if (cleanPath === "" || cleanPath === "/") continue;

      const isValid =
        REGISTERED_ROUTES.has(cleanPath) ||
        PUBLIC_ASSETS.has(cleanPath) ||
        API_ROUTES.has(cleanPath) ||
        matchesDynamicRoute(cleanPath, DYNAMIC_ROUTES);

      if (!isValid) {
        deadLinks.push({
          file: item.file,
          line: item.line,
          rawHref: item.rawHref,
          cleanPath,
        });
      }
    }

    assert.deepEqual(
      deadLinks,
      [],
      `Found ${deadLinks.length} broken or dead internal links:\n` +
        deadLinks.map((d) => `  - ${d.file}:${d.line} -> '${d.rawHref}' (unresolved path: '${d.cleanPath}')`).join("\n")
    );
  });

  it("ensures zero legacy '/c/' capture route typos remain across all src/ files", () => {
    const legacyTypos = [];
    for (const filePath of srcFiles) {
      const content = fs.readFileSync(filePath, "utf8");
      const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

      // Check for /c/ capture references
      const regexC = /(?:href\s*[:=]|url\s*[:=]|domain\s*[:=]|\/)[^"'`]*?\/c\/([a-zA-Z0-9_${}]+)/g;
      let match;
      while ((match = regexC.exec(content)) !== null) {
        // Exclude legitimate words or comments if any
        legacyTypos.push({
          file: relPath,
          match: match[0],
          line: content.slice(0, match.index).split("\n").length,
        });
      }
    }

    assert.deepEqual(
      legacyTypos,
      [],
      `Found legacy '/c/' capture route typos in src/:\n` +
        legacyTypos.map((t) => `  - ${t.file}:${t.line} -> '${t.match}'`).join("\n")
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Specific Key UI Surface Audits
// ---------------------------------------------------------------------------
describe("Zero-Broken-Link Quality Gate: Critical UI Surface Contracts", () => {
  it("ensures SiteNavbar navLinks and auth CTAs point to registered App Router routes", () => {
    const navbarFile = path.join(SRC_DIR, "components/site/SiteNavbar.tsx");
    const content = fs.readFileSync(navbarFile, "utf8");

    // Extract navLinks array items
    const navLinksMatch = content.match(/const\s+navLinks\s*=\s*\[([\s\S]*?)\];/);
    assert(navLinksMatch, "SiteNavbar must define navLinks array");

    const hrefs = [...navLinksMatch[1].matchAll(/href:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    assert(hrefs.length >= 5, "SiteNavbar must include primary navigation links");

    for (const href of hrefs) {
      assert(
        REGISTERED_ROUTES.has(href),
        `SiteNavbar link '${href}' must be a registered App Router route`
      );
    }

    // Verify auth CTAs
    assert(content.includes('href="/dashboard"'), "SiteNavbar must link logged-in user to /dashboard");
    assert(content.includes('href="/login"'), "SiteNavbar must link guest user to /login");
    assert(content.includes('href="/"'), "SiteNavbar brand must link to '/'");
  });

  it("ensures SiteFooter links strictly resolve to live routes and verified store endpoints", () => {
    const footerFile = path.join(SRC_DIR, "components/site/SiteFooter.tsx");
    const content = fs.readFileSync(footerFile, "utf8");

    // Extract all Link hrefs in SiteFooter
    const footerHrefs = [...content.matchAll(/<Link\s+[^>]*?href=(?:["']([^"']+)["']|\{([^}]+)\})/g)].map(
      (m) => m[1] || m[2]
    );

    for (const href of footerHrefs) {
      // Dynamic ternary like {isLoggedIn ? "/compare" : "/visual-compare"}
      if (href.includes("?")) {
        const matches = [...href.matchAll(/["'](\/[^"']+)["']/g)].map((m) => m[1]);
        for (const target of matches) {
          assert(
            isValidRoute(target),
            `SiteFooter ternary route '${target}' must be a valid registered App Router route`
          );
        }
      } else if (href.startsWith("/")) {
        const clean = href.split("#")[0];
        assert(
          isValidRoute(clean),
          `SiteFooter link '${clean}' must be a valid registered App Router route`
        );
      }
    }

    // Check store URLs in SiteFooter
    assert(content.includes("FIREFOX_STORE_URL"), "SiteFooter must reference FIREFOX_STORE_URL");
    // Microsoft Edge is intentionally hidden from UI until the feature is ready across all pages.
    assert(!content.includes("EDGE_STORE_URL"), "SiteFooter must not reference removed EDGE_STORE_URL");
    assert(content.includes("CHROME_STORE_URL"), "SiteFooter must reference CHROME_STORE_URL");
  });

  it("ensures HelpMenu links all direct to valid routes and official stores", () => {
    const helpFile = path.join(SRC_DIR, "components/HelpMenu.tsx");
    const content = fs.readFileSync(helpFile, "utf8");

    const helpHrefs = [...content.matchAll(/href=(?:["']([^"']+)["']|\{([^}]+)\})/g)].map(
      (m) => m[1] || m[2]
    );

    for (const href of helpHrefs) {
      if (href.startsWith("/")) {
        const clean = href.split("?")[0].split("#")[0];
        assert(
          isValidRoute(clean),
          `HelpMenu link '${clean}' must be a registered App Router route`
        );
      }
    }

    assert(!content.includes("/extension/edge"), "HelpMenu must not route Edge after Edge support removal");
    assert(content.includes("FIREFOX_STORE_URL"), "HelpMenu must route Firefox to the live Mozilla Add-ons listing via FIREFOX_STORE_URL");
    assert(content.includes("CHROME_STORE_URL"), "HelpMenu must route Chrome to CHROME_STORE_URL");
  });

  it("ensures all 14 ADMIN_NAV_ROUTES and all 6 ADMIN_NAV_HUBS resolve to valid routes", () => {
    const adminNavFile = path.join(APP_DIR, "admin/adminNav.ts");
    const content = fs.readFileSync(adminNavFile, "utf8");

    const routeHrefs = [...content.matchAll(/href:\s*["'](\/admin[^"']*)["']/g)].map((m) => m[1]);
    assert(routeHrefs.length >= 14, `Expected at least 14 admin routes, found ${routeHrefs.length}`);

    for (const href of routeHrefs) {
      assert(
        isValidRoute(href),
        `Admin nav route '${href}' in adminNav.ts must be a registered App Router route`
      );
    }
  });

  it("ensures DocsContent and IntegrationsDocsContent integration anchors and routes are valid", () => {
    const docsFile = path.join(APP_DIR, "docs/DocsContent.tsx");
    const docsContent = fs.readFileSync(docsFile, "utf8");

    assert(docsContent.includes("/docs/integrations"), "Docs must link to /docs/integrations");
    assert(docsContent.includes("/docs/mcp"), "Docs must link to /docs/mcp");
    assert(docsContent.includes("/settings"), "Docs must link to /settings");

    const intDocsFile = path.join(APP_DIR, "docs/integrations/IntegrationsDocsContent.tsx");
    const intContent = fs.readFileSync(intDocsFile, "utf8");

    // All integration anchors must exist
    const supportedIds = ["github", "gitlab", "jira", "linear", "azure", "clickup", "asana", "slack", "webhook", "aksora", "snaptest"];
    for (const id of supportedIds) {
      assert(
        intContent.includes(`id: "${id}"`) || intContent.includes(`id="${id}"`),
        `IntegrationsDocsContent must define anchor or entry for '${id}'`
      );
    }
    assert(intContent.includes('id="quick-test"'), "Pre-flight probe anchor #quick-test must exist");
  });

  it("ensures Settings page internal links resolve to valid routes", () => {
    const settingsFile = path.join(APP_DIR, "(app)/settings/page.tsx");
    const content = fs.readFileSync(settingsFile, "utf8");

    assert(content.includes('href="/upgrade"'), "Settings must link upgrade CTAs to /upgrade");
    assert(content.includes('href="/docs/integrations"'), "Settings must link to /docs/integrations");
    assert(
      content.includes('id="bugsnap-api-keys"'),
      "Settings must contain #bugsnap-api-keys anchor for MCP deep linking"
    );
  });

  it("ensures InProgressView default back route is valid and leads to home or dashboard", () => {
    const inProgressFile = path.join(SRC_DIR, "components/InProgressView.tsx");
    const content = fs.readFileSync(inProgressFile, "utf8");

    assert(content.includes('backHref = "/"'), "InProgressView default back route must be '/'");
    assert(content.includes('href="/dashboard"'), "InProgressView must provide link to /dashboard");
  });

  it("ensures 404 NotFound page navigation and legal links resolve to live routes", () => {
    const notFoundFile = path.join(APP_DIR, "not-found.tsx");
    const content = fs.readFileSync(notFoundFile, "utf8");

    assert(content.includes('href="/"'), "NotFound must link to home '/'");
    assert(content.includes('href="/dashboard"'), "NotFound must link to '/dashboard'");
    assert(content.includes('href="/terms"'), "NotFound must link to '/terms'");
    assert(content.includes('href="/privacy"'), "NotFound must link to '/privacy'");
    assert(content.includes('href="/contact#complaint"'), "NotFound must link to '/contact#complaint'");
  });

  it("ensures comparison pages (/compare and /visual-compare) link to valid routes", () => {
    const vcFile = path.join(APP_DIR, "visual-compare/VisualCompareContent.tsx");
    const vcContent = fs.readFileSync(vcFile, "utf8");
    assert(vcContent.includes('href="/compare"'), "VisualCompare must link to /compare");
    assert(vcContent.includes('href="/"'), "VisualCompare must link to /");
    assert(vcContent.includes("CHROME_STORE_URL"), "VisualCompare must link to Chrome Store");

    const compareFile = path.join(APP_DIR, "(app)/compare/page.tsx");
    const compareContent = fs.readFileSync(compareFile, "utf8");
    assert(
      compareContent.includes("/captures"),
      "Compare page must link back to /captures"
    );
  });

  it("ensures CaptureFooter links all resolve to valid routes and external stores", () => {
    const cfFile = path.join(SRC_DIR, "components/CaptureFooter.tsx");
    const cfContent = fs.readFileSync(cfFile, "utf8");

    const links = [...cfContent.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
    assert(links.length >= 10, "CaptureFooter must include navigation links");

    for (const link of links) {
      const clean = link.split("#")[0];
      assert(
        isValidRoute(clean),
        `CaptureFooter link '${clean}' must be a valid registered App Router route`
      );
    }
  });

  it("ensures marketing pages (features, solutions, how-it-works, pricing, contact, welcome) link to valid routes", () => {
    const pagesToCheck = [
      { file: "features/FeaturesContent.tsx", expected: ["/docs", "/"] },
      { file: "solutions/SolutionsContent.tsx", expected: ["/"] },
      { file: "how-it-works/HowItWorksContent.tsx", expected: ["/"] },
      { file: "pricing/PricingToggle.tsx", expected: ["/login", "/contact"] },
      { file: "contact/ContactContent.tsx", expected: ["/", "/privacy", "/terms", "/docs", "/help"] },
      { file: "welcome/WelcomeContent.tsx", expected: ["/", "/dashboard", "/login", "/extension"] },
    ];

    for (const { file, expected } of pagesToCheck) {
      const filePath = path.join(APP_DIR, file);
      assert(fs.existsSync(filePath), `Page file ${file} must exist`);
      const content = fs.readFileSync(filePath, "utf8");
      for (const route of expected) {
        assert(
          content.includes(`"${route}"`) || content.includes(`'${route}'`),
          `${file} must contain valid link to '${route}'`
        );
        assert(isValidRoute(route), `Route '${route}' in ${file} must be valid`);
      }
    }
  });

  it("ensures blog list and detail pages link to valid blog posts and anchors", () => {
    const blogListFile = path.join(APP_DIR, "blog/BlogListContent.tsx");
    const blogListContent = fs.readFileSync(blogListFile, "utf8");
    assert(blogListContent.includes("/blog/${"), "BlogListContent must link to dynamic /blog/${...}");

    const blogPostFile = path.join(APP_DIR, "blog/[slug]/BlogPostContent.tsx");
    const blogPostContent = fs.readFileSync(blogPostFile, "utf8");
    assert(blogPostContent.includes('href="/"'), "BlogPostContent must link to home");
    assert(blogPostContent.includes('href="/blog"'), "BlogPostContent must link to /blog");
    assert(blogPostContent.includes("href={`#${h.id}`}"), "BlogPostContent must link TOC to `#${h.id}`");
  });
});
