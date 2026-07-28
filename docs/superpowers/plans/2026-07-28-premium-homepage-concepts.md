# 찬지기 프리미엄 홈페이지 A/B/C 비교 시안 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 운영 중인 루트 홈페이지를 변경하지 않고, 동일한 찬지기 콘텐츠를 사용한 프리미엄 브랜드 비교 시안 A/B/C를 제작하고 동일 조건으로 검증한다.

**Architecture:** 세 시안은 `concepts/<concept>/` 아래의 독립적인 HTML·CSS·JavaScript 페이지로 구현한다. 기존 `assets/`를 읽기 전용 상대 경로로 사용하며, Playwright 계약 테스트와 루트 보존 스크립트로 구조·반응형·접근성·모션 축소·에셋 상태를 검증한다.

**Tech Stack:** HTML5, CSS, vanilla JavaScript, Python 정적 서버, Playwright 1.62.0, GitHub Pages

## Global Constraints

- 1순위 목적은 프리미엄 브랜드 인지도다.
- 공통 핵심 문장은 `재료에서, 마지막 한 술까지.`다.
- 공통 이야기 순서는 원물 → 시간과 제조 → 식탁이다.
- 각 시안은 Hero, 브랜드 철학, 원물과 제조, 식탁과 완성의 네 섹션을 포함한다.
- 기본 언어는 한국어이며 5개 국어 확장은 이번 범위에서 제외한다.
- 기존 루트 `index.html`과 `assets/`는 수정하지 않는다.
- 외부 API, 폼 제출, 브라우저 저장소, 사용자 데이터 전송을 사용하지 않는다.
- 비교 시안 간 CSS와 JavaScript를 공유하지 않는다.
- 기준 화면은 데스크톱 1440×900과 모바일 390×844다.
- 모든 핵심 콘텐츠는 JavaScript가 없어도 읽을 수 있어야 한다.
- `prefers-reduced-motion: reduce`에서 자동 재생과 큰 이동을 제거한다.
- 사용자가 `/commit-push`를 명시하지 않았으므로 커밋과 푸시는 실행하지 않는다.

---

## File Map

| Path | Responsibility |
|---|---|
| `package.json` | Playwright 실행 명령과 정확한 개발 의존성 |
| `package-lock.json` | npm이 생성하는 Playwright 의존성 잠금 |
| `playwright.config.js` | 로컬 정적 서버, 브라우저, 결과 경로 설정 |
| `scripts/verify-root-untouched.sh` | 루트 `index.html`과 기존 `assets/` 무변경 검증 |
| `tests/concepts.spec.js` | 세 시안의 공통 구조·반응형·접근성·저감 모션 계약 |
| `tests/capture.spec.js` | 동일한 화면 크기로 채팅용 비교 이미지 생성 |
| `.gitignore` | 의존성·테스트 결과·비교 이미지 산출물 제외 |
| `concepts/a-editorial/index.html` | A안의 의미 구조와 한국어 콘텐츠 |
| `concepts/a-editorial/styles.css` | A안의 에디토리얼 그리드·타이포·반응형 |
| `concepts/a-editorial/app.js` | A안의 절제된 reveal과 챕터 상태 |
| `concepts/b-cinematic/index.html` | B안의 시네마틱 장면과 미디어 |
| `concepts/b-cinematic/styles.css` | B안의 sticky 장면·명암·모션 fallback |
| `concepts/b-cinematic/app.js` | B안의 장면 상태·영상 재생/정지·저감 모션 |
| `concepts/c-gallery/index.html` | C안의 제품·재료·요리 그리드 |
| `concepts/c-gallery/styles.css` | C안의 베이지 프레임 그리드·이미지 모듈 |
| `concepts/c-gallery/app.js` | C안의 카드 reveal과 키보드/hover 동등 상태 |

## Shared DOM Contract

각 시안은 다음 인터페이스를 동일하게 제공한다.

```html
<html lang="ko" data-motion="pending">
<body data-concept="a-editorial|b-cinematic|c-gallery">
  <header>
    <a href="#hero">찬지기</a>
    <nav aria-label="페이지 섹션">
      <a href="#philosophy">이야기</a>
      <a href="#process">과정</a>
      <a href="#table">식탁</a>
    </nav>
  </header>
  <main>
    <section id="hero" data-section="hero"><h1>재료에서, 마지막 한 술까지.</h1></section>
    <section id="philosophy" data-section="philosophy"><h2>요리는 쉽게, 맛은 깊게.</h2></section>
    <section id="process" data-section="process"><h2>담는 순간까지, 깨끗하게.</h2></section>
    <section id="table" data-section="table"><h2>한 스푼에, 오늘 한 끼 완성.</h2></section>
  </main>
</body>
</html>
```

