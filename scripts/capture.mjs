import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../assets/cases/", import.meta.url));
const base = "http://127.0.0.1:4173";
const chrome = process.env.CHROME_PATH || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined);
const server = spawn(process.execPath, ["scripts/server.mjs"], { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
await once(server.stdout, "data");

const browser = await chromium.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${output}/portfolio-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: `${output}/portfolio-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 940 });
  await page.goto(`${base}/demo/`, { waitUntil: "networkidle" });
  await page.click("#reset-demo");
  await page.screenshot({ path: `${output}/crm-pipeline-desktop.png`, fullPage: true });

  await page.click("#primary-action");
  await page.locator("#lead-dialog").screenshot({ path: `${output}/crm-new-lead.png` });
  await page.click("#lead-dialog [data-close]");

  await page.locator("[data-lead-id='lead-3']").click();
  await page.locator("#detail-dialog").screenshot({ path: `${output}/crm-qualification.png` });
  await page.click("#detail-dialog [data-close]");

  await page.click("[data-view='deals']");
  await page.screenshot({ path: `${output}/crm-deals-desktop.png`, fullPage: true });
  await page.click("[data-view='tasks']");
  await page.screenshot({ path: `${output}/crm-tasks-desktop.png`, fullPage: true });

  await page.click("[data-view='inventory']");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/erp-inventory-desktop.png`, fullPage: true });
  await page.locator(".inventory-summary").screenshot({ path: `${output}/erp-summary.png` });
  await page.locator(".inventory-table").screenshot({ path: `${output}/erp-table.png` });
  await page.locator(".stock-note").screenshot({ path: `${output}/erp-exception.png` });
  await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
  await page.screenshot({ path: `${output}/erp-inventory-light.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await page.click("[data-view='leads']");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/crm-pipeline-mobile.png`, fullPage: true });
  await page.click("[data-view='inventory']");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/erp-inventory-mobile.png`, fullPage: true });
  console.log("Captured 14 verified portfolio images.");
} finally {
  await browser.close();
  server.kill("SIGTERM");
}
