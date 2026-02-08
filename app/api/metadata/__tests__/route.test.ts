import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'

vi.mock('@/shared/lib/metadata', () => ({
  fetchMetadata: vi.fn(),
}))

import { fetchMetadata } from '@/shared/lib/metadata'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function createRequest(body: unknown) {
  return new Request('http://localhost/api/metadata', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/metadata', () => {
  it('returns 400 when url is missing', async () => {
    const response = await POST(createRequest({}))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when url is not a string', async () => {
    const response = await POST(createRequest({ url: 123 }))
    expect(response.status).toBe(400)
  })

  it('returns metadata on success', async () => {
    const mockMetadata = { title: 'Test Page', description: 'A test page' }
    vi.mocked(fetchMetadata).mockResolvedValueOnce(mockMetadata as never)

    const response = await POST(createRequest({ url: 'https://example.com' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.title).toBe('Test Page')
    expect(data.description).toBe('A test page')
  })

  it('returns 500 when fetchMetadata throws', async () => {
    vi.mocked(fetchMetadata).mockRejectedValueOnce(new Error('Network error'))

    const response = await POST(createRequest({ url: 'https://example.com' }))
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})