각 `app.js`는 아래 상태를 설정한다.

```js
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.dataset.motion = reduceMotion ? "reduced" : "full";
document.documentElement.classList.add("js");
```

---

### Task 1: 보존 게이트와 브라우저 테스트 하네스

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `package-lock.json` via `npm install`
- Create: `playwright.config.js`
- Create: `scripts/verify-root-untouched.sh`
- Create: `tests/concepts.spec.js`

**Interfaces:**
- Consumes: 현재 Git `HEAD`, 루트 `index.html`, 기존 `assets/`
- Produces: `npm test`, `npm run capture`, `scripts/verify-root-untouched.sh`, 공통 DOM 계약

- [ ] **Step 1: 루트 보존 검증 스크립트 작성**

```bash
#!/usr/bin/env bash
set -euo pipefail

test "$(git hash-object index.html)" = "$(git rev-parse HEAD:index.html)"
git diff --quiet HEAD -- assets/
test -z "$(git ls-files --others --exclude-standard -- assets/)"
echo "root index.html and assets/ are unchanged"
```

- [ ] **Step 2: 보존 게이트가 현재 상태에서 통과하는지 확인**

Run:

```bash
chmod +x scripts/verify-root-untouched.sh
./scripts/verify-root-untouched.sh
```

Expected: `root index.html and assets/ are unchanged`

- [ ] **Step 3: Playwright 설정 작성**

`package.json`:

```json
{
  "name": "chanjigi-concept-comparison",
  "private": true,
  "scripts": {
    "test": "playwright test tests/concepts.spec.js",
    "capture": "playwright test tests/capture.spec.js"
  },
  "devDependencies": {
    "@playwright/test": "1.62.0"
  }
}
```

`playwright.config.js`:

```js
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true
  }
});
```

`.gitignore`:

```gitignore
node_modules/
test-results/
playwright-report/
artifacts/
```

- [ ] **Step 4: 의존성 설치**

Run:

```bash
npm install
npx playwright install chromium
```

Expected: `package-lock.json` 생성, Chromium 설치 성공

- [ ] **Step 5: 공통 계약 테스트 작성**

`tests/concepts.spec.js`는 다음 데이터와 검증을 사용한다.

```js
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
```

- [ ] **Step 6: 계약 테스트가 아직 세 경로에서 실패하는지 확인**

Run:

```bash
npm test
```

Expected: A/B/C 경로가 없어서 각 `renders the shared content contract` 테스트가 실패

- [ ] **Step 7: 작업 상태 점검**

Run:

```bash
git diff --check
./scripts/verify-root-untouched.sh
git status --short
```

Expected: 공백 오류 없음, 보존 게이트 통과, 하네스 파일만 신규로 표시

---

### Task 2: A안 — 한국적 식문화 에디토리얼

**Files:**
- Create: `concepts/a-editorial/index.html`
- Create: `concepts/a-editorial/styles.css`
- Create: `concepts/a-editorial/app.js`
- Modify: `tests/concepts.spec.js`

**Interfaces:**
- Consumes: `../../assets/img-ingredients.png`, `../../assets/factory-lab.jpg`, `../../assets/poster-dish-bibimbap.jpg`
- Produces: `body[data-concept="a-editorial"]`, `[data-chapter]`, `[data-reveal]`

- [ ] **Step 1: A안 고유 계약 테스트 추가**

```js
test("A uses editorial chapters and visible Korean copy", async ({ page }) => {
  await page.goto("/concepts/a-editorial/");
  await expect(page.locator("[data-chapter]")).toHaveCount(3);
  await expect(page.getByText("요리는 쉽게, 맛은 깊게.")).toBeVisible();
  await expect(page.getByText("담는 순간까지, 깨끗하게.")).toBeVisible();
});
```

- [ ] **Step 2: A안 테스트가 실패하는지 확인**

Run:

```bash
npx playwright test tests/concepts.spec.js --grep "A uses"
```

Expected: `/concepts/a-editorial/` 404 또는 `[data-chapter]` 없음으로 실패

- [ ] **Step 3: 의미 구조와 승인된 기존 카피 작성**

`index.html`에는 다음 콘텐츠를 실제 HTML로 배치한다.

