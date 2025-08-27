# Mobile-Responsive Design System

A comprehensive mobile-first design system providing consistent responsive behavior, touch optimization, and mobile-specific utilities across all projects.

## Features

✅ **Mobile-First Approach**: Designed for mobile, enhanced for desktop  
✅ **iOS Safari Optimization**: Handles viewport issues, safe areas, virtual keyboard  
✅ **Touch-Friendly**: 44px+ touch targets, gesture support, haptic feedback  
✅ **Safe Area Support**: Automatic notch and home indicator handling  
✅ **Performance Optimized**: Debounced events, lazy loading, animation controls  
✅ **Accessibility**: WCAG compliance, high contrast, reduced motion support  
✅ **Dark Mode**: Automatic system preference detection  
✅ **Network Aware**: Adapts behavior based on connection speed  

## Quick Start

### 1. Import Base Styles

```css
/* In your main CSS file */
@import './components/MobileResponsive/mobile-base.css';
```

### 2. Initialize JavaScript Utilities

```javascript
// In your main JavaScript file
import { initializeMobile } from './components/MobileResponsive/mobile-utils.js';

// Initialize with default options
initializeMobile();

// Or with custom options
initializeMobile({
  trackViewport: true,
  preventInputZoom: true,
  enableTouchFeedback: true,
  optimizePerformance: true
});
```

### 3. Add Mobile Classes to HTML

```html
<div class="mobile-viewport mobile-safe-area">
  <header class="mobile-header">
    <button class="mobile-header-back">← Back</button>
    <h1 class="mobile-header-title">Page Title</h1>
    <button class="mobile-header-action">Save</button>
  </header>
  
  <main class="container">
    <div class="mobile-card">
      <h2 class="mobile-text-xl mobile-font-semibold">Card Title</h2>
      <p class="mobile-text-base mobile-space-y-md">Content goes here</p>
    </div>
  </main>
  
  <nav class="mobile-nav">
    <a href="#home" class="mobile-nav-item active">
      <span class="mobile-nav-icon">🏠</span>
      <span class="mobile-nav-label">Home</span>
    </a>
    <a href="#profile" class="mobile-nav-item">
      <span class="mobile-nav-icon">👤</span>
      <span class="mobile-nav-label">Profile</span>
    </a>
  </nav>
</div>
```

## CSS Framework

### Responsive Breakpoints

```css
/* Mobile First: 0-767px (base styles) */
.container { padding: 0 16px; }

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
  .container { padding: 0 24px; max-width: 768px; }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container { padding: 0 32px; max-width: 1200px; }
}

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) {
  .container { padding: 0 40px; max-width: 1400px; }
}
```

### Touch-Friendly Components

```css
/* Minimum 44px touch targets */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}

/* Enhanced touch buttons */
.btn-touch {
  min-height: 48px;
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 12px;
}

/* Form controls optimized for touch */
.form-control-touch {
  min-height: 48px;
  font-size: 16px; /* Prevents iOS zoom */
  padding: 12px 16px;
}
```

### Safe Area Support

```css
/* Automatic safe area handling */
.mobile-safe-area {
  padding: 
    env(safe-area-inset-top) 
    env(safe-area-inset-right) 
    env(safe-area-inset-bottom) 
    env(safe-area-inset-left);
}

/* Header with status bar spacing */
.mobile-header {
  padding-top: calc(12px + env(safe-area-inset-top));
}

/* Bottom navigation with home indicator spacing */
.mobile-nav {
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}
```

## JavaScript Utilities

### Device Detection

```javascript
import { deviceUtils } from './mobile-utils.js';

// Check device type
if (deviceUtils.isIOS()) {
  console.log('Running on iOS');
}

if (deviceUtils.isIOSSafari()) {
  console.log('Running in iOS Safari - apply fixes');
}

// Get device info
const screenInfo = deviceUtils.getScreenInfo();
console.log('Screen:', screenInfo.width + 'x' + screenInfo.height);
```

### Viewport Management

```javascript
import { viewportUtils } from './mobile-utils.js';

// Initialize viewport tracking
viewportUtils.initViewportTracking();

// Check if virtual keyboard is open
if (viewportUtils.isVirtualKeyboardOpen()) {
  console.log('Virtual keyboard is open');
}

// Get accurate viewport dimensions
const viewport = viewportUtils.getViewport();
```

