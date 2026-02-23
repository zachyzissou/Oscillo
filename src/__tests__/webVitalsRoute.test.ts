import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerSpies = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: loggerSpies,
}))

import { POST, isWebVitalsBody } from '../../app/api/metrics/web-vitals/route'

const validPayload = {
  id: 'v1-123',
  name: 'CLS',
  label: 'web-vital',
  value: 0.12,
  delta: 0.01,
  entries: [],
  url: 'https://oscillo.app/',
  timestamp: '2026-03-04T12:00:00.000Z',
}

function buildRequest(payload: unknown): Request {
  return new Request('http://localhost/api/metrics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

describe('web vitals payload guard', () => {
  it('accepts a valid web vitals payload', () => {
    expect(isWebVitalsBody(validPayload)).toBe(true)
  })

  it.each([
    [{ ...validPayload, name: 'UNKNOWN' }, 'unsupported metric name'],
    [{ ...validPayload, value: '0.12' }, 'non-numeric metric value'],
    [{ ...validPayload, url: 'ftp://oscillo.app' }, 'invalid URL protocol'],
    [{ ...validPayload, timestamp: 'not-a-date' }, 'invalid timestamp'],
    [{ ...validPayload, entries: {} }, 'non-array entries'],
    [null, 'null payload'],
  ])('rejects invalid payload shape: %s', (payload) => {
    expect(isWebVitalsBody(payload)).toBe(false)
  })
})

describe('web vitals route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 for a valid payload', async () => {
    const response = await POST(buildRequest(validPayload))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ status: 'ok' })
    expect(loggerSpies.info).toHaveBeenCalledWith({
      event: 'web-vitals',
      metric: 'CLS',
      value: 0.12,
      label: 'web-vital',
    })
    expect(loggerSpies.warn).not.toHaveBeenCalled()
  })

  it('returns 400 and logs warning for invalid payload', async () => {
    const response = await POST(buildRequest({ ...validPayload, value: 'bad' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ status: 'ignored' })
    expect(loggerSpies.warn).toHaveBeenCalledWith({
      event: 'web-vitals-rejected',
      reason: 'invalid-payload-shape',
      payloadType: 'object',
    })
  })
})
