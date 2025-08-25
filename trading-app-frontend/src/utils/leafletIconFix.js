// DEPRECATED: This file is kept for backward compatibility only
// New map components should use MapWrapper.jsx instead

console.warn('⚠️ leafletIconFix.js is deprecated. Use MapWrapper.jsx for new map components.');

// Minimal export to prevent breaking changes
export const defaultIcon = null;
export const createCustomIcon = () => null;

// Legacy function - no-op to prevent errors
export const initLeafletIcons = () => {
  console.log('📍 Legacy leaflet icon initialization (deprecated)');
};