### Touch Interactions

```javascript
import { touchUtils } from './mobile-utils.js';

// Add touch feedback to buttons
const button = document.querySelector('.my-button');
touchUtils.addTouchFeedback(button, {
  scaleDown: 0.95,
  duration: 150
});

// Handle swipe gestures
const container = document.querySelector('.swipe-container');
touchUtils.addSwipeHandler(container, {
  swipeLeft: (e) => console.log('Swiped left'),
  swipeRight: (e) => console.log('Swiped right'),
  swipeUp: (e) => console.log('Swiped up'),
  swipeDown: (e) => console.log('Swiped down')
});
```

### Form Optimization

```javascript
import { formUtils } from './mobile-utils.js';

// Prevent iOS zoom on input focus
formUtils.preventInputZoom();

// Handle virtual keyboard
const cleanupKeyboard = formUtils.handleVirtualKeyboard(({ isOpen, height }) => {
  if (isOpen) {
    document.body.style.paddingBottom = height + 'px';
  } else {
    document.body.style.paddingBottom = '';
  }
});

// Scroll input into view on focus
const input = document.querySelector('#my-input');
input.addEventListener('focus', () => {
  formUtils.scrollInputIntoView(input);
});
```

### Storage with Mobile Considerations

```javascript
import { storageUtils } from './mobile-utils.js';

// Safe localStorage (handles iOS Safari private mode)
const success = storageUtils.safeLocalStorage.setItem('key', 'value');
if (!success) {
  console.log('Storage not available');
}

const value = storageUtils.safeLocalStorage.getItem('key');
```

### Network Awareness

```javascript
import { networkUtils } from './mobile-utils.js';

// Check connection quality
if (networkUtils.isSlowConnection()) {
  // Disable animations, reduce image quality
  document.body.classList.add('slow-connection');
}

// Get detailed connection info
const connection = networkUtils.getConnectionInfo();
if (connection) {
  console.log('Connection:', connection.effectiveType); // '4g', '3g', etc.
}

// Preload resources on fast connections only
if (!networkUtils.isSlowConnection()) {
  networkUtils.preloadResources([
    { href: '/api/data', as: 'fetch' },
    { href: '/images/hero.jpg', as: 'image' }
  ]);
}
```

## Component Examples

### Mobile-Optimized Header

```html
<header class="mobile-header">
  <button class="mobile-header-back" onclick="history.back()">
    ← Back
  </button>
  <h1 class="mobile-header-title">Settings</h1>
  <button class="mobile-header-action" onclick="save()">
    Save
  </button>
</header>
```

### Mobile Card Layout

```html
<div class="mobile-card mobile-fade-in">
  <h2 class="mobile-text-xl mobile-font-bold mobile-space-y-sm">
    Profile Settings
  </h2>
  <p class="mobile-text-base mobile-text-secondary mobile-space-y-md">
    Update your account information and preferences.
  </p>
  
  <form class="mobile-space-y-lg">
    <input 
      type="text" 
      placeholder="Full Name" 
      class="form-control-touch mobile-w-full"
    >
    <input 
      type="email" 
      placeholder="Email Address" 
      class="form-control-touch mobile-w-full"
    >
    <button 
      type="submit" 
      class="btn-touch mobile-bg-primary mobile-text-white mobile-w-full"
    >
      Update Profile
    </button>
  </form>
</div>
```

### Mobile List Interface

```html
<div class="mobile-list">
  <div class="mobile-list-item" onclick="navigate('/notifications')">
    <div class="mobile-flex mobile-items-center">
      <span class="mobile-text-lg mobile-space-x-md">🔔</span>
      <div>
        <div class="mobile-font-medium">Notifications</div>
        <div class="mobile-text-sm mobile-text-secondary">Push, email, and SMS</div>
      </div>
    </div>
    <span class="mobile-text-secondary">›</span>
  </div>
  
  <div class="mobile-list-item" onclick="navigate('/privacy')">
    <div class="mobile-flex mobile-items-center">
      <span class="mobile-text-lg mobile-space-x-md">🔒</span>
      <div>
        <div class="mobile-font-medium">Privacy</div>
        <div class="mobile-text-sm mobile-text-secondary">Data and security settings</div>
      </div>
    </div>
    <span class="mobile-text-secondary">›</span>
  </div>
</div>
```

