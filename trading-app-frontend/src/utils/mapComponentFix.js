/**
 * Map Component Fix
 * Resolves "m is not a function" errors in Leaflet/React-Leaflet components
 * Provides safe imports and fallback handling
 */

import { useEffect, useRef } from 'react';

// Safe import function for react-leaflet components
export const safeMapImport = async () => {
  try {
    console.log('🗺️ [MAP-FIX] Attempting to import react-leaflet...');
    
    const leafletModule = await import('leaflet');
    const reactLeafletModule = await import('react-leaflet');
    
    console.log('✅ [MAP-FIX] Leaflet modules imported successfully:', {
      leaflet: !!leafletModule.default,
      MapContainer: typeof reactLeafletModule.MapContainer,
      useMap: typeof reactLeafletModule.useMap,
      TileLayer: typeof reactLeafletModule.TileLayer,
      Marker: typeof reactLeafletModule.Marker,
      Popup: typeof reactLeafletModule.Popup,
      Circle: typeof reactLeafletModule.Circle
    });

    // Verify all required components are functions
    const requiredComponents = ['MapContainer', 'TileLayer', 'Marker', 'Popup', 'Circle', 'useMap'];
    const missingComponents = requiredComponents.filter(comp => typeof reactLeafletModule[comp] !== 'function');
    
    if (missingComponents.length > 0) {
      throw new Error(`Missing react-leaflet components: ${missingComponents.join(', ')}`);
    }

    return {
      leaflet: leafletModule.default,
      ...reactLeafletModule
    };
  } catch (error) {
    console.error('❌ [MAP-FIX] Failed to import map components:', error);
    throw new Error(`Map components failed to load: ${error.message}`);
  }
};

// Safe useMap hook with fallback
export const useSafeMap = () => {
  const mapRef = useRef(null);
  
  useEffect(() => {
    // Try to get the map instance from window if available
    if (window.leafletMap) {
      mapRef.current = window.leafletMap;
    }
  }, []);
  
  try {
    // Import useMap dynamically to avoid import-time errors
    const { useMap } = require('react-leaflet');
    if (typeof useMap === 'function') {
      const map = useMap();
      if (map) {
        mapRef.current = map;
        return map;
      }
    }
  } catch (error) {
    console.warn('⚠️ [MAP-FIX] useMap hook failed, using fallback:', error.message);
  }
  
  return mapRef.current;
};

// Safe map updater component that doesn't rely on hooks
export const SafeMapUpdater = ({ center, zoom, onMapReady }) => {
  const mapRef = useRef(null);
  
  useEffect(() => {
    // Try multiple methods to get the map instance
    const tryGetMap = () => {
      // Method 1: Try the useMap hook
      try {
        const { useMap } = require('react-leaflet');
        if (typeof useMap === 'function') {
          const map = useMap();
          if (map) {
            mapRef.current = map;
            updateMapView(map);
            if (onMapReady) onMapReady(map);
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ [MAP-FIX] useMap failed:', error.message);
      }
      
      // Method 2: Look for Leaflet map in DOM
      try {
        const mapContainer = document.querySelector('.leaflet-container');
        if (mapContainer && mapContainer._leaflet_id) {
          const L = require('leaflet');
          const map = mapContainer[L.Util.stamp(mapContainer)];
          if (map) {
            mapRef.current = map;
            updateMapView(map);
            if (onMapReady) onMapReady(map);
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ [MAP-FIX] DOM map lookup failed:', error.message);
      }
      
      // Method 3: Global window fallback
      if (window.leafletMap) {
        mapRef.current = window.leafletMap;
        updateMapView(window.leafletMap);
        if (onMapReady) onMapReady(window.leafletMap);
      }
    };
    
    const updateMapView = (map) => {
      if (!map || !center || !Array.isArray(center) || center.length !== 2) {
        console.warn('⚠️ [MAP-FIX] Invalid map or center for update:', { map: !!map, center });
        return;
      }
      
      try {
        console.log('📍 [MAP-FIX] Updating map view to:', center, 'zoom:', zoom);
        map.setView(center, zoom || map.getZoom());
        console.log('✅ [MAP-FIX] Map view updated successfully');
      } catch (error) {
        console.error('❌ [MAP-FIX] Error updating map view:', error);
      }
    };
    
    // Try immediately
    tryGetMap();
    
    // Retry after a short delay in case components aren't ready
    const retryTimer = setTimeout(tryGetMap, 100);
    
    return () => {
      clearTimeout(retryTimer);
    };
  }, [center, zoom, onMapReady]);
  
  return null;
};

// Map initialization helper
export const initializeMapSafely = (containerId, center, zoom) => {
  return new Promise((resolve, reject) => {
    try {
      const L = require('leaflet');
      
      // Clean up any existing map
      const container = document.getElementById(containerId);
      if (container && container._leaflet_id) {
        container._leaflet_id = null;
        container.innerHTML = '';
      }
      
      // Create new map
      const map = L.map(containerId).setView(center, zoom);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      
      // Store map globally for fallback access
      window.leafletMap = map;
      
      console.log('✅ [MAP-FIX] Map initialized successfully');
      resolve(map);
    } catch (error) {
      console.error('❌ [MAP-FIX] Map initialization failed:', error);
      reject(error);
    }
  });
};

// Component error boundary for map-specific errors
export class MapComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    console.error('🗺️ [MAP-FIX] Map component error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🗺️ [MAP-FIX] Map component error details:', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
    
    // Report specific "m is not a function" errors
    if (error.message && error.message.includes('is not a function')) {
      console.error('🚨 [MAP-FIX] Function call error detected - likely import issue:', {
        message: error.message,
        possibleCause: 'React-Leaflet component import failed or component not ready',
        suggestion: 'Check network connectivity and react-leaflet version compatibility'
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-warning m-3">
          <h5>🗺️ Map Unavailable</h5>
          <p>The interactive map could not be loaded. This may be due to:</p>
          <ul>
            <li>Network connectivity issues</li>
            <li>Component loading problems</li>
            <li>Browser compatibility issues</li>
          </ul>
          {this.props.fallback ? (
            this.props.fallback
          ) : (
            <button 
              className="btn btn-outline-warning btn-sm"
              onClick={() => window.location.reload()}
            >
              🔄 Reload Page
            </button>
          )}
          <details className="mt-2">
            <summary className="text-muted">Technical Details</summary>
            <small className="text-muted">
              Error: {this.state.error?.message || 'Unknown error'}
            </small>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default {
  safeMapImport,
  useSafeMap,
  SafeMapUpdater,
  initializeMapSafely,
  MapComponentErrorBoundary
};