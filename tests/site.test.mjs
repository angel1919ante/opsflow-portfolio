import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const base = "http://127.0.0.1:4173";
const chrome = process.env.CHROME_PATH || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined);
const server = spawn(process.execPath, ["scripts/server.mjs"], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
await once(server.stdout, "data");
const browser = await chromium.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}) });

async function assertNoHorizontalOverflow(page, label) {
  const sizes = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  assert.ok(sizes.scrollWidth <= sizes.clientWidth + 1, `${label} has horizontal overflow: ${sizes.scrollWidth} > ${sizes.clientWidth}`);
}

async function assertMediaLoaded(page, label) {
  const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
  assert.deepEqual(brokenImages, [], `${label} has broken images`);
  for (const source of await page.locator("video source").evaluateAll((sources) => sources.map((source) => source.src))) {
    const response = await page.request.get(source);
    assert.ok(response.ok(), `${label} has unavailable video: ${source}`);
  }
}

async function scanFiles(directory) {
  const entries = await readdir(directory);
  const findings = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "assets"].includes(entry)) continue;
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) findings.push(...await scanFiles(path));
    else if (path.endsWith("tests/site.test.mjs")) continue;
    else if ([".html", ".js", ".mjs", ".md", ".css", ".csv", ".json", ".yml"].includes(extname(path))) {
      const content = await readFile(path, "utf8");
      if (/(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN PRIVATE KEY-----|TELEGRAM_BOT_TOKEN\s*=\s*\S+|OPENAI_API_KEY\s*=\s*\S+)/.test(content)) findings.push(path);
    }
  }
  return findings;
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(await page.title(), "OpsFlow | Custom CRM workflow prototypes");
  assert.equal(await page.locator("h1").textContent(), "Replace workflow friction with a tool your team can use.");
  assert.equal(await page.locator("img:not([alt]), img[alt='']").count(), 0, "Every portfolio image needs alt text");
  await assertNoHorizontalOverflow(page, "marketing desktop");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, "marketing mobile");
  assert.ok(await page.locator(".hero-product").isVisible(), "Live product preview should remain visible on mobile");

  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  await page.click("#reset-demo");
  await page.click("#primary-action");
  await page.fill("[name='company']", "Stonebridge Home Services");
  await page.fill("[name='contact']", "Naomi Price");
  await page.fill("[name='need']", "Connect estimates to scheduled work");
  await page.click("#lead-form button[value='submit']");
  await page.fill("#lead-search", "Stonebridge");
  assert.equal(await page.locator("[data-lead-id]").count(), 1, "New lead should be searchable");
  await page.locator("[data-lead-id]").click();
  await page.check("[name='decisionMaker']");
  await page.check("[name='workflow']");
  await page.check("[name='nextStep']");
  await page.click("#convert-lead");
  assert.equal(await page.locator("#deal-count").textContent(), "3", "Conversion should create a deal");
  assert.equal(await page.locator("#task-count").textContent(), "3", "Conversion should add one open task to the existing two");
  await page.click("[data-view='deals']");
  assert.ok(await page.locator("#deal-list").textContent().then((text) => text.includes("Stonebridge Home Services")), "Converted deal should be visible");
  await page.click("[data-view='tasks']");
  assert.ok(await page.locator("#task-list").textContent().then((text) => text.includes("Confirm pilot scope with Stonebridge Home Services")), "Created follow-up should be visible");
  await assertNoHorizontalOverflow(page, "demo desktop");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await assertNoHorizontalOverflow(page, "demo mobile");
  assert.equal(await page.locator(".nav-item:visible").count(), 4, "Mobile bottom navigation should expose all four views");

  for (const path of ["case-crm.html", "case-erp.html", "case-map.html", "pilot-scope.html"]) {
    await page.goto(`${base}/${path}`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("main").count(), 1, `${path} should contain main landmark`);
    await assertNoHorizontalOverflow(page, path);
    await assertMediaLoaded(page, path);
  }

  assert.deepEqual(pageErrors, [], `Browser errors: ${pageErrors.join("; ")}`);
  assert.deepEqual(await scanFiles(root), [], "Potential secrets found in repository files");
  console.log("PASS marketing, demo workflow, mobile layout, cases, and secret scan");
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