### Mobile Bottom Navigation

```html
<nav class="mobile-nav">
  <a href="#home" class="mobile-nav-item active">
    <span class="mobile-nav-icon">🏠</span>
    <span class="mobile-nav-label">Home</span>
  </a>
  <a href="#search" class="mobile-nav-item">
    <span class="mobile-nav-icon">🔍</span>
    <span class="mobile-nav-label">Search</span>
  </a>
  <a href="#favorites" class="mobile-nav-item">
    <span class="mobile-nav-icon">❤️</span>
    <span class="mobile-nav-label">Favorites</span>
  </a>
  <a href="#profile" class="mobile-nav-item">
    <span class="mobile-nav-icon">👤</span>
    <span class="mobile-nav-label">Profile</span>
  </a>
</nav>
```

## CSS Utility Classes

### Display & Layout

```css
.mobile-block { display: block; }
.mobile-flex { display: flex; }
.mobile-grid { display: grid; }
.mobile-hidden { display: none; }

.mobile-flex-col { flex-direction: column; }
.mobile-items-center { align-items: center; }
.mobile-justify-between { justify-content: space-between; }
```

### Spacing System

```css
.mobile-space-xs { margin: 4px; }
.mobile-space-sm { margin: 8px; }
.mobile-space-md { margin: 16px; }
.mobile-space-lg { margin: 24px; }
.mobile-space-xl { margin: 32px; }

.mobile-space-x-md { margin-left: 16px; margin-right: 16px; }
.mobile-space-y-md { margin-top: 16px; margin-bottom: 16px; }
```

### Typography

```css
.mobile-text-xs { font-size: 12px; }
.mobile-text-sm { font-size: 14px; }
.mobile-text-base { font-size: 16px; }
.mobile-text-lg { font-size: 18px; }
.mobile-text-xl { font-size: 20px; }

.mobile-font-light { font-weight: 300; }
.mobile-font-normal { font-weight: 400; }
.mobile-font-medium { font-weight: 500; }
.mobile-font-semibold { font-weight: 600; }
.mobile-font-bold { font-weight: 700; }
```

### Colors

```css
.mobile-text-primary { color: #4f46e5; }
.mobile-text-secondary { color: #6b7280; }
.mobile-text-success { color: #059669; }
.mobile-text-error { color: #dc2626; }

.mobile-bg-primary { background-color: #4f46e5; }
.mobile-bg-secondary { background-color: #6b7280; }
```

### Responsive Visibility

```css
.hide-mobile { display: none; } /* Hidden on mobile */
.show-mobile { display: block; } /* Shown only on mobile */

@media (min-width: 768px) {
  .hide-mobile { display: block; }
  .show-mobile { display: none; }
}
```

## Performance Optimization

### Animation Control

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Disable animations on slow connections */
.slow-connection * {
  animation: none !important;
  transition: none !important;
}
```

### Image Optimization

```javascript
import { performanceUtils } from './mobile-utils.js';

// Optimize image for mobile
const img = document.querySelector('img');
const optimizedSrc = performanceUtils.optimizeImage(img, 800);
img.src = optimizedSrc;
```

### Event Optimization

```javascript
import { performanceUtils } from './mobile-utils.js';

// Debounced resize handler
const handleResize = performanceUtils.debounce(() => {
  console.log('Resize handled');
}, 250);

window.addEventListener('resize', handleResize);

// Throttled scroll handler
const handleScroll = performanceUtils.throttle(() => {
  console.log('Scroll handled');
}, 100);

