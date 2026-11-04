# BugSnap Workspace Changelog

All notable changes across `bugsnap-dashboard`, `bugsnap-extension`, and `bugsnap-mcp` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/).

---

## [bugsnap-dashboard]

### 2026-11-04 (v0.14.1)
- **fix**: Clean blog card UI by removing decorative sparkle icon clutter from blog articles
- **fix**: Remove hardcoded English strings and align marketing i18n dictionaries
- **perf**: Verify mobile 360px-440px viewport containment on public capture view with zero horizontal overflow
- **chore**: Authenticated real browser E2E verification across dashboard and extension

### 2026-11-04 (v0.14.0)
- **feat**: Admin Changelog viewer reading directly from repository markdown with project & date filters
- **feat**: Dual-view mode (colored cards and raw GitHub markdown) with copy-to-clipboard support
- **feat**: In-progress placeholder view and dedicated browser progress pages for Edge and Firefox
- **fix**: Clean breadcrumb aesthetics by removing decorative badge pills across all pages
- **fix**: Visual Compare route preserved for all users without forced authentication redirect
- **fix**: Status page real-time latency ping with dynamic Supabase health probe replacing static metrics
- **fix**: Strict dropdown contract enforcement via unified custom `<Dropdown />` component
- **docs**: Setup and integration guides for Google Gemini, Linear, Notion, and Slack

### 2026-11-02 (v0.12.0)
- **feat**: Welcome onboarding page with browser-specific installation guidance
- **feat**: Per-browser keyboard shortcut guide for macOS, Windows, and Linux
- **feat**: Extension session bridge for automatic web-to-extension authentication handshake
- **fix**: Keep extension authenticated during anonymous web previews and public link visits
- **fix**: Breadcrumb styling consistency across all marketing and documentation pages

### 2026-10-28 (v0.11.0)
- **feat**: StarAdmin dashboard redesign with responsive KPI metrics and telemetry sparklines
- **feat**: Offline Lucide icon registry for zero CDN latency and deterministic packaging
- **fix**: Mobile viewport containment audit for 360px-440px screens with zero horizontal overflow
- **perf**: In-memory cache for admin telemetry and database pool health checks

---

## [bugsnap-extension]

### 2026-11-04 (v1.0.73)
- **fix**: Enforce tabular-nums and fixed 52px width on floating recording timer pill to prevent layout jitter
- **fix**: Prevent temporal dead zone ReferenceErrors in annotation editor initialization
- **fix**: Native browser permission prompts for camera and microphone in extension settings
- **feat**: Real browser E2E test suites for production websites (GitHub CSP, Vue.js, Shoelace, Infinite Scroll, Wikipedia)
- **feat**: Authenticated persistent browser E2E test suite verifying two-way session synchronization

### 2026-11-04 (v1.0.72)
- **feat**: Mozilla Firefox AMO packaging compliance with zero validation warnings
- **feat**: Full Android Firefox support verified for mobile screen and bug captures
- **fix**: POSIX forward slash normalization for ZIP packaging preventing AMO archive path rejection
- **fix**: Gecko/Firefox manifest isolation strictly excluding Chromium-only offscreen documents
- **fix**: Microsoft Edge vendor settings isolation and minimum version tagging
- **fix**: Options page and popup layout resilience across mobile and desktop viewports
- **fix**: Unified custom dropdown components across all extension screens

### 2026-10-31 (v1.0.70)
- **feat**: High-DPI screen recording support with zero frame drop
- **feat**: Streamlined quick annotation tools (arrows, blur, rectangle, text labels)
- **fix**: Prevent tab capture timeout on background tabs during long reproduction runs
- **fix**: Redaction engine client-side isolation preventing token leakage in RAM

### 2026-10-25 (v1.0.69)
- **feat**: Enhanced Network tab payload capture with client-side header redaction
- **feat**: Automatic console stack trace mapping with original source file references
- **fix**: Redact Authorization bearer tokens and passwords before memory serialization
- **fix**: Graceful fallback when user denies microphone or tab capture permissions

---

## [bugsnap-mcp]

### 2026-11-04 (v0.3.1)
- **feat**: Synthesized Playwright test generation from recorded bug captures
- **feat**: Automatic safe configuration generator via `--config` CLI flag
- **feat**: Read-scoped API key authentication with standard stdio transport for AI agents
- **feat**: Model Context Protocol tools: `bugsnap_list_captures` and `bugsnap_get_capture`
- **feat**: Multimodal AI triage prompts tailored for Claude Code, Claude Desktop, Cursor, and Windsurf
