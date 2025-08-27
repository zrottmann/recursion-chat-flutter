'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useCommands } from '@/hooks/useCommands'
import { useRealtime } from '@/hooks/useRealtime'

// Dynamically import xterm to avoid SSR issues
const XTermComponent = dynamic(() => import('./XTermComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-terminal-bg p-4 flex items-center justify-center">
      <div className="text-muted-foreground">Loading terminal...</div>
    </div>
  )
})

interface TerminalProps {
  sessionId: string
}

export function Terminal({ sessionId }: TerminalProps) {
  const { executeCommand } = useCommands(sessionId)

  const handleCommand = async (command: string) => {
    try {
      const result = await executeCommand(command)
      return result
    } catch (error) {
      console.error('Command execution failed:', error)
      throw error
    }
  }

  return <XTermComponent sessionId={sessionId} onCommand={handleCommand} />
}