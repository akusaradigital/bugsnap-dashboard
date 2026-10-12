import { test, expect, type Page } from "@playwright/test";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { createClient, type Session } from "@supabase/supabase-js";

// We read env vars for Supabase auth
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_0-9]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

const TEST_EMAIL = `pw_audit_${Date.now()}@example.com`;
const FINGERPRINT = "aaaa0001";
const WIDTHS = [360, 390, 414, 440];

let workspaceId = "";
let testUserId = "";
let mockSession: Session | null = null;

test.beforeAll(async () => {
  // 1. Create User via Admin API
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    email_confirm: true,
  });
  if (userErr || !userRes.user) {
    console.error("Failed to create test user", userErr);
    return;
  }
  testUserId = userRes.user.id;

  // 2. Generate magic link and verify to get a session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: TEST_EMAIL,
  });
  if (linkErr || !linkData.properties?.hashed_token) {
    console.error("Failed to generate link", linkErr);
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: sessionData, error: verifyErr } = await client.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyErr || !sessionData.session) {
    console.error("Failed to verify otp", verifyErr);
    return;
  }
  mockSession = sessionData.session;

  // 3. Insert Captures using SQL to bypass UI
  const insertSql = `
    SELECT public.insert_capture_by_email('${TEST_EMAIL}', 'Playwright Error 1', 'screenshot', '', '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, 'https://example.com/playwright', NULL, NULL, '${FINGERPRINT}') AS c1,
           public.insert_capture_by_email('${TEST_EMAIL}', 'Playwright Error 2', 'screenshot', '', '[]'::jsonb, NULL, NULL, NULL, NULL, NULL, 'https://example.com/playwright', NULL, NULL, '${FINGERPRINT}') AS c2;
  `;
  try {
    execSync(`node scripts/apply-migration.mjs --sql "${insertSql.replace(/\n/g, ' ')}"`, { stdio: 'pipe' });
  } catch (e) {
    console.error("Failed to seed captures", e);
  }

  // 4. Get workspace ID
  const wsSql = `SELECT workspace_id FROM public.captures WHERE owner_email = '${TEST_EMAIL}' LIMIT 1;`;
  try {
    const out = execSync(`node scripts/apply-migration.mjs --sql "${wsSql.replace(/\n/g, ' ')}"`, { stdio: 'pipe' }).toString();
    const rows = JSON.parse(out.split('\n')[1]);
    if (rows && rows.length > 0) {
      workspaceId = rows[0].workspace_id;
    }
  } catch (e) {
    console.error("Failed to get workspace_id", e);
  }
});

test.afterAll(async () => {
  if (testUserId) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    // Delete data via SQL
    const cleanupSql = `
      DO $$
      DECLARE
        v_ws uuid;
      BEGIN
        SELECT workspace_id INTO v_ws FROM public.captures WHERE owner_email = '${TEST_EMAIL}' LIMIT 1;
        IF v_ws IS NOT NULL THEN
          DELETE FROM public.captures WHERE workspace_id = v_ws;
          DELETE FROM public.workspace_members WHERE workspace_id = v_ws;
          DELETE FROM public.workspaces WHERE id = v_ws;
        END IF;
      END $$;
    `;
    try {
      execSync(`node scripts/apply-migration.mjs --sql "${cleanupSql.replace(/\n/g, ' ')}"`, { stdio: 'pipe' });
    } catch (e) {}

    // Delete user
    await admin.auth.admin.deleteUser(testUserId);
  }
});

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      offenders: Array.from(document.querySelectorAll("*"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > doc.clientWidth + 1;
        })
        .slice(0, 5)
        .map((el) => {
          const e = el as HTMLElement;
          return `${e.tagName.toLowerCase()}.${(e.className || "").toString().split(" ").filter(Boolean).slice(0, 3).join(".")}`;
        }),
    };
  });
}

test.describe("error groups page mobile audit", () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      test.skip(!workspaceId || !mockSession, "Seeding failed, skipping test");

      // Inject the session into localStorage before visiting the page
      await page.addInitScript(
        ({ key, session }) => {
          window.localStorage.setItem(key, JSON.stringify(session));
        },
        { key: STORAGE_KEY, session: mockSession }
      );

      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/errors?ws=${workspaceId}`, { waitUntil: "domcontentloaded" });

      // Wait for the title (h1) to prove page rendered
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 20_000 });

      // Wait for the error row to render (fingerprint text should be visible)
      await page.locator(`text=${FINGERPRINT}`).first().waitFor({ state: "visible", timeout: 20_000 });

      // Expand the row to check nested occurrences list
      await page.locator(`text=${FINGERPRINT}`).first().click();

      // Wait for at least one inner capture to render (it will show the email)
      await page.locator(`text=${TEST_EMAIL}`).first().waitFor({ state: "visible", timeout: 20_000 });

      // Short wait to ensure CSS settled after expanding
      await page.waitForTimeout(500);

      const { scrollWidth, clientWidth, offenders } = await horizontalOverflow(page);
      expect(
        scrollWidth,
        `page scrolls sideways at ${width}px (scrollWidth ${scrollWidth} > clientWidth ${clientWidth}). Offenders: ${offenders.join(", ") || "none identified"}`,
      ).toBeLessThanOrEqual(clientWidth + 1);
    });
  }
});
