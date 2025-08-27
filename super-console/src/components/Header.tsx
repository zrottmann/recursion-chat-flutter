'use client'

import { Session } from '@/types/appwrite'
import { Plus, Terminal, ChevronDown, X } from 'lucide-react'

interface HeaderProps {
  sessions: Session[]
  activeSession: string | null
  onSessionChange: (sessionId: string) => void
  onNewSession: () => void
}

export function Header({ sessions, activeSession, onSessionChange, onNewSession }: HeaderProps) {
  const currentSession = sessions.find(s => s.$id === activeSession)

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4">
      <div className="flex items-center gap-2">
        <Terminal className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold">Claude Super Console</h1>
      </div>
      
      <div className="ml-8 flex items-center gap-2">
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition">
            <span className="text-sm">
              {currentSession?.sessionName || 'No Session'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {sessions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              {sessions.map(session => (
                <button
                  key={session.$id}
                  onClick={() => onSessionChange(session.$id)}
                  className="w-full text-left px-3 py-2 hover:bg-accent transition flex items-center justify-between"
                >
                  <span className="text-sm">{session.sessionName}</span>
                  {session.$id === activeSession && (
                    <span className="text-xs text-primary">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={onNewSession}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>
    </header>
  )
}