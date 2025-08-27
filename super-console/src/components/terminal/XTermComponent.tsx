'use client'

import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useRealtime } from '@/hooks/useRealtime'
import '@xterm/xterm/css/xterm.css'

interface XTermComponentProps {
  sessionId: string
  onCommand: (command: string) => Promise<any>
}

export default function XTermComponent({ sessionId, onCommand }: XTermComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const { subscribe } = useRealtime()

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize xterm
    const term = new XTerm({
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: '#5a5a5a'
      },
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      cursorBlink: true,
      convertEol: true
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(terminalRef.current)
    
    fitAddon.fit()
    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Welcome message
    term.writeln('\x1b[1;36mClaude Super Console v1.0.0\x1b[0m')
    term.writeln('\x1b[90mType "help" for available commands\x1b[0m')
    term.write('\r\n$ ')

    // Handle input
    let currentLine = ''
    term.onData(data => {
      switch (data) {
        case '\r': // Enter
          term.write('\r\n')
          if (currentLine.trim()) {
            handleCommand(currentLine)
          }
          currentLine = ''
          setTimeout(() => term.write('$ '), 100)
          break
        case '\u007F': // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1)
            term.write('\b \b')
          }
          break
        case '\u0003': // Ctrl+C
          term.write('^C\r\n$ ')
          currentLine = ''
          break
        default:
          if (data >= ' ') {
            currentLine += data
            term.write(data)
          }
      }
    })

    // Handle window resize
    const handleResize = () => {
      fitAddonRef.current?.fit()
    }
    window.addEventListener('resize', handleResize)

    // Subscribe to realtime updates
    const unsubscribe = subscribe(sessionId, (data) => {
      if (data.type === 'output') {
        term.writeln(data.content)
      }
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      unsubscribe()
      term.dispose()
    }
  }, [sessionId])

  const handleCommand = async (command: string) => {
    const term = xtermRef.current
    if (!term) return

    term.writeln(`\x1b[90mExecuting: ${command}\x1b[0m`)
    
    try {
      const result = await onCommand(command)
      
      if (result.output) {
        result.output.split('\n').forEach((line: string) => {
          term.writeln(line)
        })
      }
      
      if (result.error) {
        term.writeln(`\x1b[31mError: ${result.error}\x1b[0m`)
      }
    } catch (error) {
      term.writeln(`\x1b[31mExecution failed: ${error}\x1b[0m`)
    }
  }

  return (
    <div className="flex-1 bg-terminal-bg p-4">
      <div ref={terminalRef} className="h-full" />
    </div>
  )
}