import { describe, it, expect } from 'vitest'
import { formatUrl } from '../formatUrl'

describe('formatUrl', () => {
  it('returns formatted URL for valid URLs', () => {
    expect(formatUrl('https://example.com')).toBe('https://example.com/')
  })

  it('returns formatted URL with path and query', () => {
    expect(formatUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
  })

  it('returns "Not found" for undefined input', () => {
    expect(formatUrl(undefined)).toBe('Not found')
  })

  it('returns raw string for invalid URLs', () => {
    expect(formatUrl('not-a-url')).toBe('not-a-url')
  })

  it('handles URLs with fragments', () => {
    expect(formatUrl('https://example.com/page#section')).toBe('https://example.com/page#section')
  })
})
