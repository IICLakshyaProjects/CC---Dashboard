const {chromium} = require("playwright");
(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox","--disable-gpu"] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:3000/walkinturned-mtd", { waitUntil: "networkidle", timeout: 30000 });
  const h1 = await page.$eval("h1", el => el.innerText).catch(() => "no h1");
  console.log("H1:", h1);
  await browser.close();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
