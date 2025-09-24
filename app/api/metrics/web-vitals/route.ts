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
    logger.warn(`web vitals forward failed: ${error}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebVitalsBody
    if (!body?.id || !body?.name || typeof body.value !== 'number') {
      return NextResponse.json({ status: 'ignored' }, { status: 400 })
    }

    logger.info({ event: 'web-vitals', metric: body.name, value: body.value, label: body.label })
    await forwardMetric(body)

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    logger.error(`web vitals handler failed: ${error}`)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ status: 'method-not-allowed' }, { status: 405 })
}
