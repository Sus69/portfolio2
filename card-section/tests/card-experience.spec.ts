import { expect, test, type Page } from '@playwright/test'

async function scrollTo(page: Page, progress: number) {
  await page.evaluate((fraction) => {
    const scene = document.querySelector<HTMLElement>('.scene')!
    const distance = scene.clientWidth < 700 ? 5400 : 7000
    window.scrollTo(0, fraction * distance)
  }, progress)
  // Allow the scrub's deliberate catch-up to finish before observing a frame.
  await page.waitForTimeout(850)
}

async function visibleCards(page: Page) {
  return page.locator('.card-shell').evaluateAll((cards) => cards.filter((card) => {
    const css = getComputedStyle(card)
    return css.visibility === 'visible' && Number(css.opacity) > 0.99
  }).map((card) => {
    const box = card.getBoundingClientRect()
    return { id: (card as HTMLElement).dataset.cardId, x: box.x, y: box.y, width: box.width, height: box.height }
  }))
}

test('deals curved hands, flips to Figma, and reverses the clean reveal', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await scrollTo(page, 0.033)
  const first = await visibleCards(page)
  expect(first).toHaveLength(1)
  const radius = await page.locator('.card-face').first().evaluate((face) => parseFloat(getComputedStyle(face).borderRadius))
  expect(radius).toBeGreaterThanOrEqual(18)
  expect(radius).toBeLessThanOrEqual(24)
  expect(first[0].height / first[0].width).toBeCloseTo(1.23, 3)

  await scrollTo(page, 0.075)
  const two = await visibleCards(page)
  expect(two).toHaveLength(2)
  expect(two[0].x).toBeLessThan(first[0].x - 30)
  expect(two[1].x).toBeGreaterThan(two[0].x + 80)
  await page.screenshot({ path: testInfo.outputPath('two-front-cards.png') })

  await scrollTo(page, 0.165)
  expect(await visibleCards(page)).toHaveLength(4)
  await scrollTo(page, 0.33)
  const fan = await visibleCards(page)
  expect(fan).toHaveLength(8)
  fan.slice(1).forEach((card, index) => expect(card.x).toBeGreaterThan(fan[index].x + 70))
  expect(fan[0].y).toBeGreaterThan(fan[3].y)
  expect(fan[7].y).toBeGreaterThan(fan[4].y)
  await page.screenshot({ path: testInfo.outputPath('front-fan.png') })

  await scrollTo(page, 0.407)
  expect((await visibleCards(page)).map((card) => card.id)).toEqual(['shopify'])
  await scrollTo(page, 0.442)
  const midTurn = await page.locator('[data-card-id="shopify"] .card-inner').evaluate((el) => getComputedStyle(el).transform)
  expect(midTurn).toContain('matrix3d')
  await page.screenshot({ path: testInfo.outputPath('edge-on.png') })

  await scrollTo(page, 0.48)
  expect((await visibleCards(page)).map((card) => card.id)).toEqual(['shopify'])
  const face = page.locator('[data-card-id="shopify"] .card-face--back')
  await expect(face).toContainText('Figma')
  // Hit-testing checks which face actually paints on top, beyond DOM presence.
  const paintedFace = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('[data-card-id="shopify"]')!
    card.style.pointerEvents = 'auto'
    const box = card.getBoundingClientRect()
    const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('.card-face')
    card.style.pointerEvents = ''
    return hit?.className
  })
  expect(paintedFace).toContain('card-face--back')
  await page.screenshot({ path: testInfo.outputPath('figma-only.png') })

  await scrollTo(page, 0.535)
  const backTwo = await visibleCards(page)
  expect(backTwo).toHaveLength(2)
  expect(backTwo.find((c) => c.id === 'shopify')!.x).toBeLessThan(backTwo.find((c) => c.id === 'webflow')!.x)
  await page.screenshot({ path: testInfo.outputPath('two-back-cards.png') })
  await scrollTo(page, 0.80)
  expect(await visibleCards(page)).toHaveLength(8)
  await page.screenshot({ path: testInfo.outputPath('back-fan.png') })

  await scrollTo(page, 0.95)
  const cover = await page.locator('[data-card-id="javascript"]').boundingBox()
  expect(cover!.x).toBeLessThanOrEqual(0)
  expect(cover!.y).toBeLessThanOrEqual(0)
  expect(cover!.x + cover!.width).toBeGreaterThanOrEqual(1440)
  expect(cover!.y + cover!.height).toBeGreaterThanOrEqual(900)
  await scrollTo(page, 1)
  await expect(page.locator('.card-stage')).toHaveCSS('visibility', 'hidden')
  await expect(page.locator('.next-section')).toBeVisible()
  await expect(page.locator('.next-section__inner')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: testInfo.outputPath('clean-reveal.png') })

  await scrollTo(page, 0.48)
  expect((await visibleCards(page)).map((card) => card.id)).toEqual(['shopify'])
  await expect(page.locator('.next-section')).toBeHidden()
  await scrollTo(page, 0.33)
  const rewoundFan = await visibleCards(page)
  expect(rewoundFan).toHaveLength(8)
  rewoundFan.forEach((card, index) => expect(card.x).toBeCloseTo(fan[index].x, 0))
  await scrollTo(page, 0.033)
  expect((await visibleCards(page)).map((card) => card.id)).toEqual(['javascript'])
  expect(errors).toEqual([])
})