```html
<body data-concept="a-editorial">
  <header class="site-header">
    <a class="brand" href="#hero">찬지기 <span>CHANJIGI</span></a>
    <nav aria-label="페이지 섹션">
      <a href="#philosophy">이야기</a>
      <a href="#process">과정</a>
      <a href="#table">식탁</a>
    </nav>
  </header>
  <main>
    <section id="hero" data-section="hero">
      <p>재료에서 시작합니다</p>
      <h1>재료에서,<br>마지막 한 술까지.</h1>
      <p>태양초 고추, 우리콩, 통쌀 — 한 병에 들어갈 재료를 산지에서 직접 고릅니다.</p>
      <img src="../../assets/img-ingredients.png" alt="고추, 콩, 쌀과 함께 놓인 고추장 병">
    </section>
    <section id="philosophy" data-section="philosophy" data-chapter="01" data-reveal>
      <p>01 · 매일의 주방에서</p>
      <h2>요리는 쉽게, 맛은 깊게.</h2>
      <p>나물 무침부터 냉면, 찌개까지 — 소스 하나면 우리 집 주방의 매일이 완성됩니다.</p>
    </section>
    <section id="process" data-section="process" data-chapter="02" data-reveal>
      <img src="../../assets/factory-lab.jpg" alt="찬지기 품질 검사실">
      <p>02 · 보이지 않는 곳까지</p>
      <h2>담는 순간까지, 깨끗하게.</h2>
      <p>클린룸 생산 라인에서 한 병 한 병 담아 당일 밀봉합니다.</p>
    </section>
    <section id="table" data-section="table" data-chapter="03" data-reveal>
      <img src="../../assets/poster-dish-bibimbap.jpg" alt="고추장을 올린 비빔밥">
      <p>03 · 매일의 한 끼에</p>
      <h2>한 스푼에, 오늘 한 끼 완성.</h2>
    </section>
  </main>
</body>
```

- [ ] **Step 4: A안 디자인 시스템 구현**

`styles.css`는 MengTo `design-first-ui-prompting`과 `editorial-portfolio-chapters`의
규칙을 다음 값으로 고정한다.

```css
:root {
  --paper: #f1eadc;
  --paper-deep: #ded2bd;
  --ink: #1c1a17;
  --red: #9d2e21;
  --olive: #737740;
  --line: rgba(28, 26, 23, 0.2);
  --edge: clamp(24px, 4vw, 64px);
  --display: clamp(3.5rem, 9vw, 8.5rem);
}
```

- 12열 데스크톱 그리드와 `var(--edge)` 가장자리 여백을 사용한다.
- Hero 이미지는 오른쪽 7열, 카피는 왼쪽 5열에 둔다.
- 세 챕터는 이미지와 본문의 좌우 순서를 교차한다.
- 그림자와 둥근 카드 반복을 사용하지 않고 `1px` 선과 여백으로 구분한다.
- 모바일 760px 이하에서는 모든 섹션을 한 열로 바꾸고 제목을 `clamp(2.8rem, 14vw, 5rem)`로 제한한다.
- focus-visible은 `2px solid var(--red)`로 표시한다.

- [ ] **Step 5: A안 reveal과 챕터 상태 구현**

```js
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.dataset.motion = reduceMotion ? "reduced" : "full";
root.classList.add("js");

const chapters = [...document.querySelectorAll("[data-chapter]")];

if (!reduceMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  chapters.forEach((chapter) => revealObserver.observe(chapter));
} else {
  chapters.forEach((chapter) => chapter.classList.add("is-visible"));
}
```

CSS entrance duration은 620ms, ease는 `cubic-bezier(.22,.61,.36,1)`, 이동 거리는
24px로 제한한다. hover/focus 피드백은 180ms로 하고 이미지 확대는 `1.02`를 넘지 않는다.

- [ ] **Step 6: A안 계약과 보존 게이트 확인**

Run:

```bash
npx playwright test tests/concepts.spec.js --grep "a-editorial|A uses"
./scripts/verify-root-untouched.sh
git diff --check
```

Expected: A안 관련 테스트 통과, 루트 보존 통과

---

### Task 3: B안 — 시네마틱 여정

**Files:**
- Create: `concepts/b-cinematic/index.html`
- Create: `concepts/b-cinematic/styles.css`
- Create: `concepts/b-cinematic/app.js`
- Modify: `tests/concepts.spec.js`

