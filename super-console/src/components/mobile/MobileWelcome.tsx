'use client'

import { useState, useEffect } from 'react'
import { DeviceDetector, useDeviceDetection } from './DeviceDetector'

/**
 * Mobile Welcome Component for Super Console
 * 
 * CRITICAL: This is a NEW component - does not modify existing console functionality
 * Purpose: Mobile-optimized welcome interface with console preservation
 */

interface MobileWelcomeProps {
  isDesktop: boolean
  onProceedToConsole: () => void
}

export function MobileWelcome({ isDesktop, onProceedToConsole }: MobileWelcomeProps) {
  const [showDetails, setShowDetails] = useState(false)
  const deviceConfig = useDeviceDetection()

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Claude Super Console
          </h1>
          <p className="text-muted-foreground">
            {isDesktop ? 'Desktop Console Interface' : 'Mobile Access Point'}
          </p>
        </div>

        {/* Device-specific messaging */}
        {isDesktop ? (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-primary text-xl">💻</span>
              <div>
                <h3 className="font-medium text-foreground mb-1">Desktop Detected</h3>
                <p className="text-sm text-muted-foreground">
                  You're on a desktop device. Access the full console for the complete development experience.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 text-xl">📱</span>
              <div>
                <h3 className="font-medium text-foreground mb-1">Mobile Device Detected</h3>
                <p className="text-sm text-muted-foreground">
                  Limited functionality available on mobile. For full development features, use a desktop.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Console Features Overview */}
        <div className="space-y-3 mb-6">
          <h3 className="font-medium text-foreground">Console Features:</h3>
          
          <div className="space-y-2">
            <FeatureItem
              icon="🖥️"
              title="Terminal Interface"
              available={isDesktop}
              description="Command execution and shell access"
            />
            <FeatureItem
              icon="📁"
              title="File Explorer"
              available={isDesktop}
              description="Project navigation and file management"
            />
            <FeatureItem
              icon="🔄"
              title="Session Management"
              available={isDesktop}
              description="Multiple development sessions"
            />
            <FeatureItem
              icon="📡"
              title="Real-time Connection"
              available={true}
              description="Live status and monitoring"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onProceedToConsole}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 px-4 font-medium hover:bg-primary/90 transition-colors"
          >
            {isDesktop ? 'Launch Console Interface' : 'Access Console (Limited)'}
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full bg-secondary text-secondary-foreground rounded-lg py-3 px-4 font-medium hover:bg-secondary/90 transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Device Information'}
          </button>
        </div>

        {/* Device Details (Expandable) */}
        {showDetails && (
          <div className="mt-6 bg-card border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Device Configuration</h4>
            <div className="space-y-2 text-sm">
              <DetailItem
                label="Device Type"
                value={deviceConfig.device.isMobile ? 'Mobile' : 'Desktop'}
              />
              <DetailItem
                label="Touch Support"
                value={deviceConfig.device.hasTouch ? 'Yes' : 'No'}
              />
              <DetailItem
                label="Orientation"
                value={deviceConfig.device.isLandscape ? 'Landscape' : 'Portrait'}
              />
              <DetailItem
                label="Performance Tier"
                value={deviceConfig.performance.charAt(0).toUpperCase() + deviceConfig.performance.slice(1)}
              />
              <DetailItem
                label="Recommended Interface"
                value={deviceConfig.recommendations.useFullConsole ? 'Full Console' : 'Mobile Interface'}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Claude Super Console preserves all desktop functionality while providing mobile access
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Feature Item Component
 */
interface FeatureItemProps {
  icon: string
  title: string
  available: boolean
  description: string
}

function FeatureItem({ icon, title, available, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-card/50 rounded-lg border border-border/50">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm text-foreground">{title}</h4>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              available
                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            }`}
          >
            {available ? 'Available' : 'Limited'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

/**
 * Detail Item Component
 */
interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}