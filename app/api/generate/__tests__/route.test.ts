import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateContent = vi.fn()

vi.mock('@/shared/lib/metadata', () => ({
  fetchMetadata: vi.fn(),
}))

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return { generateContent: mockGenerateContent }
      }
    },
  }
})

function createRequest(body: unknown) {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  process.env.GEMINI_API_KEY = 'test-key'
})

describe('POST /api/generate', () => {
  it('returns 400 when neither url nor prompt is provided', async () => {
    const { POST } = await import('../route')
    const response = await POST(createRequest({}))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 500 when GEMINI_API_KEY is not set', async () => {
    delete process.env.GEMINI_API_KEY
    const { POST } = await import('../route')
    const response = await POST(createRequest({ prompt: 'test' }))
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error.code).toBe('CONFIGURATION_ERROR')
  })

  it('returns generated metadata for prompt input', async () => {
    const mockResponse = {
      metadata: {
        title: 'Generated Title',
        description: 'Generated description',
      },
      aiAnalysis: {
        missingFields: [],
        improvements: ['Add images'],
        seoScore: 80,
        summary: 'Good start',
      },
    }

    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => JSON.stringify(mockResponse) },
    })

    const { POST } = await import('../route')
    const response = await POST(createRequest({ prompt: 'A blog about cats' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.title).toBe('Generated Title')
    expect(data.aiAnalysis.seoScore).toBe(80)
  })

  it('returns 502 when AI returns no response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => '' },
    })

    const { POST } = await import('../route')
    const response = await POST(createRequest({ prompt: 'test' }))
    expect(response.status).toBe(502)
    const data = await response.json()
    expect(data.error.code).toBe('EXTERNAL_SERVICE_ERROR')
  })

  it('returns 502 when AI returns invalid JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: () => 'This is not valid JSON' },
    })

    const { POST } = await import('../route')
    const response = await POST(createRequest({ prompt: 'test' }))
    expect(response.status).toBe(502)
    const data = await response.json()
    expect(data.error.code).toBe('EXTERNAL_SERVICE_ERROR')
  })
})
