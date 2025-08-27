'use client'

import { useState, useEffect } from 'react'
import { Terminal } from '@/components/terminal/Terminal'
import { FileExplorer } from '@/components/file-explorer/FileExplorer'
import { Header } from '@/components/Header'
import { StatusBar } from '@/components/StatusBar'
import { useSession } from '@/hooks/useSession'
import { useAppwrite } from '@/lib/appwrite-context'

export default function SuperConsole() {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { account } = useAppwrite()
  const { sessions, createSession, deleteSession } = useSession()

  useEffect(() => {
    // Initialize connection
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      await account.get()
      setIsConnected(true)
    } catch (error) {
      console.error('Connection failed:', error)
      setIsConnected(false)
    }
  }

  const handleNewSession = async () => {
    const session = await createSession('New Session')
    setActiveSession(session.$id)
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        sessions={sessions}
        activeSession={activeSession}
        onSessionChange={setActiveSession}
        onNewSession={handleNewSession}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="w-64 border-r border-border bg-card">
          <FileExplorer sessionId={activeSession} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <Terminal sessionId={activeSession} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to Claude Super Console</h2>
                <p className="mb-6">Create a new session to start using Claude Code</p>
                <button
                  onClick={handleNewSession}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  Create New Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <StatusBar isConnected={isConnected} />
    </div>
  )
}