import { describe, it, expect } from 'vitest'
import {
  AppError,
  ValidationError,
  ExternalServiceError,
  ConfigurationError,
  toErrorResponse,
} from '../errors'

describe('Error classes', () => {
  it('ValidationError has statusCode 400 and correct code', () => {
    const error = new ValidationError('Bad input')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Bad input')
    expect(error.name).toBe('ValidationError')
    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(Error)
  })

  it('ExternalServiceError has statusCode 502', () => {
    const error = new ExternalServiceError('gemini', 'Service down')
    expect(error.statusCode).toBe(502)
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
    expect(error.message).toBe('Service down')
  })

  it('ConfigurationError has statusCode 500', () => {
    const error = new ConfigurationError('Missing key')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe('CONFIGURATION_ERROR')
  })

  it('AppError supports details', () => {
    const error = new ValidationError('Bad input', { field: 'url' })
    expect(error.details).toEqual({ field: 'url' })
  })
})

describe('toErrorResponse', () => {
  it('converts AppError to structured response', () => {
    const error = new ValidationError('URL is required')
    const { body, status } = toErrorResponse(error)
    expect(status).toBe(400)
    expect(body).toEqual({
      error: { message: 'URL is required', code: 'VALIDATION_ERROR' },
    })
  })

  it('converts SyntaxError to PARSE_ERROR', () => {
    const error = new SyntaxError('Unexpected token')
    const { body, status } = toErrorResponse(error)
    expect(status).toBe(400)
    expect(body.error.code).toBe('PARSE_ERROR')
  })

  it('converts unknown errors to INTERNAL_ERROR', () => {
    const { body, status } = toErrorResponse(new Error('random'))
    expect(status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('An unexpected error occurred')
  })

  it('handles non-Error objects', () => {
    const { body, status } = toErrorResponse('string error')
    expect(status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
