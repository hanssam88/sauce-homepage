const { test, expect } = require("@playwright/test");
const path = require("node:path");

const concepts = ["a-editorial", "b-cinematic", "c-gallery"];

async function expectReducedMotionCaptureState(page, concept, section) {
  await expect.soft(page.locator("html")).toHaveAttribute("data-motion", "reduced");

  if (concept !== "b-cinematic") return;

  await expect.poll(
    () => section.evaluate((element) => {
      const media = element.querySelector(".scene__media");
      const copy = element.querySelector(".scene__copy");
      const video = element.querySelector("video");
      return {
        hasBlur: getComputedStyle(media).filter.includes("blur("),
        opacity: getComputedStyle(copy).opacity,
        paused: video.paused,
        currentTime: video.currentTime
      };
    }),
    { message: "B capture scene is static, readable, and fixed at its poster frame" }
  ).toEqual({
    hasBlur: false,
    opacity: "1",
    paused: true,
    currentTime: 0
  });
}

for (const concept of concepts) {
  test(`capture ${concept}`, async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
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
    const hero = page.locator('[data-section="hero"]');
    await expect(hero).toBeVisible();
    await expectReducedMotionCaptureState(page, concept, hero);
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-desktop-hero.png`)
    });

    const process = page.locator('[data-section="process"]');
    await process.scrollIntoViewIfNeeded();
    await expectReducedMotionCaptureState(page, concept, process);
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
    const mobileHero = page.locator('[data-section="hero"]');
    await expect(mobileHero).toBeVisible();
    await expectReducedMotionCaptureState(page, concept, mobileHero);
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-mobile-hero.png`)
    });
    expect(problems).toEqual([]);
    await context.close();
  });
}