window.addEventListener('scroll', handleScroll);
```

## Dark Mode Support

The framework automatically detects system dark mode preference:

```css
@media (prefers-color-scheme: dark) {
  .mobile-card {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .mobile-header {
    background: #111827;
  }
  
  .form-control-touch {
    background: #374151;
    color: #f9fafb;
  }
}
```

## Accessibility Features

### High Contrast Support

```css
@media (prefers-contrast: high) {
  .mobile-card {
    border: 2px solid #000000;
  }
  
  .form-control-touch {
    border: 3px solid #000000;
  }
}
```

### Focus Indicators

```css
.mobile-focus:focus {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Screen Reader Support

```html
<!-- Add appropriate ARIA labels -->
<button class="mobile-header-back" aria-label="Go back to previous page">
  ←
</button>

<nav class="mobile-nav" aria-label="Main navigation">
  <a href="#home" class="mobile-nav-item" aria-current="page">
    <span class="mobile-nav-icon" aria-hidden="true">🏠</span>
    <span class="mobile-nav-label">Home</span>
  </a>
</nav>
```

## Integration with Projects

### React Integration

```jsx
import { useEffect } from 'react';
import { initializeMobile, viewportUtils, deviceUtils } from './mobile-utils.js';
import './mobile-base.css';

function App() {
  useEffect(() => {
    initializeMobile();
    
    // Add device-specific classes to body
    if (deviceUtils.isIOS()) {
      document.body.classList.add('ios-device');
    }
  }, []);

  return (
    <div className="mobile-viewport mobile-safe-area">
      <YourAppContent />
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div class="mobile-viewport mobile-safe-area">
    <YourAppContent />
  </div>
</template>

<script>
import { initializeMobile } from './mobile-utils.js';
import './mobile-base.css';

export default {
  mounted() {
    initializeMobile();
  }
}
</script>
```

### Angular Integration

```typescript
import { Component, OnInit } from '@angular/core';
import { initializeMobile } from './mobile-utils.js';

@Component({
  selector: 'app-root',
  template: `
    <div class="mobile-viewport mobile-safe-area">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./mobile-base.css']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    initializeMobile();
  }
}
```

## Testing

### Mobile Testing Checklist

- [ ] Touch targets are 44px+ minimum
- [ ] Forms don't zoom on iOS when focused
- [ ] Safe area insets are respected
- [ ] Virtual keyboard doesn't break layout
- [ ] Swipe gestures work correctly
- [ ] Dark mode displays correctly
- [ ] High contrast mode is supported
- [ ] Reduced motion preference is respected
- [ ] Works in iOS Safari private mode
- [ ] Performance is acceptable on slow connections

### Browser Testing

- iOS Safari (current and previous version)
- Android Chrome (current version)
- Samsung Internet (if targeting Android)
- PWA/WebView mode (if applicable)

## Troubleshooting

### Common Issues

**iOS Safari 100vh Issue**:
```css
/* Use dynamic viewport height */
.full-height {
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport */
}
```

**Virtual Keyboard Layout Issues**:
```javascript
// Handle virtual keyboard automatically
formUtils.handleVirtualKeyboard(({ isOpen, height }) => {
  document.body.style.paddingBottom = isOpen ? height + 'px' : '';
});
```

**Touch Events Not Working**:
```javascript
// Ensure passive event listeners
element.addEventListener('touchstart', handler, { passive: true });
```

**Storage Blocked on iOS Safari**:
```javascript
// Use safe storage utilities
import { storageUtils } from './mobile-utils.js';
const success = storageUtils.safeLocalStorage.setItem('key', 'value');
```

## Performance Tips

1. **Use CSS transforms for animations** (hardware accelerated)
2. **Debounce resize and scroll events**
3. **Optimize images for mobile screen sizes**
4. **Use passive event listeners for touch events**
5. **Minimize DOM manipulations during scrolling**
6. **Use requestAnimationFrame for smooth animations**
7. **Preload critical resources on fast connections only**

## Migration Guide

### From Bootstrap/Other Frameworks

1. Replace Bootstrap grid with mobile-first container system
2. Update button classes to use touch-friendly variants
3. Replace modal dialogs with mobile-optimized cards
4. Update form controls to prevent iOS zoom
5. Add safe area support for notched devices

### From Custom Mobile CSS

1. Audit existing breakpoints and consolidate
2. Update touch targets to meet 44px minimum
3. Add safe area inset support
4. Implement dark mode support
5. Add performance optimizations

## Browser Support

- **iOS Safari**: 12+
- **Android Chrome**: 80+
- **Samsung Internet**: 12+
- **Firefox Mobile**: 80+
- **Desktop browsers**: All modern browsers as fallback

## Contributing

When contributing to the mobile design system:

1. Test on real devices, not just browser dev tools
2. Verify safe area handling on notched devices
3. Test with slow network connections
4. Validate accessibility with screen readers
5. Check dark mode appearance
6. Document any new utilities or patterns

## License

This mobile design system is part of the unified project architecture and follows the same license as the parent projects.