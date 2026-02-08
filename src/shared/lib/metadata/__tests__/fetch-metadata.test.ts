import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchMetadata } from '../fetch-metadata'

function mockHtml(head: string, lang = 'en') {
  return `<!DOCTYPE html><html lang="${lang}"><head>${head}</head><body></body></html>`
}

function mockFetchResponses(...responses: Array<{ ok: boolean; text?: string; status?: number; statusText?: string }>) {
  const mockFn = vi.fn()
  for (const r of responses) {
    mockFn.mockResolvedValueOnce({
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 404),
      statusText: r.statusText ?? (r.ok ? 'OK' : 'Not Found'),
      text: () => Promise.resolve(r.text ?? ''),
    })
  }
  // Default: all subsequent fetches return 404
  mockFn.mockResolvedValue({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    text: () => Promise.resolve(''),
  })
  return mockFn
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchMetadata', () => {
  it('parses basic SEO tags (title, description, keywords)', async () => {
    const html = mockHtml(`
      <title>Test Page</title>
      <meta name="description" content="A test page description">
      <meta name="keywords" content="test, page, seo">
      <meta name="author" content="Test Author">
    `)

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },   // main URL
      { ok: false },               // robots.txt
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.title).toBe('Test Page')
    expect(result.description).toBe('A test page description')
    expect(result.keywords).toBe('test, page, seo')
    expect(result.author).toBe('Test Author')
    expect(result.language).toBe('en')
  })

  it('parses Open Graph tags', async () => {
    const html = mockHtml(`
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Description">
      <meta property="og:image" content="https://example.com/image.jpg">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="Test Site">
    `)

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },
      { ok: false },
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.ogTitle).toBe('OG Title')
    expect(result.ogDescription).toBe('OG Description')
    expect(result.ogImage).toBe('https://example.com/image.jpg')
    expect(result.ogImageWidth).toBe('1200')
    expect(result.ogImageHeight).toBe('630')
    expect(result.ogType).toBe('website')
    expect(result.ogSiteName).toBe('Test Site')
  })

  it('parses Twitter Card tags', async () => {
    const html = mockHtml(`
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Twitter Title">
      <meta name="twitter:description" content="Twitter Description">
      <meta name="twitter:site" content="@testsite">
      <meta name="twitter:creator" content="@testcreator">
    `)

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },
      { ok: false },
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.twitterCard).toBe('summary_large_image')
    expect(result.twitterTitle).toBe('Twitter Title')
    expect(result.twitterDescription).toBe('Twitter Description')
    expect(result.twitterSite).toBe('@testsite')
    expect(result.twitterCreator).toBe('@testcreator')
  })

  it('returns undefined for missing tags', async () => {
    const html = mockHtml('<title>Only Title</title>')

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },
      { ok: false },
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.title).toBe('Only Title')
    expect(result.description).toBeUndefined()
    expect(result.ogTitle).toBeUndefined()
    expect(result.twitterCard).toBeUndefined()
    expect(result.favicon).toBeUndefined()
  })

  it('detects robots.txt and extracts sitemap', async () => {
    const html = mockHtml('<title>Test</title>')
    const robotsTxt = 'User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml'

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },
      { ok: true, text: robotsTxt },
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.robotsTxtExists).toBe(true)
    expect(result.robotsTxtContent).toBe(robotsTxt)
    expect(result.sitemapUrl).toBe('https://example.com/sitemap.xml')
    expect(result.sitemapExists).toBe(true)
  })

  it('falls back to common sitemap paths when not in robots.txt', async () => {
    const html = mockHtml('<title>Test</title>')

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },           // main URL
      { ok: true, text: 'User-agent: *' }, // robots.txt (no sitemap)
      { ok: true, text: '<xml/>' },        // /sitemap.xml found
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.robotsTxtExists).toBe(true)
    expect(result.sitemapExists).toBe(true)
    expect(result.sitemapUrl).toBe('https://example.com/sitemap.xml')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: false, status: 404, statusText: 'Not Found' },
    ))

    await expect(fetchMetadata('https://example.com')).rejects.toThrow(
      'Failed to fetch URL: 404 Not Found'
    )
  })

  it('parses technical SEO fields', async () => {
    const html = mockHtml(`
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="robots" content="index, follow">
      <link rel="canonical" href="https://example.com/page">
      <link rel="icon" href="/favicon.ico">
      <link rel="manifest" href="/manifest.json">
    `)

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },
      { ok: false },
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.charset).toBe('UTF-8')
    expect(result.viewport).toBe('width=device-width, initial-scale=1')
    expect(result.robots).toBe('index, follow')
    expect(result.canonicalUrl).toBe('https://example.com/page')
    expect(result.favicon).toBe('/favicon.ico')
    expect(result.manifest).toBe('/manifest.json')
  })

  it('parses Discord and Slack fields from OG tags', async () => {
    const html = mockHtml(`
      <meta property="og:title" content="My Page">
      <meta property="og:description" content="My Description">
      <meta property="og:image" content="https://example.com/img.jpg">
      <meta property="og:type" content="article">
    `)

    vi.stubGlobal('fetch', mockFetchResponses(
      { ok: true, text: html },
      { ok: false },
    ))

    const result = await fetchMetadata('https://example.com')
    expect(result.discordTitle).toBe('My Page')
    expect(result.discordDescription).toBe('My Description')
    expect(result.discordImage).toBe('https://example.com/img.jpg')
    expect(result.slackTitle).toBe('My Page')
    expect(result.slackType).toBe('article')
  })
})