**Interfaces:**
- Consumes: `../../assets/vid-onion.mp4`, `../../assets/vid-factory-line.mp4`, `../../assets/vid-dish-bibimbap.mp4`와 각 poster
- Produces: `body[data-concept="b-cinematic"]`, `[data-scene]`, `video[data-playing]`

- [ ] **Step 1: B안 장면·영상 수명주기 테스트 추가**

```js
test("B exposes three cinematic scenes and pauses offscreen video", async ({ page }) => {
  await page.goto("/concepts/b-cinematic/");
  await expect(page.locator("[data-scene]")).toHaveCount(3);
  const heroVideo = page.locator('[data-scene="source"] video');
  await expect(heroVideo).toHaveAttribute("data-playing", /true|false/);
  await page.locator('[data-section="table"]').scrollIntoViewIfNeeded();
  await expect(heroVideo).toHaveAttribute("data-playing", "false");
});
```

- [ ] **Step 2: B안 테스트가 실패하는지 확인**

Run:

```bash
npx playwright test tests/concepts.spec.js --grep "B exposes"
```

Expected: `/concepts/b-cinematic/` 404 또는 `[data-scene]` 없음으로 실패

- [ ] **Step 3: 세 장면의 정적 HTML 작성**

- `source` 장면: `vid-onion.mp4` + `poster-onion.jpg`, Hero 문장
- `process` 장면: `vid-factory-line.mp4` + `poster-factory-line.jpg`, 제조 문장
- `table` 장면: `vid-dish-bibimbap.mp4` + `poster-dish-bibimbap.jpg`, 식탁 문장
- 각 `<video>`는 `muted playsinline loop preload="metadata"`를 사용하고 `autoplay`는 넣지 않는다.
- 모든 장면은 `<video>` 다음에 읽을 수 있는 제목과 본문을 실제 HTML로 포함한다.
- 네 공통 섹션 계약을 맞추기 위해 Hero 안에 `source` 장면을 두고, 브랜드 철학은 별도의 정적 인트로 섹션으로 둔다.

- [ ] **Step 4: B안 sticky 시네마틱 CSS 구현**

```css
:root {
  --black: #090806;
  --ivory: #f4eee3;
  --ember: #bf4a2f;
  --olive: #a8ad68;
  --scene-enter: 900ms;
}

[data-scene] {
  position: relative;
  min-height: 160vh;
}

.scene__stage {
  position: sticky;
  top: 0;
  min-height: 100vh;
  overflow: hidden;
}

.scene__media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- 카피는 하단 왼쪽에 고정하고 한 화면당 하나의 제목만 강조한다.
- 영상 위에는 좌→우 및 하→상 그라데이션을 겹쳐 대비를 확보한다.
- 장면 진행 번호 `01/03`, `02/03`, `03/03`을 항상 보이게 둔다.
- scroll snap과 휠 이벤트 가로채기를 사용하지 않는다.
- 760px 이하에서는 장면 높이를 120vh로 줄이고 blur·scale 전환을 제거한다.
- 저감 모션에서는 `position: relative`, `min-height: auto`로 바꾸고 poster 중심의 정적 섹션으로 표시한다.

- [ ] **Step 5: 장면 상태와 미디어 재생 제어 구현**

```js
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.dataset.motion = reduceMotion ? "reduced" : "full";
root.classList.add("js");

const scenes = [...document.querySelectorAll("[data-scene]")];

function setVideoState(video, active) {
  if (!video) return;
  video.dataset.playing = active ? "true" : "false";
  if (!active) {
    video.pause();
    return;
  }
  const playPromise = video.play();
  if (playPromise) playPromise.catch(() => {
    video.dataset.playing = "false";
  });
}

