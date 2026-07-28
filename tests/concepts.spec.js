const { test, expect } = require("@playwright/test");

const concepts = [
  { slug: "a-editorial", body: "a-editorial" },
  { slug: "b-cinematic", body: "b-cinematic" },
  { slug: "c-gallery", body: "c-gallery" }
];

for (const concept of concepts) {
  test.describe(concept.slug, () => {
    test("renders the shared content contract", async ({ page }) => {
      const broken = [];
      page.on("response", (response) => {
        if (response.status() >= 400) broken.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(`/concepts/${concept.slug}/`);
      await expect(page.locator("body")).toHaveAttribute("data-concept", concept.body);
      await expect(page.locator("h1")).toContainText("재료에서");
      await expect(page.locator("main [data-section]")).toHaveCount(4);
      await expect(page.locator('[data-section="hero"]')).toBeVisible();
      expect(broken).toEqual([]);
    });

    test("fits the mobile viewport without horizontal overflow", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/concepts/${concept.slug}/`);
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth
      }));
      expect(widths.scroll).toBeLessThanOrEqual(widths.client);
    });

    test("exposes a reduced-motion state", async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(`/concepts/${concept.slug}/`);
      await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
      await context.close();
    });
  });
}
