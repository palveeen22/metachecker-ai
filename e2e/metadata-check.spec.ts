import { test, expect } from '@playwright/test'

test.describe('Metadata Check', () => {
  test('shows URL input form on /metadata', async ({ page }) => {
    await page.goto('/metadata')
    const input = page.locator('input[type="url"]')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('placeholder', /Enter URL/)
  })

  test('submitting a URL shows loading skeleton', async ({ page }) => {
    await page.goto('/metadata')

    // Intercept the API call to delay the response
    await page.route('**/api/metadata', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ title: 'Test Page', description: 'A test page' }),
      })
    })

    const input = page.locator('input[type="url"]')
    await input.fill('https://example.com')
    await page.click('button:has-text("Check")')

    // Should show loading state
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
  })

  test('displays metadata dashboard after successful check', async ({ page }) => {
    await page.goto('/metadata')

    // Mock the API response
    await page.route('**/api/metadata', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Example Page',
          description: 'This is an example page',
          ogTitle: 'Example OG Title',
          ogDescription: 'Example OG Description',
          twitterCard: 'summary_large_image',
          sitemapExists: false,
          robotsTxtExists: false,
        }),
      })
    })

    const input = page.locator('input[type="url"]')
    await input.fill('https://example.com')
    await page.click('button:has-text("Check")')

    // Wait for dashboard to appear with metadata content
    await expect(page.locator('text=Example Page')).toBeVisible({ timeout: 10000 })
  })

  test('shows error message for failed request', async ({ page }) => {
    await page.goto('/metadata')

    await page.route('**/api/metadata', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Failed to fetch', code: 'INTERNAL_ERROR' } }),
      })
    })

    const input = page.locator('input[type="url"]')
    await input.fill('https://nonexistent.example')
    await page.click('button:has-text("Check")')

    // Error should appear
    await expect(page.locator('text=Failed to fetch')).toBeVisible({ timeout: 10000 })
  })
})
