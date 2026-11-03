import { expect, test, type Locator, type Page } from '@playwright/test'

async function scrollProjects(page: Page, progress: number) {
  const sectionTop = await page.locator('.projects-section').evaluate((element) => element.getBoundingClientRect().top + window.scrollY)
  const distance = await page.evaluate(() => Math.max(1200, window.innerHeight * 1.8))
  await page.evaluate(({ top, distance, progress }) => {
    window.scrollTo(0, top + distance * progress)
    document.dispatchEvent(new Event('scroll'))
  }, { top: sectionTop, distance, progress })
  await page.waitForTimeout(450)
}

async function bounds(locator: Locator) {
  return locator.evaluateAll((elements) => elements.map((element) => {
    const { left, right, width, top, height } = element.getBoundingClientRect()
    return { left, right, width, top, height }
  }))
}

test('all five projects reveal together inside the pinned viewport', async ({ page }) => {
  await page.goto('/')
  const names = page.locator('.project-row__main')
  await expect(names.first()).toHaveCSS('opacity', '0')
  await scrollProjects(page, 0.95)
  for (let index = 0; index < 5; index += 1) {
    await expect.poll(async () => Number(await names.nth(index).evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.99)
    const box = await names.nth(index).evaluate((element) => element.getBoundingClientRect().toJSON())
    expect(box.top).toBeGreaterThanOrEqual(0)
    expect(box.bottom).toBeLessThanOrEqual(900)
  }
  await expect(page.locator('.projects-scroll-feedback__tick.is-active')).toHaveCount(1)
})

test('a replacement slot avoids overlap and the old preview completes its 600ms return', async ({ page }) => {
  await page.goto('/')
  await scrollProjects(page, 0.95)
  const row = page.locator('[data-project="adval"]')
  const letters = row.locator('.project-letter')
  const before = await bounds(letters)
  await letters.nth(2).hover()
  const preview = letters.nth(2).locator('.project-letter__preview')
  await expect(preview).toHaveCSS('opacity', '1')
  const image = (await bounds(preview))[0]
  const expanded = await bounds(letters)
  expect(expanded[1].right).toBeLessThan(image.left)
  expect(expanded[3].left).toBeGreaterThan(image.right)
  expect((expanded[0].left + expanded[4].right) / 2).toBeCloseTo(720, 0)
  expect(await preview.locator('img').getAttribute('src')).toBe('/project-images/adval-3.svg')

  await page.mouse.move(10, 10)
  await page.waitForTimeout(120)
  await letters.nth(3).hover()
  await expect(letters.nth(2)).toHaveAttribute('data-closing', 'true')
  await expect(letters.nth(2).locator('.project-letter__preview')).toHaveCSS('opacity', '1')
  await page.waitForTimeout(520)
  await expect(letters.nth(2).locator('.project-letter__preview')).toHaveCSS('opacity', '0')
  await expect(letters.nth(2)).toHaveAttribute('data-closing', 'false')
  expect(Math.abs((await bounds(letters))[2].width - before[2].width)).toBeLessThan(4)
})

test('mobile and reduced-motion layouts stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')
  await scrollProjects(page, 0.95)
  const letters = page.locator('[data-project="noortrack"] .project-letter')
  await letters.nth(8).focus()
  await page.waitForTimeout(250)
  const mobileBounds = await bounds(letters)
  expect(mobileBounds[0].left).toBeGreaterThan(0)
  expect(mobileBounds[8].right).toBeLessThan(320)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  for (let index = 0; index < 5; index += 1) await expect(page.locator('.project-row__main').nth(index)).toHaveCSS('opacity', '1')
})
