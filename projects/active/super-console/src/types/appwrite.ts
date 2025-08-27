import { Models } from 'appwrite'

export interface Session extends Models.Document {
  userId: string
  sessionName: string
  status: 'active' | 'inactive'
  context: any
  workspace: any
  createdAt: string
  lastActiveAt: string
}

export interface Command extends Models.Document {
  sessionId: string
  command: string
  input: any
  output: any
  status: 'pending' | 'executing' | 'completed' | 'failed'
  executionTime: number
  toolsUsed: string[]
  error?: string
  timestamp: string
}

export interface FileNode extends Models.Document {
  sessionId: string
  path: string
  name: string
  type: 'file' | 'folder'
  content?: string
  storageId?: string
  size: number
  metadata?: any
  createdAt: string
  modifiedAt: string
}