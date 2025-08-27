'use client'

import { createContext, useContext, ReactNode } from 'react'
import { account, databases, functions, storage, realtime } from './appwrite'

interface AppwriteContextType {
  account: typeof account
  databases: typeof databases
  functions: typeof functions
  storage: typeof storage
  realtime: typeof realtime
}

const AppwriteContext = createContext<AppwriteContextType | undefined>(undefined)

export function AppwriteProvider({ children }: { children: ReactNode }) {
  return (
    <AppwriteContext.Provider
      value={{
        account,
        databases,
        functions,
        storage,
        realtime
      }}
    >
      {children}
    </AppwriteContext.Provider>
  )
}

export function useAppwrite() {
  const context = useContext(AppwriteContext)
  if (!context) {
    throw new Error('useAppwrite must be used within AppwriteProvider')
  }
  return context
}