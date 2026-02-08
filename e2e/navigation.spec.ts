import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page loads with correct heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=MetaChecker')).toBeVisible()
  })

  test('navigates to /metadata via "Open Tool" link', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Open Tool')
    await expect(page).toHaveURL(/\/metadata/)
    await expect(page.locator('h1:has-text("MetaChecker")')).toBeVisible()
  })

  test('metadata page has URL input form', async ({ page }) => {
    await page.goto('/metadata')
    await expect(page.locator('input[type="url"]')).toBeVisible()
    await expect(page.locator('button:has-text("Check")')).toBeVisible()
  })

  test('generate page loads with tabs', async ({ page }) => {
    await page.goto('/generate')
    await expect(page.locator('text=From URL')).toBeVisible()
    await expect(page.locator('text=From Prompt')).toBeVisible()
  })
})
