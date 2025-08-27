'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DeviceDetector } from '@/components/mobile/DeviceDetector'
import { MobileWelcome } from '@/components/mobile/MobileWelcome'

/**
 * Mobile Entry Point for Super Console
 * 
 * CRITICAL: This is an ADDITIVE route - does NOT modify existing console functionality
 * Purpose: Provide mobile-optimized entry point while preserving all console features
 */
export default function MobilePage() {
  const router = useRouter()
  const [isDesktop, setIsDesktop] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Device detection and routing logic
    const checkDevice = () => {
      const desktop = DeviceDetector.isDesktop()
      setIsDesktop(desktop)
      setIsLoading(false)
      
      // If desktop user accessed /mobile, suggest main console
      if (desktop) {
        setTimeout(() => {
          const useMainConsole = confirm(
            'You\'re on a desktop device. Would you like to use the full console interface for the best experience?'
          )
          if (useMainConsole) {
            router.push('/')
          }
        }, 2000)
      }
    }

    checkDevice()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mobile interface...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-optimized welcome interface */}
      <MobileWelcome 
        isDesktop={isDesktop}
        onProceedToConsole={() => router.push('/')}
      />
      
      {/* Mobile-specific console introduction */}
      <div className="p-6 space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            📱 Mobile Console Access
          </h2>
          <p className="text-muted-foreground mb-4">
            Claude Super Console is optimized for desktop development workflows. 
            On mobile devices, you can:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              View and monitor your development sessions
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Check connection status and logs
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Access basic file browsing (read-only)
            </li>
          </ul>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-6">
          <h3 className="text-lg font-medium mb-3 text-foreground">
            🖥️ Best Experience
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            For full development capabilities including terminal access, 
            file editing, and session management, use Claude Super Console on a desktop computer.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 px-4 font-medium hover:bg-primary/90 transition-colors"
          >
            Access Console Interface
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Claude Super Console • Mobile Access Point
          </p>
        </div>
      </div>
    </div>
  )
}