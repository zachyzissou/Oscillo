import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { addBody } from "../lib/physics"
import { disposeAllObjectAudio, disposeObjectAudio } from '../lib/audio'
import { logger } from '@/lib/logger'

/**
 * Store of musical object metadata with modern Zustand patterns.
 * Only primitive fields and arrays should be stored here.
 * Complex runtime objects (Three.js, Tone.js, DOM) must be referenced by ID.
 */

export type ObjectType = 'note' | 'chord' | 'beat' | 'loop'

export interface MusicalObject {
  id: string
  type: ObjectType
  position: [number, number, number]
  // Optional properties for future expansion
  velocity?: number    // 0-127 MIDI velocity
  duration?: number    // Note duration in seconds
  pitch?: number       // MIDI pitch number
}

export interface ObjectState {
  // State (primitives only)
  objects: MusicalObject[]
  maxObjects: number
  
  // Actions
  spawn: (type: ObjectType, position?: [number, number, number]) => string
  remove: (id: string) => void
  updatePosition: (id: string, position: [number, number, number]) => void
  clear: () => void
  
  // Utilities
  getObjectById: (id: string) => MusicalObject | undefined
  getObjectsByType: (type: ObjectType) => MusicalObject[]
}

const logObjectStoreWarning = (
  event: string,
  details: Record<string, unknown> = {}
) => {
  logger.warn({
    event: `object-store.${event}`,
    ...details,
  })
}

const stringifyError = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const useObjects = create<ObjectState>()(
  subscribeWithSelector((set, get) => ({
    // Default state
    objects: [
      // Create some default interactive shapes for immediate testing
      { id: 'default-note-1', type: 'note', position: [-2, 2, 0] },
      { id: 'default-chord-1', type: 'chord', position: [2, 2, 0] },
      { id: 'default-beat-1', type: 'beat', position: [0, 0, 0] },
      { id: 'default-note-2', type: 'note', position: [-4, 1, -2] },
      { id: 'default-chord-2', type: 'chord', position: [4, 1, -2] },
    ],
    maxObjects: 50,

    spawn: (type: ObjectType, position?: [number, number, number]) => {
      const { objects, maxObjects } = get()
      
      // Prevent spawning too many objects
      if (objects.length >= maxObjects) {
        logObjectStoreWarning('max-objects-reached', {
          maxObjects,
          currentObjectCount: objects.length,
        })
        return ''
      }
      
      // Generate unique ID with timestamp and random component
      const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Validate and clamp position values
      const validatedPosition: [number, number, number] = position ?? [
        Math.random() * 6 - 3,  // x: -3 to 3
        Math.max(0, Math.random() * 4 + 1), // y: 1 to 5 (always above ground)
        Math.random() * 6 - 3,  // z: -3 to 3
      ]
      
      // Clamp position values to reasonable bounds
      validatedPosition[0] = Math.max(-10, Math.min(10, validatedPosition[0]))
      validatedPosition[1] = Math.max(0, Math.min(10, validatedPosition[1]))
      validatedPosition[2] = Math.max(-10, Math.min(10, validatedPosition[2]))
      
      const newObj: MusicalObject = {
        id,
        type,
        position: validatedPosition,
      }
      
      const updated = [...objects, newObj]
      set({ objects: updated })
      
      // Persist to localStorage with error handling
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('musical-objects', JSON.stringify(updated))
        } catch (error) {
          logObjectStoreWarning('storage-save-failed', {
            context: 'spawn',
            error: stringifyError(error),
          })
        }
      }
      
      // Add physics body
      try {
        addBody(id, newObj.position)
      } catch (error) {
        logObjectStoreWarning('physics-add-failed', {
          objectId: id,
          error: stringifyError(error),
        })
      }
      
      return id
    },

    remove: (id: string) => {
      const { objects } = get()
      const updated = objects.filter(obj => obj.id !== id)
      set({ objects: updated })
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('musical-objects', JSON.stringify(updated))
        } catch (error) {
          logObjectStoreWarning('storage-save-failed', {
            context: 'remove',
            objectId: id,
            error: stringifyError(error),
          })
        }
      }

      disposeObjectAudio(id)
    },

    updatePosition: (id: string, position: [number, number, number]) => {
      const { objects } = get()
      
      // Validate position
      const clampedPosition: [number, number, number] = [
        Math.max(-10, Math.min(10, position[0])),
        Math.max(0, Math.min(10, position[1])),
        Math.max(-10, Math.min(10, position[2]))
      ]
      
      const updated = objects.map(obj => 
        obj.id === id ? { ...obj, position: clampedPosition } : obj
      )
      
      set({ objects: updated })
    },

    clear: () => {
      set({ objects: [] })
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('musical-objects')
        } catch (error) {
          logObjectStoreWarning('storage-clear-failed', {
            context: 'clear',
            error: stringifyError(error),
          })
        }
      }

      disposeAllObjectAudio()
    },

    getObjectById: (id: string) => {
      return get().objects.find(obj => obj.id === id)
    },

    getObjectsByType: (type: ObjectType) => {
      return get().objects.filter(obj => obj.type === type)
    },
  }))
)

// Enhanced storage utilities
export function loadObjectsFromStorage() {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem('musical-objects')
    if (!stored) return
    
    const list: MusicalObject[] = JSON.parse(stored)
    
    // Validate loaded objects
    const validObjects = list.filter(obj => 
      obj.id && 
      obj.type && 
      Array.isArray(obj.position) && 
      obj.position.length === 3 &&
      obj.position.every(coord => typeof coord === 'number' && !isNaN(coord))
    )
    
    if (validObjects.length !== list.length) {
      logObjectStoreWarning('invalid-storage-objects-filtered', {
        filteredCount: list.length - validObjects.length,
        loadedCount: list.length,
      })
    }
    
    useObjects.setState({ objects: validObjects })
    
    // Re-add physics bodies
    validObjects.forEach((obj) => {
      try {
        addBody(obj.id, obj.position)
      } catch (error) {
        logObjectStoreWarning('physics-restore-failed', {
          objectId: obj.id,
          error: stringifyError(error),
        })
      }
    })
    
  } catch (err) {
    logger.error({
      event: 'object-store.storage-load-failed',
      error: stringifyError(err),
    })
    // Clear corrupted storage
    localStorage.removeItem('musical-objects')
  }
}

// Save objects to storage (can be called manually)
export function saveObjectsToStorage() {
  if (typeof window === 'undefined') return
  
  try {
    const objects = useObjects.getState().objects
    localStorage.setItem('musical-objects', JSON.stringify(objects))
  } catch (error) {
    logObjectStoreWarning('storage-save-failed', {
      context: 'manual-save',
      error: stringifyError(error),
    })
  }
}
