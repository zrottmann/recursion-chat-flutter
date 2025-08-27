'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DeviceDetector } from '@/components/mobile/DeviceDetector'

/**
 * Welcome/Splash Page for Super Console
 * 
 * CRITICAL: This is an ADDITIVE route - does NOT modify existing console functionality
 * Purpose: Universal splash page for both mobile and desktop users
 */
export default function WelcomePage() {
  const router = useRouter()
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const config = DeviceDetector.getOptimalConfig()
    setDeviceInfo(config)
    setIsLoading(false)
  }, [])

  const handleProceedToConsole = () => {
    router.push('/')
  }

  const handleMobileOptimized = () => {
    router.push('/mobile')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Claude Super Console...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-6xl">🤖</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Claude Super Console
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Web-based console interface for Claude Code development workflows. 
            Access your development environment from anywhere.
          </p>
          
          {/* Device-specific badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <span>
              {deviceInfo?.device.isMobile ? '📱' : '💻'}
            </span>
            {deviceInfo?.device.isMobile ? 'Mobile Device' : 'Desktop Device'} Detected
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <FeatureCard
            icon="🖥️"
            title="Terminal Access"
            description="Full terminal interface with command execution capabilities"
            available={deviceInfo?.device.isDesktop}
          />
          <FeatureCard
            icon="📁"
            title="File Explorer"
            description="Browse and manage your project files and directories"
            available={deviceInfo?.device.isDesktop}
          />
          <FeatureCard
            icon="🔄"
            title="Session Management"
            description="Multiple development sessions with state persistence"
            available={deviceInfo?.device.isDesktop}
          />
          <FeatureCard
            icon="📡"
            title="Real-time Monitoring"
            description="Live connection status and system monitoring"
            available={true}
          />
        </div>

        {/* Device-specific recommendations */}
        {deviceInfo?.device.isMobile ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Mobile Access Notice
                </h3>
                <p className="text-muted-foreground mb-4">
                  Claude Super Console is optimized for desktop development workflows. 
                  On mobile devices, functionality is limited to monitoring and basic navigation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleMobileOptimized}
                    className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 px-4 py-2 rounded-lg transition-colors"
                  >
                    Mobile Interface
                  </button>
                  <button
                    onClick={handleProceedToConsole}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
                  >
                    Access Console
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-2xl">💻</span>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Full Console Experience Available
                </h3>
                <p className="text-muted-foreground mb-4">
                  You're on a desktop device with access to all console features including 
                  terminal, file management, and advanced development tools.
                </p>
                <button
                  onClick={handleProceedToConsole}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Launch Console Interface
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Requirements */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Requirements</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">🖥️ Desktop (Recommended)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>• WebSocket support required</li>
                <li>• JavaScript enabled</li>
                <li>• Minimum 1024x768 resolution</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">📱 Mobile (Limited)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• iOS Safari 12+ or Android Chrome 80+</li>
                <li>• Touch-optimized interface</li>
                <li>• Read-only file access</li>
                <li>• Monitoring and status viewing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Claude Super Console preserves your development workflow across devices
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>Built with Next.js</span>
            <span>•</span>
            <span>Powered by Appwrite</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Feature Card Component
 */
interface FeatureCardProps {
  icon: string
  title: string
  description: string
  available: boolean
}

function FeatureCard({ icon, title, description, available }: FeatureCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
        {title}
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            available
              ? 'bg-green-500/10 text-green-500'
              : 'bg-yellow-500/10 text-yellow-500'
          }`}
        >
          {available ? 'Available' : 'Limited'}
        </span>
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}