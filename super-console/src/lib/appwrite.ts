import { Client, Account, Databases, Functions, Storage } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)

export const account = new Account(client)
export const databases = new Databases(client)
export const functions = new Functions(client)
export const storage = new Storage(client)

// Realtime will be initialized on client-side
export let realtime: any = null

if (typeof window !== 'undefined') {
  // For now, we'll handle realtime separately
  // This would need to be implemented based on Appwrite's actual Realtime API
  realtime = {
    subscribe: () => () => {}, // Mock implementation
  }
}

// Database IDs
export const DATABASE_ID = 'super-console'
export const COLLECTIONS = {
  SESSIONS: 'sessions',
  COMMANDS: 'commands',
  FILES: 'files',
  TOOLS: 'tools'
}

// Storage Bucket IDs
export const BUCKETS = {
  WORKSPACE: 'workspace-files',
  OUTPUTS: 'command-outputs'
}

// Function IDs
export const FUNCTIONS = {
  CLAUDE_EXECUTOR: 'claude-executor',
  TOOL_RUNNER: 'tool-runner'
}

export default client