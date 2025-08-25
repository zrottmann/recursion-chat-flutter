import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Map loading states
const MAP_STATES = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
  FALLBACK: 'fallback'
};

// Leaflet icon configuration
const setupLeafletIcons = () => {
  try {
    // Dynamic import to handle bundling
    return import('leaflet').then((L) => {
      const leaflet = L.default || L;
      
      // Fix default markers
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      
      return leaflet;
    });
  } catch (error) {
    console.warn('Failed to setup Leaflet icons:', error);
    return null;
  }
};

// React Leaflet components loader
const loadReactLeafletComponents = async () => {
  try {
    const reactLeaflet = await import('react-leaflet');
    return {
      MapContainer: reactLeaflet.MapContainer,
      TileLayer: reactLeaflet.TileLayer,
      Marker: reactLeaflet.Marker,
      Popup: reactLeaflet.Popup,
      Circle: reactLeaflet.Circle
    };
  } catch (error) {
    console.error('Failed to load React Leaflet components:', error);
    throw error;
  }
};

const MapWrapper = ({ 
  center = [40.7128, -74.0060], 
  zoom = 11, 
  style = { height: '400px', width: '100%' },
  className = '',
  children,
  onMapReady,
  ...mapProps 
}) => {
  const [mapState, setMapState] = useState(MAP_STATES.LOADING);
  const [error, setError] = useState(null);
  const [leafletLib, setLeafletLib] = useState(null);
  const [reactLeafletComponents, setReactLeafletComponents] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const mapRef = useRef(null);
  const maxRetries = 3;

  // Memoize center to prevent unnecessary re-renders
  const mapCenter = useMemo(() => {
    if (Array.isArray(center) && center.length === 2 && 
        typeof center[0] === 'number' && typeof center[1] === 'number') {
      return center;
    }
    console.warn('Invalid map center provided, using default');
    return [40.7128, -74.0060];
  }, [center]);

  // Initialize map libraries
  useEffect(() => {
    let isMounted = true;
    
    const initializeMap = async () => {
      try {
        setMapState(MAP_STATES.LOADING);
        setError(null);
        
        console.log('🗺️ Initializing map libraries...');
        
        // Load Leaflet first
        const leaflet = await setupLeafletIcons();
        if (!isMounted) return;
        
        if (!leaflet) {
          throw new Error('Failed to load Leaflet library');
        }
        
        setLeafletLib(leaflet);
        console.log('✅ Leaflet loaded successfully');
        
        // Load React Leaflet components
        const components = await loadReactLeafletComponents();
        if (!isMounted) return;
        
        setReactLeafletComponents(components);
        console.log('✅ React Leaflet components loaded successfully');
        
        // Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (isMounted) {
          setMapState(MAP_STATES.READY);
          console.log('🗺️ Map loaded successfully');
          
          if (onMapReady) {
            onMapReady();
          }
        }
      } catch (err) {
        console.error('❌ Map initialization failed:', err);
        if (isMounted) {
          setError(err.message);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying map initialization... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1));
          } else {
            setMapState(MAP_STATES.ERROR);
          }
        }
      }
    };

    initializeMap();
    
    return () => {
      isMounted = false;
    };
  }, [retryCount, onMapReady, maxRetries]);

  // Retry function
  const handleRetry = () => {
    setRetryCount(0);
    setMapState(MAP_STATES.LOADING);
    setError(null);
  };

  // Use fallback function
  const useFallback = () => {
    setMapState(MAP_STATES.FALLBACK);
  };

  // Loading state
  if (mapState === MAP_STATES.LOADING) {
    return (
      <div 
        className={`d-flex flex-column justify-content-center align-items-center border rounded ${className}`} 
        style={style}
      >
        <Spinner animation="border" variant="primary" className="mb-3" />
        <div className="text-center">
          <h6 className="mb-1">Loading Interactive Map...</h6>
          <small className="text-muted">
            {retryCount > 0 && `Retry attempt ${retryCount}/${maxRetries}`}
          </small>
        </div>
      </div>
    );
  }

  // Error state
  if (mapState === MAP_STATES.ERROR) {
    return (
      <Alert variant="warning" className={className} style={style}>
        <Alert.Heading>Map Unavailable</Alert.Heading>
        <p>We're having trouble loading the interactive map component.</p>
        {error && (
          <div className="alert alert-light mb-3">
            <small className="text-muted">Technical details: {error}</small>
          </div>
        )}
        <div className="d-flex gap-2">
          <Button variant="outline-warning" size="sm" onClick={handleRetry}>
            🔄 Try Again
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={useFallback}>
            📍 Use Simple View
          </Button>
        </div>
      </Alert>
    );
  }

  // Fallback state - simple location display
  if (mapState === MAP_STATES.FALLBACK) {
    return (
      <div 
        className={`d-flex flex-column justify-content-center align-items-center border rounded bg-light ${className}`} 
        style={style}
      >
        <div className="text-center p-4">
          <h5 className="mb-3">📍 Location Information</h5>
          <p className="mb-2">
            <strong>Latitude:</strong> {mapCenter[0].toFixed(4)}<br/>
            <strong>Longitude:</strong> {mapCenter[1].toFixed(4)}
          </p>
          <small className="text-muted d-block mb-3">
            Interactive map is not available, but location coordinates are shown above.
          </small>
          <Button variant="outline-primary" size="sm" onClick={handleRetry}>
            🗺️ Try Loading Interactive Map
          </Button>
        </div>
      </div>
    );
  }

  // Success state - render the actual map
  if (mapState === MAP_STATES.READY && reactLeafletComponents) {
    const { MapContainer, TileLayer, Marker, Popup, Circle } = reactLeafletComponents;
    
    return (
      <div className={`map-wrapper ${className}`} style={{ position: 'relative' }}>
        <MapContainer
          ref={mapRef}
          center={mapCenter}
          zoom={zoom}
          style={style}
          className="map-container"
          {...mapProps}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+TWFwIFRpbGUgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+"
          />
          {children}
        </MapContainer>
      </div>
    );
  }

  // Default fallback if something went wrong
  return (
    <div 
      className={`d-flex justify-content-center align-items-center border rounded ${className}`} 
      style={style}
    >
      <div className="text-center text-muted">
        <p>Map component is loading...</p>
      </div>
    </div>
  );
};

export default MapWrapper;

// Export safe components for backward compatibility
export const SafeMarker = React.forwardRef((props, ref) => {
  const [ReactLeafletMarker, setReactLeafletMarker] = useState(null);
  
  useEffect(() => {
    import('react-leaflet').then(module => {
      setReactLeafletMarker(() => module.Marker);
    }).catch(console.error);
  }, []);
  
  if (!ReactLeafletMarker) return null;
  
  return React.createElement(ReactLeafletMarker, { ...props, ref });
});

export const SafePopup = React.forwardRef((props, ref) => {
  const [ReactLeafletPopup, setReactLeafletPopup] = useState(null);
  
  useEffect(() => {
    import('react-leaflet').then(module => {
      setReactLeafletPopup(() => module.Popup);
    }).catch(console.error);
  }, []);
  
  if (!ReactLeafletPopup) return null;
  
  return React.createElement(ReactLeafletPopup, { ...props, ref });
});

export const SafeCircle = React.forwardRef((props, ref) => {
  const [ReactLeafletCircle, setReactLeafletCircle] = useState(null);
  
  useEffect(() => {
    import('react-leaflet').then(module => {
      setReactLeafletCircle(() => module.Circle);
    }).catch(console.error);
  }, []);
  
  if (!ReactLeafletCircle) return null;
  
  return React.createElement(ReactLeafletCircle, { ...props, ref });
});