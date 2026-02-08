import { test, expect } from '@playwright/test'

test.describe('AI Generate', () => {
  test('shows tabbed form on /generate', async ({ page }) => {
    await page.goto('/generate')
    await expect(page.locator('text=From URL')).toBeVisible()
    await expect(page.locator('text=From Prompt')).toBeVisible()
  })

  test('can switch between URL and Prompt tabs', async ({ page }) => {
    await page.goto('/generate')

    // Default is URL tab - check for URL input
    await expect(page.locator('input[type="url"]')).toBeVisible()

    // Switch to Prompt tab
    await page.click('text=From Prompt')
    await expect(page.locator('textarea')).toBeVisible()

    // Switch back to URL tab
    await page.click('text=From URL')
    await expect(page.locator('input[type="url"]')).toBeVisible()
  })

  test('shows example prompts in prompt mode', async ({ page }) => {
    await page.goto('/generate')
    await page.click('text=From Prompt')

    await expect(page.locator('text=Example Prompts')).toBeVisible()
  })

  test('generates metadata from prompt with mocked API', async ({ page }) => {
    await page.goto('/generate')

    // Mock the generate API
    await page.route('**/api/generate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'AI Generated Title',
          description: 'AI generated description for testing',
          ogTitle: 'OG Title',
          sitemapExists: false,
          robotsTxtExists: false,
          aiAnalysis: {
            missingFields: [],
            improvements: ['Add images'],
            seoScore: 85,
            summary: 'Good metadata',
          },
        }),
      })
    })

    // Switch to prompt tab and enter a prompt
    await page.click('text=From Prompt')
    const textarea = page.locator('textarea')
    await textarea.fill('A personal blog about web development')
    await page.click('button:has-text("Generate with AI")')

    // Wait for results
    await expect(page.locator('text=AI Generated Title')).toBeVisible({ timeout: 10000 })
  })
})