if (reduceMotion) {
  scenes.forEach((scene) => setVideoState(scene.querySelector("video"), false));
} else {
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
      setVideoState(entry.target.querySelector("video"), entry.isIntersecting);
    });
  }, { threshold: 0.55 });

  scenes.forEach((scene) => sceneObserver.observe(scene));
}
```

장면 진입 전환은 900ms, 카피 이동은 36px, blur는 최대 8px로 제한한다. CSS animation과
video는 보이지 않는 장면에서 정지한다.

- [ ] **Step 6: B안 계약·영상 정지·보존 게이트 확인**

Run:

```bash
npx playwright test tests/concepts.spec.js --grep "b-cinematic|B exposes"
./scripts/verify-root-untouched.sh
git diff --check
```

Expected: B안 관련 테스트 통과, Hero 영상은 식탁 구간에서 `data-playing="false"`

---

### Task 4: C안 — 현대적 푸드 갤러리

**Files:**
- Create: `concepts/c-gallery/index.html`
- Create: `concepts/c-gallery/styles.css`
- Create: `concepts/c-gallery/app.js`
- Modify: `tests/concepts.spec.js`

**Interfaces:**
- Consumes: `../../assets/img-flatlay-*.png`, `../../assets/poster-dish-*.jpg`, `../../assets/factory-pouch.jpg`
- Produces: `body[data-concept="c-gallery"]`, `[data-gallery-card]`, `.frame`

- [ ] **Step 1: C안 그리드·키보드 계약 테스트 추가**

```js
test("C exposes a framed image grid with focusable cards", async ({ page }) => {
  await page.goto("/concepts/c-gallery/");
  await expect(page.locator("[data-gallery-card]")).toHaveCount(6);
  const cards = page.locator("[data-gallery-card]");
  for (let index = 0; index < 6; index += 1) {
    await expect(cards.nth(index)).toHaveAttribute("tabindex", "0");
  }
});
```

- [ ] **Step 2: C안 테스트가 실패하는지 확인**

Run:

```bash
npx playwright test tests/concepts.spec.js --grep "C exposes"
```

Expected: `/concepts/c-gallery/` 404 또는 카드 없음으로 실패

- [ ] **Step 3: 밝은 갤러리 의미 구조 작성**

- Hero는 `img-flatlay-soy.png`를 크게 사용하고 왼쪽에 공통 핵심 문장을 둔다.
- 브랜드 철학은 원물·주방·제조의 세 개 짧은 텍스트 모듈로 구성한다.
- 제조 모듈은 `factory-pouch.jpg`를 사용한다.
- 식탁 그리드는 다음 여섯 에셋을 정확히 한 번씩 사용한다.
  - `poster-dish-bibimbap.jpg`
  - `poster-dish-tteokbokki.jpg`
  - `poster-dish-sandwich.jpg`
  - `poster-dish-salad.jpg`
  - `poster-dish-shrimp.jpg`
  - `poster-dip-celery.jpg`
- 여섯 카드에 `data-gallery-card tabindex="0"`과 보이는 요리명을 제공한다.

- [ ] **Step 4: C안 베이지 프레임 그리드 구현**

MengTo의 `framed-grid-layout`과 `clean-minimal-beige-light-mode`를 결합하되 다음 토큰을
한 시스템으로 고정한다.

```css
:root {
  --cream: #f5f0e6;
  --stone: #ddd4c4;
  --charcoal: #24211d;
  --tomato: #b63b2c;
  --line: rgba(36, 33, 29, 0.16);
  --gap: clamp(10px, 1.4vw, 18px);
  --pad: clamp(18px, 2.5vw, 32px);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--gap);
}

.frame {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.28);
}
```

- 카드 span은 `7/5`, `4/4/4`, `5/7` 패턴을 반복해 편집 리듬을 만든다.
- 모든 프레임은 같은 1px 선, 같은 padding, 같은 모서리 규칙을 사용한다.
- 그림자는 사용하지 않고 배경 텍스처의 opacity를 0.035 이하로 제한한다.
- 카드 이미지 비율은 4:5 또는 3:2 중 하나로 명시하고 `object-fit: cover`를 사용한다.
- hover와 focus에서 같은 캡션·이미지 상태를 제공하며 scale은 `1.02` 이하로 제한한다.
- 760px 이하에서는 한 열로 전환하고 카드 순서를 DOM 순서와 동일하게 유지한다.

- [ ] **Step 5: C안 reveal 구현**

```js
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.dataset.motion = reduceMotion ? "reduced" : "full";
root.classList.add("js");

const cards = [...document.querySelectorAll("[data-gallery-card]")];

