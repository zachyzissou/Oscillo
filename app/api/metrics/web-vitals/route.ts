import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

type WebVitalsBody = {
  id: string
  name: string
  label: string
  value: number
  delta?: number
  entries?: unknown
  url?: string
  timestamp?: string
}

const FORWARD_ENDPOINT = process.env.ANALYTICS_FORWARD_URL
const FORWARD_TOKEN = process.env.ANALYTICS_FORWARD_TOKEN
const WEB_VITAL_NAMES = new Set(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'])

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isValidHttpUrl = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const isValidTimestamp = (value: unknown): value is string =>
  isNonEmptyString(value) && !Number.isNaN(Date.parse(value))

export function isWebVitalsBody(value: unknown): value is WebVitalsBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const body = value as Record<string, unknown>
  if (!isNonEmptyString(body.id) || body.id.length > 256) return false
  if (!isNonEmptyString(body.name) || !WEB_VITAL_NAMES.has(body.name)) return false
  if (!isNonEmptyString(body.label) || body.label.length > 64) return false
  if (!isFiniteNumber(body.value) || body.value < 0) return false

  if (body.delta !== undefined && !isFiniteNumber(body.delta)) return false
  if (body.url !== undefined && !isValidHttpUrl(body.url)) return false
  if (body.timestamp !== undefined && !isValidTimestamp(body.timestamp)) return false
  if (body.entries !== undefined && !Array.isArray(body.entries)) return false

  return true
}

async function forwardMetric(body: WebVitalsBody) {
  if (!FORWARD_ENDPOINT) return
  try {
    await fetch(FORWARD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(FORWARD_TOKEN ? { Authorization: `Bearer ${FORWARD_TOKEN}` } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    logger.warn({
      event: 'web-vitals-forward-failed',
      error: String(error),
      endpoint: FORWARD_ENDPOINT,
      metric: body.name,
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown
    if (!isWebVitalsBody(body)) {
      logger.warn({
        event: 'web-vitals-rejected',
        reason: 'invalid-payload-shape',
        payloadType: Array.isArray(body) ? 'array' : typeof body,
      })
      return NextResponse.json({ status: 'ignored' }, { status: 400 })
    }

    logger.info({ event: 'web-vitals', metric: body.name, value: body.value, label: body.label })
    await forwardMetric(body)

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    logger.error({ event: 'web-vitals-handler-failed', error: String(error) })
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ status: 'method-not-allowed' }, { status: 405 })
}
