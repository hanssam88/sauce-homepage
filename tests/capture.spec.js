const { test, expect } = require("@playwright/test");
const path = require("node:path");

const concepts = ["a-editorial", "b-cinematic", "c-gallery"];

for (const concept of concepts) {
  test(`capture ${concept}`, async ({ page }) => {
    const problems = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => problems.push(`page: ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 400) {
        problems.push(`http: ${response.status()} ${response.url()}`);
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/concepts/${concept}/`);
    await expect(page.locator('[data-section="hero"]')).toBeVisible();
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-desktop-hero.png`)
    });

    const process = page.locator('[data-section="process"]');
    await process.scrollIntoViewIfNeeded();
    if (await process.getAttribute("data-reveal") !== null) {
      await expect(process).toHaveClass(/is-visible/);
      await expect.poll(
        () => process.evaluate((element) => getComputedStyle(element).opacity)
      ).toBe("1");
    }
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-desktop-middle.png`)
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/concepts/${concept}/`);
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-mobile-hero.png`)
    });
    expect(problems).toEqual([]);
  });
}
