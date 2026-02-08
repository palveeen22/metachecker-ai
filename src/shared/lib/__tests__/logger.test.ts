import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logger.info outputs JSON with timestamp and level', () => {
    logger.info('test message', { key: 'value' })
    expect(console.info).toHaveBeenCalledOnce()
    const output = JSON.parse((console.info as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(output.level).toBe('info')
    expect(output.message).toBe('test message')
    expect(output.key).toBe('value')
    expect(output.timestamp).toBeDefined()
  })

  it('logger.warn outputs with warn level', () => {
    logger.warn('warning')
    expect(console.warn).toHaveBeenCalledOnce()
    const output = JSON.parse((console.warn as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(output.level).toBe('warn')
  })

  it('logger.error includes error details when passed an Error', () => {
    const error = new Error('something broke')
    logger.error('failed', error, { route: '/test' })
    expect(console.error).toHaveBeenCalledOnce()
    const output = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(output.level).toBe('error')
    expect(output.errorName).toBe('Error')
    expect(output.errorMessage).toBe('something broke')
    expect(output.stack).toBeDefined()
    expect(output.route).toBe('/test')
  })

  it('logger.error works without error parameter', () => {
    logger.error('failed')
    expect(console.error).toHaveBeenCalledOnce()
    const output = JSON.parse((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(output.level).toBe('error')
    expect(output.errorName).toBeUndefined()
  })

  it('logger.debug only logs in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    logger.debug('debug message')
    expect(console.debug).toHaveBeenCalledOnce()

    vi.mocked(console.debug).mockClear()
    process.env.NODE_ENV = 'production'
    logger.debug('debug message')
    expect(console.debug).not.toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })
})
