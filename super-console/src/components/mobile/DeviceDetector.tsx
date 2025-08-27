'use client'

/**
 * Device Detection Utility for Console-Safe Mobile Enhancement
 * 
 * CRITICAL: This is a NEW component - does not modify existing console functionality
 * Purpose: Smart device detection for optimal user experience routing
 */

export class DeviceDetector {
  /**
   * Detect if user is on mobile device
   */
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = [
      'android', 'webos', 'iphone', 'ipad', 'ipod', 
      'blackberry', 'windows phone', 'mobile'
    ]
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword))
  }

  /**
   * Detect if user is on desktop
   */
  static isDesktop(): boolean {
    return !this.isMobile()
  }

  /**
   * Check if device supports touch
   */
  static hasTouch(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - some browsers have this property
      navigator.msMaxTouchPoints > 0
    )
  }

  /**
   * Get viewport dimensions
   */
  static getViewportSize(): { width: number; height: number } {
    if (typeof window === 'undefined') return { width: 1920, height: 1080 }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  /**
   * Detect device performance tier for optimization
   */
  static getPerformanceTier(): 'low' | 'medium' | 'high' {
    if (typeof window === 'undefined') return 'high'
    
    // Basic performance detection based on available APIs
    const { width, height } = this.getViewportSize()
    const pixelRatio = window.devicePixelRatio || 1
    const totalPixels = width * height * pixelRatio
    
    // Basic heuristics for performance tier
    if (totalPixels < 1000000) return 'low'    // < ~720p
    if (totalPixels < 2000000) return 'medium' // < ~1080p
    return 'high'                              // >= 1080p or desktop
  }

  /**
   * Check if device is in landscape orientation
   */
  static isLandscape(): boolean {
    if (typeof window === 'undefined') return true
    
    const { width, height } = this.getViewportSize()
    return width > height
  }

  /**
   * Get optimal interface configuration for device
   */
  static getOptimalConfig() {
    const isMobile = this.isMobile()
    const isDesktop = this.isDesktop()
    const hasTouch = this.hasTouch()
    const performanceTier = this.getPerformanceTier()
    const isLandscape = this.isLandscape()
    
    return {
      device: {
        isMobile,
        isDesktop,
        hasTouch,
        isLandscape
      },
      performance: performanceTier,
      recommendations: {
        useFullConsole: isDesktop,
        showMobileWarning: isMobile,
        enableTouchOptimizations: hasTouch,
        reduceAnimations: performanceTier === 'low'
      }
    }
  }
}

/**
 * React Hook for device detection
 */
export function useDeviceDetection() {
  const [config, setConfig] = React.useState(() => 
    DeviceDetector.getOptimalConfig()
  )

  React.useEffect(() => {
    const handleResize = () => {
      setConfig(DeviceDetector.getOptimalConfig())
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return config
}

// Import React for the hook
import React from 'react'