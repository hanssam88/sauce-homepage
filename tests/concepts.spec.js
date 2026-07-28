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

test("reduced motion leaves every video paused", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const concept of concepts) {
    await page.goto(`/concepts/${concept.slug}/`);
    const playing = await page.locator("video").evaluateAll((videos) =>
      videos.filter((video) => !video.paused).length
    );
    expect(playing).toBe(0);
  }
  await context.close();
});

test("A uses editorial chapters and visible Korean copy", async ({ page }) => {
  await page.goto("/concepts/a-editorial/");
  const chapters = page.locator("[data-chapter]");
  await expect(chapters).toHaveCount(3);
  await expect.soft(chapters.locator("h2")).toHaveText([
    "재료에서, 마지막 한 술까지.",
    "담는 순간까지, 깨끗하게.",
    "한 스푼에, 오늘 한 끼 완성."
  ]);
  await expect.soft(chapters.locator(":scope > img")).toHaveCount(3);

  const imageSides = await chapters.evaluateAll((elements) => (
    elements.map((chapter) => {
      const image = chapter.querySelector(":scope > img");
      const heading = chapter.querySelector("h2");
      if (!image || !heading) return "missing";
      return image.getBoundingClientRect().left > heading.getBoundingClientRect().left
        ? "right"
        : "left";
    })
  ));
  expect.soft(imageSides).toEqual(["right", "left", "right"]);

  const heroHeading = await page.locator('[data-section="hero"] h1').boundingBox();
  const heroImage = await page.locator('[data-section="hero"] img').boundingBox();
  expect.soft(heroHeading.x + heroHeading.width).toBeLessThanOrEqual(heroImage.x + 1);

  await expect(page.getByText("요리는 쉽게, 맛은 깊게.")).toBeVisible();
  await expect(page.getByText("담는 순간까지, 깨끗하게.")).toBeVisible();
});

test("B exposes three cinematic scenes and pauses offscreen video", async ({ page }) => {
  await page.goto("/concepts/b-cinematic/");
  await expect(page.locator("[data-scene]")).toHaveCount(3);
  const heroVideo = page.locator('[data-scene="source"] video');
  await expect(heroVideo).toHaveAttribute("data-playing", /true|false/);
  await page.locator('[data-section="table"]').scrollIntoViewIfNeeded();
  await expect(heroVideo).toHaveAttribute("data-playing", "false");
});

test("B keeps visible brand labels in Korean", async ({ page }) => {
  await page.goto("/concepts/b-cinematic/");
  await expect(page.locator(".brand")).toHaveText("찬지기");
  await expect(page.locator(".philosophy__label")).toHaveText("찬지기 · 우리의 기준");
});

test("C exposes a framed image grid with focusable cards", async ({ page }) => {
  await page.goto("/concepts/c-gallery/");
  await expect(page.locator("[data-gallery-card]")).toHaveCount(6);
  const cards = page.locator("[data-gallery-card]");
  for (let index = 0; index < 6; index += 1) {
    await expect(cards.nth(index)).toHaveAttribute("tabindex", "0");
  }
});
