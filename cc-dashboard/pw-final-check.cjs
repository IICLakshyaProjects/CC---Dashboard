const {chromium} = require("playwright");
(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox","--disable-gpu"] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:3000/walkinturned-mtd", { waitUntil: "networkidle", timeout: 30000 });
  const h1 = await page.$eval("h1", el => el.innerText).catch(() => "no h1");
  const updatedLine = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll("span"));
    return spans.map(s => s.innerText).find(t => t.includes("Updated")) ?? "not found";
  });
  const hasLaurel = await page.evaluate(() => !!document.querySelector("svg path[d*='M36 94']"));
  const hasWalkinMtdBadge = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("span")).some(s => s.innerText.trim() === "Walkin MTD");
  });
  console.log("H1:", h1);
  console.log("Updated line:", updatedLine);
  console.log("Laurel SVG present:", hasLaurel);
  console.log("Walkin MTD badge present:", hasWalkinMtdBadge);
  await browser.close();
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
