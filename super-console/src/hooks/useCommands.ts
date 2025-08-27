'use client'

import { useState } from 'react'
import { useAppwrite } from '@/lib/appwrite-context'
import { DATABASE_ID, COLLECTIONS, FUNCTIONS } from '@/lib/appwrite'
import { ID } from 'appwrite'
import { Command } from '@/types/appwrite'

export function useCommands(sessionId: string) {
  const [commandHistory, setCommandHistory] = useState<Command[]>([])
  const [executing, setExecuting] = useState(false)
  const { databases, functions } = useAppwrite()

  const executeCommand = async (command: string) => {
    setExecuting(true)
    
    // Create command record
    const commandDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COMMANDS,
      ID.unique(),
      {
        sessionId,
        command,
        status: 'executing',
        timestamp: new Date().toISOString(),
        toolsUsed: []
      }
    )

    try {
      // Execute through Appwrite Function
      const execution = await functions.createExecution(
        FUNCTIONS.CLAUDE_EXECUTOR,
        JSON.stringify({
          sessionId,
          command,
          commandId: commandDoc.$id
        }),
        false
      )

      // Parse response
      const response = JSON.parse(execution.responseBody)
      
      // Update command record
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COMMANDS,
        commandDoc.$id,
        {
          output: response.output,
          status: response.success ? 'completed' : 'failed',
          executionTime: execution.duration * 1000,
          toolsUsed: response.toolsUsed || [],
          error: response.error
        }
      )

      setCommandHistory(prev => [...prev, updated as unknown as Command])
      return response
    } catch (error) {
      // Update command as failed
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COMMANDS,
        commandDoc.$id,
        {
          status: 'failed',
          error: String(error)
        }
      )
      throw error
    } finally {
      setExecuting(false)
    }
  }

  const cancelCommand = async (commandId: string) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COMMANDS,
        commandId,
        {
          status: 'failed',
          error: 'Cancelled by user'
        }
      )
    } catch (error) {
      console.error('Failed to cancel command:', error)
    }
  }

  return {
    executeCommand,
    cancelCommand,
    commandHistory,
    executing
  }
}