import { create } from 'zustand'

type AnnouncementPriority = 'polite' | 'assertive'

interface AccessibilityAnnouncement {
  id: number
  message: string
  priority: AnnouncementPriority
}

interface AccessibilityAnnouncementState {
  announcement: AccessibilityAnnouncement | null
  announcePolite: (message: string) => void
  announceAssertive: (message: string) => void
}

let nextAnnouncementId = 1

const pushAnnouncement =
  (
    set: (partial: Partial<AccessibilityAnnouncementState>) => void,
    priority: AnnouncementPriority
  ) =>
  (message: string) => {
    const trimmed = message.trim()
    if (!trimmed) return

    set({
      announcement: {
        id: nextAnnouncementId,
        message: trimmed,
        priority,
      },
    })

    nextAnnouncementId += 1
  }

export const useAccessibilityAnnouncements = create<AccessibilityAnnouncementState>(set => ({
  announcement: null,
  announcePolite: pushAnnouncement(set, 'polite'),
  announceAssertive: pushAnnouncement(set, 'assertive'),
}))
