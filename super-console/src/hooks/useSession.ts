'use client'

import { useState, useEffect } from 'react'
import { useAppwrite } from '@/lib/appwrite-context'
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite'
import { ID, Query } from 'appwrite'
import { Session } from '@/types/appwrite'

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const { databases, account } = useAppwrite()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const user = await account.get()
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('lastActiveAt')
        ]
      )
      setSessions(response.documents as unknown as Session[])
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (name: string) => {
    try {
      const user = await account.get()
      const session = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        ID.unique(),
        {
          userId: user.$id,
          sessionName: name,
          status: 'active',
          context: {},
          workspace: {},
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        }
      )
      setSessions(prev => [session as unknown as Session, ...prev])
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        sessionId
      )
      setSessions(prev => prev.filter(s => s.$id !== sessionId))
    } catch (error) {
      console.error('Failed to delete session:', error)
      throw error
    }
  }

  const updateSession = async (sessionId: string, data: Partial<Session>) => {
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.SESSIONS,
        sessionId,
        {
          ...data,
          lastActiveAt: new Date().toISOString()
        }
      )
      setSessions(prev => prev.map(s => s.$id === sessionId ? updated as unknown as Session : s))
      return updated
    } catch (error) {
      console.error('Failed to update session:', error)
      throw error
    }
  }

  return {
    sessions,
    loading,
    createSession,
    deleteSession,
    updateSession,
    refreshSessions: loadSessions
  }
}