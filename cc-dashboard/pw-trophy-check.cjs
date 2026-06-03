const {chromium} = require("playwright");
(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox","--disable-gpu"] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/walkinturned-mtd", { waitUntil: "networkidle", timeout: 30000 });
  // Check that trophy stage no longer has the achievement-trophy-stage class
  const trophyClass = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("[class*='trophy-stage']"));
    return els.map(e => e.className);
  });
  await page.screenshot({ path: "C:/Temp/trophy-white-fix.png", fullPage: false });
  console.log("trophy-stage elements:", JSON.stringify(trophyClass));
  console.log("achievement-trophy-stage class present:", trophyClass.some(c => c.includes("achievement-trophy-stage")));
  await browser.close();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
