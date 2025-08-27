'use client'

import { Circle } from 'lucide-react'

interface StatusBarProps {
  isConnected: boolean
}

export function StatusBar({ isConnected }: StatusBarProps) {
  return (
    <div className="h-8 border-t border-border bg-card flex items-center px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <span>Appwrite Cloud</span>
        <span>v1.0.0</span>
      </div>
    </div>
  )
}