if (reduceMotion) {
  cards.forEach((card) => card.classList.add("is-visible"));
} else {
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach((card) => cardObserver.observe(card));
}
```

카드 reveal은 560ms, 카드 간 지연은 CSS 변수로 최대 70ms, 이동 거리는 20px로 제한한다.

- [ ] **Step 6: C안 계약과 보존 게이트 확인**

Run:

```bash
npx playwright test tests/concepts.spec.js --grep "c-gallery|C exposes"
./scripts/verify-root-untouched.sh
git diff --check
```

Expected: C안 관련 테스트 통과, 카드 6개가 키보드 focus 가능

---

### Task 5: 교차 검증과 동일 조건 비교 이미지

**Files:**
- Create: `tests/capture.spec.js`
- Modify: `tests/concepts.spec.js`

**Interfaces:**
- Consumes: 완성된 A/B/C 경로와 공통 DOM 계약
- Produces: `artifacts/screenshots/<concept>-desktop-hero.png`, `<concept>-desktop-middle.png`, `<concept>-mobile-hero.png`

- [ ] **Step 1: 저감 모션에서 영상이 정지하는 교차 테스트 추가**

```js
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
```

- [ ] **Step 2: 전체 계약 테스트 실행**

Run:

```bash
npm test
```

Expected: 모든 테스트 통과

- [ ] **Step 3: 동일 조건 캡처 테스트 작성**

```js
const { test, expect } = require("@playwright/test");
const path = require("node:path");

const concepts = ["a-editorial", "b-cinematic", "c-gallery"];

for (const concept of concepts) {
  test(`capture ${concept}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/concepts/${concept}/`);
    await expect(page.locator('[data-section="hero"]')).toBeVisible();
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-desktop-hero.png`)
    });

    await page.locator('[data-section="process"]').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-desktop-middle.png`)
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/concepts/${concept}/`);
    await page.screenshot({
      path: path.join("artifacts", "screenshots", `${concept}-mobile-hero.png`)
    });
  });
}
```

- [ ] **Step 4: 9개 비교 이미지 생성**

Run:

```bash
npm run capture
find artifacts/screenshots -type f -name '*.png' | sort
```

Expected: A/B/C별 데스크톱 Hero·중간 섹션·모바일 Hero, 총 9개

- [ ] **Step 5: 애니메이션 소유자와 정리 상태 감사**

Run:

```bash
rg -n "animation:|requestAnimationFrame|setInterval|setTimeout|IntersectionObserver|addEventListener|<video" concepts/
```

Expected:

- `requestAnimationFrame`, `setInterval`, 영구 `setTimeout` 없음
- A/C는 일회성 reveal observer가 보인 뒤 `unobserve`
- B는 보이지 않는 영상에 `pause()` 적용
- 모든 시안에 저감 모션 분기 존재

- [ ] **Step 6: 데스크톱·중간·모바일 화면을 직접 검토**

각 PNG를 열어 다음을 확인한다.

- H1이 첫 화면에서 잘리지 않는다.
- 본문과 배경 대비가 충분하다.
- 이미지 크롭이 제품 또는 식재료의 핵심을 자르지 않는다.
- 중간 섹션에서 겹침이나 빈 화면이 없다.
- 모바일에서 navigation, 제목, 이미지 순서가 자연스럽다.
- 세 시안이 동일 브랜드이면서 서로 다른 방향으로 식별된다.

- [ ] **Step 7: 콘솔·에셋·루트 보존 최종 검증**

Run:

```bash
npm test
git diff --check
./scripts/verify-root-untouched.sh
git status --short
```

Expected: 테스트와 보존 게이트 통과, `index.html`과 `assets/` 변경 없음

---

### Task 6: 비교 결과 전달

**Files:**
- No source-file changes

**Interfaces:**
- Consumes: 테스트 결과와 9개 PNG
- Produces: 채팅 내 A/B/C 비교 이미지와 선택 기준

- [ ] **Step 1: 채팅에 A/B/C Hero 이미지 나란히 제공**

A, B, C의 `desktop-hero.png`를 같은 순서와 크기로 제시하고 각 이미지 아래에 방향명을
표시한다.

- [ ] **Step 2: 각 시안의 중간 섹션과 모바일 Hero 제공**

각 방향별로 `desktop-middle.png`와 `mobile-hero.png`를 묶어, Hero 외 구간과 모바일
완성도를 비교할 수 있게 한다.

- [ ] **Step 3: 검증 근거가 포함된 비교표 제공**

다음 여섯 항목을 5점 척도로 평가하고, 각 점수 옆에 화면 또는 테스트에서 관찰한 한 줄
근거를 붙인다.

- 프리미엄 인상
- 한국적 고유성
- 기존 에셋 활용도
- 콘텐츠 확장성
- 모바일·성능 안정성
- 구현·운영 복잡도

- [ ] **Step 4: 최종 방향 선택 요청**

A/B/C 중 하나를 선택하거나, 한 안의 구조에 다른 안의 색상·모션을 결합할지 묻는다.
운영 루트 교체는 별도 승인 사항임을 함께 명시한다.
