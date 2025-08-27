'use client'

import { useEffect, useRef } from 'react'
import { useAppwrite } from '@/lib/appwrite-context'
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { Client } from 'appwrite'

export interface RealtimeMessage {
  type: 'output' | 'error' | 'status' | 'completion'
  content: string
  sessionId: string
  timestamp: string
}

export function useRealtime() {
  const { realtime } = useAppwrite()
  const subscriptions = useRef<Map<string, () => void>>(new Map())

  const subscribe = (sessionId: string, callback: (data: RealtimeMessage) => void) => {
    if (!realtime) {
      // Fallback for server-side rendering
      return () => {}
    }
    
    // Subscribe to session-specific channel
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.COMMANDS}.documents`
    
    const unsubscribe = realtime.subscribe(
      [channel],
      (response: any) => {
        if (response.payload && response.payload.sessionId === sessionId) {
          callback({
            type: response.payload.type || 'output',
            content: response.payload.output || '',
            sessionId: response.payload.sessionId,
            timestamp: response.payload.timestamp
          })
        }
      }
    )

    subscriptions.current.set(sessionId, unsubscribe)
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
      subscriptions.current.delete(sessionId)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup all subscriptions
      subscriptions.current.forEach(unsubscribe => unsubscribe())
      subscriptions.current.clear()
    }
  }, [])

  return { subscribe }
}