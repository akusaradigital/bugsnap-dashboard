# BugSnap Dashboard

> **From Click to Fix** - Screen recording, visual feedback, and instant developer-ready bug reports.

BugSnap helps QA teams, developers, product managers, and designers report and resolve bugs with visual evidence, sanitized diagnostics, and shareable capture context.

---

## Key Features

### Screenshot and Screen Capture

- Full-page capture and visible viewport capture.
- Selected-area capture with annotation support.
- Browser-to-dashboard share links for capture records.

### Video and Audio Recording

- Screen and tab recording with optional microphone, system audio, and webcam input.
- Video trimming and playback in the dashboard.

### Annotations and Privacy Redaction

- Arrows, rectangles, circles, text callouts, and numbered steps.
- Redaction for sensitive values before media or diagnostics are shared.

### Developer Diagnostics and Telemetry

- Console errors, unhandled exceptions, and failed network requests.
- User-action timeline and runtime environment information.
- Sanitized diagnostic data displayed alongside the capture.

### Dashboard Collaboration

- Capture records, share links, workspaces, comments, and status workflows.
- Public and protected capture views according to the active access settings.

## Authentication Synchronization

The dashboard and extension use a session bridge for the active BugSnap account:

- Dashboard login broadcasts the current user to the extension.
- Extension login can bootstrap the dashboard through the provider-token login route.
- Dashboard logout requests extension logout.
- Extension logout signs out the dashboard session and returns protected pages to `/login`.

The extension has no Supabase session of its own; extension writes use the approved RPC/API boundary.

## Validation

Validation is scoped to the affected route, component, or service by default. For UI changes, audit 360px–440px viewports with 16px gutters and zero horizontal overflow. For browser automation, use real public websites appropriate to the technical scenario.

Routine checks should target the changed area first. The full dashboard gate is reserved for release/commit validation or explicit full validation:

```bash
npm run typecheck && npm test && npm run build
```

For JSX/TSX changes, also run:

```bash
npm run lint
```

## Architecture

```text
Extension capture
  -> insert_capture_by_email() RPC / approved API boundary
  -> captures, comments, workspaces, workspace_members, capture_views
  <- Dashboard session and RLS-scoped reads
```

Capture media is uploaded to the user's Google Drive. The dashboard stores the capture record, share context, and sanitized diagnostics needed to display and collaborate on the report.

## Domain

The production application is served at `https://bugsnap.akusaraproject.my.id`. The `dashboard.akusaraproject.my.id` hostname redirects to the canonical domain.

## Static Asset and UI Rules

- All UI text must come from `src/lib/i18n.ts` through `useT()`, with both `en` and `id` keys.
- Use Iconify through the shared icon registry for interface icons.
- Keep the approved BugSnap logo artwork immutable and proportional.
- External avatar and branding images require a fallback handler.
- Do not add heavy gradients or competitor comparisons.