test('mobile hand stays in view and ends on a clean surface', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await scrollTo(page, 0.33)
  const fan = await visibleCards(page)
  expect(fan).toHaveLength(8)
  fan.forEach((card) => {
    expect(card.x).toBeGreaterThanOrEqual(0)
    expect(card.x + card.width).toBeLessThanOrEqual(390)
  })
  await page.screenshot({ path: testInfo.outputPath('mobile-fan.png') })
  await scrollTo(page, 1)
  await expect(page.locator('.card-stage')).toHaveCSS('visibility', 'hidden')
  await expect(page.locator('.next-section')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await page.screenshot({ path: testInfo.outputPath('mobile-reveal.png') })
})

test('reduced motion exposes all content without pinning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await expect(page.locator('.reduced-content__item')).toHaveCount(8)
  await expect(page.locator('.reduced-content')).toBeVisible()
  await expect(page.locator('.next-section')).toBeVisible()
})

test('resize recomputes the circular hand and viewport coverage', async ({ page }) => {
  await page.goto('/')
  await scrollTo(page, 0.33)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  await scrollTo(page, 0.33)
  const fan = await visibleCards(page)
  expect(fan).toHaveLength(8)
  fan.forEach((card) => {
    expect(card.x).toBeGreaterThanOrEqual(0)
    expect(card.x + card.width).toBeLessThanOrEqual(390)
  })
  await scrollTo(page, 1)
  await expect(page.locator('.card-stage')).toHaveCSS('visibility', 'hidden')
  await scrollTo(page, 0.48)
  expect((await visibleCards(page)).map((card) => card.id)).toEqual(['shopify'])
})

test('a tiny scroll completes each deal without further scrolling', async ({ page }, testInfo) => {
  await page.goto('/')
  const initialY = (await page.locator('[data-card-id="javascript"]').boundingBox())!.y
  await page.evaluate(() => window.scrollTo(0, 2))
  await page.waitForTimeout(850)
  const firstCard = (await page.locator('[data-card-id="javascript"]').boundingBox())!
  expect(firstCard.y).toBeLessThan(initialY - 100)
  expect(firstCard.y).toBeGreaterThan(300)
  expect(firstCard.y + firstCard.height).toBeLessThan(900)
  expect(await page.evaluate(() => window.scrollY)).toBe(2)

  // Barely cross the second-card threshold, then stop input completely.
  await scrollTo(page, 0.0425)
  const two = await visibleCards(page)
  expect(two).toHaveLength(2)
  expect(two[0].x).toBeLessThan(firstCard.x - 30)
  expect(two[1].y + two[1].height).toBeLessThan(900)
  const stoppedScroll = await page.evaluate(() => window.scrollY)
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => window.scrollY)).toBe(stoppedScroll)
  await page.screenshot({ path: testInfo.outputPath('snap-after-small-scroll.png') })

  // Moving farther inside that deal must not replay or partially undo it.
  await scrollTo(page, 0.05)
  const stillTwo = await visibleCards(page)
  stillTwo.forEach((card, index) => {
    expect(card.x).toBeCloseTo(two[index].x, 0)
    expect(card.y).toBeCloseTo(two[index].y, 0)
  })

  // Reversing across the threshold removes the second card and recenters the first.
  await scrollTo(page, 0.041)
  expect((await visibleCards(page)).map((card) => card.id)).toEqual(['javascript'])
  const rewound = (await page.locator('[data-card-id="javascript"]').boundingBox())!
  expect(rewound.x).toBeCloseTo(firstCard.x, 0)

  // Same one-shot behavior for the reverse-face group after Figma.
  await scrollTo(page, 0.48)
  await scrollTo(page, 0.5003)
  const backTwo = await visibleCards(page)
  expect(backTwo).toHaveLength(2)
  expect(backTwo.find((card) => card.id === 'webflow')!.y + backTwo[0].height).toBeLessThan(900)
  await scrollTo(page, 0.51)
  const heldBackTwo = await visibleCards(page)
  heldBackTwo.forEach((card, index) => expect(card.y).toBeCloseTo(backTwo[index].y, 0))
})

test('snaps stay fast during continuous scrolling and overlapping arrivals', async ({ page }, testInfo) => {
  await page.goto('/')
  await scrollTo(page, 0.04)

  const sampleMotion = async (overlap: boolean) => page.evaluate(async (overlap) => {
    const card = document.querySelector<HTMLElement>('[data-card-id="three"]')!
    const samples: Array<{ ms: number; y: number; scroll: number }> = []
    const start = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        const ms = performance.now() - start
        // Cross card two's trigger, keep scrolling, and optionally trigger
        // card three before card two has finished its own animation.
        window.scrollTo(0, overlap && ms > 80 ? 595 : 298 + Math.floor(ms / 16) * 6)
        const matrix = new DOMMatrix(getComputedStyle(card).transform)
        samples.push({ ms, y: matrix.m42 + card.offsetHeight / 2, scroll: window.scrollY })
        if (ms < 450) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return samples
  }, overlap)

  const continuous = await sampleMotion(false)
  expect(continuous.some((sample) => sample.y > 100)).toBe(true)
  const settled = continuous.find((sample) => sample.ms >= 330)!
  expect(Math.abs(settled.y)).toBeLessThan(1)
  expect(continuous.at(-1)!.scroll).toBeGreaterThan(settled.scroll)

  await scrollTo(page, 0.04)
  const overlapping = await sampleMotion(true)
  // A newer arrival must not restart the first card's 260ms clock.
  expect(Math.abs(overlapping.find((sample) => sample.ms >= 330)!.y)).toBeLessThan(1)
  expect(await visibleCards(page)).toHaveLength(3)
  await page.screenshot({ path: testInfo.outputPath('independent-snaps.png') })
})
