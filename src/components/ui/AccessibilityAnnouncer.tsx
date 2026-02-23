'use client'

import { useEffect, useState } from 'react'
import { useAccessibilityAnnouncements } from '@/store/useAccessibilityAnnouncements'

export default function AccessibilityAnnouncer() {
  const announcement = useAccessibilityAnnouncements(state => state.announcement)
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  useEffect(() => {
    if (!announcement?.message) return

    if (announcement.priority === 'assertive') {
      setAssertiveMessage('')
      globalThis.requestAnimationFrame(() => setAssertiveMessage(announcement.message))
      return
    }

    setPoliteMessage('')
    globalThis.requestAnimationFrame(() => setPoliteMessage(announcement.message))
  }, [announcement?.id, announcement?.message, announcement?.priority])

  return (
    <>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="sr-announcer-polite"
      >
        {politeMessage}
      </p>
      <p
        className="sr-only"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="sr-announcer-assertive"
      >
        {assertiveMessage}
      </p>
    </>
  )
}
