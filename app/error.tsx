'use client'
import React from 'react'
import { logger } from '@/lib/logger'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    logger.error({
      event: 'app.global-error',
      message: error.message,
      digest: error.digest ?? null,
      stack: error.stack ?? null,
    })
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-400">Something went wrong!</h2>
        <p className="mb-6 text-gray-300">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
