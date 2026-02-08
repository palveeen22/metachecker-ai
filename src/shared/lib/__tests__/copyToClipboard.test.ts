import { describe, it, expect, vi, beforeEach } from 'vitest'
import { copyToClipboard } from '../copyToClipboard'

describe('copyToClipboard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('calls navigator.clipboard.writeText with the provided text', async () => {
    await copyToClipboard('hello world')
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world')
  })

  it('resolves successfully', async () => {
    await expect(copyToClipboard('test')).resolves.toBeUndefined()
  })
})
