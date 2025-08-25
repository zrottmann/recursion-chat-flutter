import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Badge, Alert } from 'react-bootstrap';
import { searchListings } from '../store/slices/listingsSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getCachedCityFromCoordinates, formatLocationDisplay } from '../utils/geocoding';
import MapWrapper, { SafeMarker, SafePopup, SafeCircle } from './MapWrapper';
import './SearchControls.css';

// MapWrapper now handles all error boundaries and fallbacks internally


// Component to display location with city and distance
const LocationDisplay = ({ listing, cityCache, setCityCache }) => {
  const [locationText, setLocationText] = useState('Calculating...');
  
  useEffect(() => {
    const getLocationText = async () => {
      try {
        // Defensive checks for listing structure
        if (!listing) {
          setLocationText('Unknown location');
          return;
        }
        
        // Check if distance is available
        if (typeof listing.distance === 'number' && listing.distance >= 0) {
          const defaultDistance = `${(listing.distance * 0.621371).toFixed(1)}mi`;
          
          // Check if user location data is available
          if (!listing.user?.latitude || !listing.user?.longitude) {
            setLocationText(defaultDistance);
            return;
          }
          
          const key = `${listing.user.latitude.toFixed(3)},${listing.user.longitude.toFixed(3)}`;
          
          if (cityCache.has(key)) {
            const city = cityCache.get(key);
            setLocationText(formatLocationDisplay(listing.distance, city));
            return;
          }
          
          try {
            const city = await getCachedCityFromCoordinates(listing.user.latitude, listing.user.longitude);
            setCityCache(prev => new Map(prev).set(key, city));
            setLocationText(formatLocationDisplay(listing.distance, city));
          } catch (cityError) {
            console.warn('Error getting city name, using distance only:', cityError);
            setLocationText(defaultDistance);
          }
        } else {
          // No distance available
          setLocationText('Location unknown');
        }
      } catch (error) {
        console.error('Error in LocationDisplay:', error);
        setLocationText('Location error');
      }
    };
    
    getLocationText();
  }, [listing, cityCache, setCityCache]);
  
  return <span>{locationText}</span>;
};

const SearchControls = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchResults, loading } = useSelector(state => state.listings);
  const { currentUser } = useSelector(state => state.user);
  
  // Add error state for component-level error handling
  const [componentError, setComponentError] = useState(null);
  
  // Component error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('💥 SearchControls component error:', error);
      setComponentError(error.message || 'An unexpected error occurred');
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      handleError(new Error(event.reason));
    });
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);
  
  // If there's a component error, show error message
  if (componentError) {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Card>
              <Card.Body className="text-center">
                <h5 className="text-danger">⚠️ Something went wrong</h5>
                <p className="text-muted mb-3">
                  We encountered an unexpected error with the map search functionality.
                </p>
                <div className="alert alert-light">
                  <small className="text-muted">Error: {componentError}</small>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setComponentError(null);
                    window.location.reload();
                  }}
                >
                  🔄 Refresh Page
                </Button>
                <Button 
                  variant="outline-secondary" 
                  className="ms-2"
                  onClick={() => navigate('/')}
                >
                  🏠 Go to Marketplace
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  
  const [radius, setRadius] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default NYC
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [zipcode, setZipcode] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [cityCache, setCityCache] = useState(new Map());
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('unknown');

  useEffect(() => {
    // Only set initial location if user hasn't selected a location yet
    if (currentUser?.latitude && currentUser?.longitude && !userLocation) {
      setMapCenter([currentUser.latitude, currentUser.longitude]);
      setUserLocation([currentUser.latitude, currentUser.longitude]);
    }
    
    // Check location permission status on mount
    checkLocationPermission();
  }, [currentUser, userLocation]);

  const checkLocationPermission = async () => {
    if (!navigator.permissions || !navigator.geolocation) {
      setLocationPermissionStatus('unsupported');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermissionStatus(permission.state);
      
      // Listen for permission changes
      permission.onchange = () => {
        setLocationPermissionStatus(permission.state);
      };
    } catch (error) {
      console.log('Permission API not supported:', error);
      setLocationPermissionStatus('unknown');
    }
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Show loading state
    setGettingLocation(true);
    toast.info('Getting your current location...', { autoClose: 2000 });
    
    // Check if we're on HTTPS or localhost (required for geolocation)
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      setLocationError('Location access requires HTTPS. Try accessing the site with https://');
      setGettingLocation(false);
      toast.error('Location access requires HTTPS');
      return;
    }
    
    // Try to get current position with improved settings
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('📍 Got location:', { latitude, longitude, accuracy: `${accuracy}m` });
        
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setLocationError(null);
        setGettingLocation(false);
        
        // Show success message with accuracy info
        toast.success(
          `Location updated! Accuracy: ${accuracy < 100 ? 'High' : accuracy < 500 ? 'Medium' : 'Low'} (${Math.round(accuracy)}m)`,
          { autoClose: 3000 }
        );
        
        // Automatically trigger a search with the new location
        dispatch(searchListings({
          radius,
          query: searchQuery,
          latitude: latitude,
          longitude: longitude,
        }));
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location.';
        let suggestions = '';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied.';
            suggestions = 'Please check your browser settings and allow location access for this site.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            suggestions = 'Please check your GPS/location services are enabled.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            suggestions = 'Please try again or check your internet connection.';
            break;
          default:
            suggestions = 'Please try again or enter your zipcode manually.';
        }
        
        setLocationError(`${errorMessage} ${suggestions}`);
        setGettingLocation(false);
        toast.error(errorMessage, { autoClose: 5000 });
        
        // Fall back to user's registered location if available
        if (currentUser?.latitude && currentUser?.longitude) {
          setTimeout(() => {
            setUserLocation([currentUser.latitude, currentUser.longitude]);
            setMapCenter([currentUser.latitude, currentUser.longitude]);
            toast.info('Using your registered address instead.', { autoClose: 3000 });
          }, 1000);
        }
      },
      {
        enableHighAccuracy: false, // Start with less accurate but faster
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 300000 // Allow cached location up to 5 minutes old
      }
    );
    
    // If high accuracy fails, try again with high accuracy after 3 seconds
    setTimeout(() => {
      if (gettingLocation) {
        console.log('Trying high accuracy location...');
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            console.log('📍 Got high accuracy location:', { latitude, longitude, accuracy: `${accuracy}m` });
            
            // Only update if we haven't already got a location or this is more accurate
            if (!userLocation || accuracy < 100) {
              setUserLocation([latitude, longitude]);
              setMapCenter([latitude, longitude]);
              setLocationError(null);
              toast.success(`High accuracy location updated! (±${Math.round(accuracy)}m)`, { autoClose: 3000 });
            }
          },
          (error) => {
            console.log('High accuracy location failed, using previous result');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      }
    }, 3000);
  };

  const handleSearch = () => {
    dispatch(searchListings({
      radius,
      query: searchQuery,
      latitude: userLocation ? userLocation[0] : currentUser?.latitude,
      longitude: userLocation ? userLocation[1] : currentUser?.longitude,
    }));
    toast.info(`Searching for listings within ${radius} miles...`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleZipcodeUpdate = () => {
    // Simple zipcode to coordinates mapping
    const zipcodeCoords = {
      "21042": [39.2904, -76.8734],  // Columbia, MD
      "10001": [40.7506, -73.9971],  // New York, NY
      "90210": [34.1031, -118.4105], // Beverly Hills, CA
      "60601": [41.8856, -87.6228],  // Chicago, IL
      "33101": [25.7781, -80.1874],  // Miami, FL
    };
    
    const coords = zipcodeCoords[zipcode];
    if (coords) {
      setUserLocation(coords);
      setMapCenter(coords);
      setLocationError(null);
      toast.success(`Location updated to zipcode ${zipcode}`);
    } else {
      // For now, default to a location if zipcode not in our mapping
      const defaultCoords = [39.2904, -76.8734];
      setUserLocation(defaultCoords);
      setMapCenter(defaultCoords);
      toast.info(`Using default location for zipcode ${zipcode}`);
    }
  };

  const handleRadiusChange = (e) => {
    setRadius(parseInt(e.target.value));
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={3}>
          <Card>
            <Card.Body>
              <h5>Search Filters</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  Radius: <strong>{radius} miles</strong>
                </Form.Label>
                <Form.Range
                  min="1"
                  max="50"
                  value={radius}
                  onChange={handleRadiusChange}
                />
                <Form.Text className="text-muted">
                  Search radius from your location
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Form.Text className="text-muted">
                  Search by item name, description, or category
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Update Location</Form.Label>
                {userLocation && (
                  <div className="alert alert-info py-1 px-2 mb-2">
                    <small>📍 Current: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</small>
                  </div>
                )}
                <div className="d-flex gap-2 mb-2">
                  <Button
                    variant={locationPermissionStatus === 'denied' ? 'outline-warning' : 'outline-secondary'}
                    size="sm"
                    onClick={requestUserLocation}
                    className="flex-fill"
                    disabled={gettingLocation || locationPermissionStatus === 'unsupported'}
                    title={
                      locationPermissionStatus === 'denied' 
                        ? 'Location permission denied - click to try again' 
                        : locationPermissionStatus === 'granted' 
                        ? 'Location permission granted' 
                        : locationPermissionStatus === 'unsupported'
                        ? 'Geolocation not supported by your browser'
                        : 'Get your current location'
                    }
                  >
                    {gettingLocation ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Getting Location...
                      </>
                    ) : (
                      <>
                        📍 Use Current Location
                        {locationPermissionStatus === 'denied' && ' ⚠️'}
                        {locationPermissionStatus === 'granted' && ' ✅'}
                        {locationPermissionStatus === 'unsupported' && ' ❌'}
                      </>
                    )}
                  </Button>
                </div>
                {locationPermissionStatus === 'denied' && (
                  <div className="alert alert-warning py-2 px-3 mb-2">
                    <small>
                      <strong>Location Blocked:</strong> Please enable location access in your browser settings, 
                      then refresh the page and try again.
                    </small>
                  </div>
                )}
                {locationPermissionStatus === 'unsupported' && (
                  <div className="alert alert-info py-2 px-3 mb-2">
                    <small>
                      <strong>Location Unavailable:</strong> Your browser doesn't support location services. 
                      Please enter your zipcode below.
                    </small>
                  </div>
                )}
                <Form.Control
                  type="text"
                  placeholder="Or enter zipcode"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleZipcodeUpdate();
                    }
                  }}
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleZipcodeUpdate}
                  className="w-100 mt-2"
                  disabled={!zipcode}
                >
                  Update by Zipcode
                </Button>
                {locationError && (
                  <Form.Text className="text-warning d-block mt-2">
                    {locationError}
                  </Form.Text>
                )}
              </Form.Group>

              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={loading}
                className="w-100"
              >
                {loading ? 'Searching...' : 'Search Listings'}
              </Button>

              {searchResults.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted">
                    Found {searchResults.length} listings
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h6>Nearby Listings</h6>
              {searchResults.slice(0, 5).map(listing => (
                <div 
                  key={(listing.$id || listing.id)} 
                  className="mb-2 p-2 border-bottom listing-item"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => navigate(`/listings/${(listing.$id || listing.id)}`)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong 
                        className="text-primary" 
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (listing.user?.id) {
                            navigate(`/users/${listing.user.id}`);
                          }
                        }}
                      >
                        {listing.title}
                      </strong>
                      <br />
                      <small 
                        className="text-muted text-primary" 
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (listing.user?.id) {
                            navigate(`/users/${listing.user.id}`);
                          }
                        }}
                      >
                        {listing.user?.username || 'Unknown User'}
                      </small>
                    </div>
                    <Badge bg="secondary">
                      <LocationDisplay 
                        listing={listing} 
                        cityCache={cityCache} 
                        setCityCache={setCityCache} 
                      />
                    </Badge>
                  </div>
                  <small>{listing.category}</small>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          <Card className="map-container">
            <Card.Body className="p-0">
              <MapWrapper
                center={mapCenter}
                zoom={11}
                style={{ height: '400px', width: '100%' }}
                className="map-view"
                key={`${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when center changes
                onMapReady={() => console.log('🗺️ Map loaded successfully')}
              >
                {userLocation && (
                  <>
                    <SafeMarker position={userLocation}>
                      <SafePopup>
                        <strong>Your Location</strong>
                        {locationError && <br />}
                        {locationError && <small className="text-muted">Using registered address</small>}
                      </SafePopup>
                    </SafeMarker>
                    <SafeCircle
                      center={userLocation}
                      radius={radius * 1609.34}  // Convert miles to meters (1 mile = 1609.34 meters)
                      fillColor="blue"
                      fillOpacity={0.1}
                      color="blue"
                    />
                  </>
                )}
                
                {searchResults.map(listing => {
                  // Skip listings without valid user location data
                  if (!listing.user?.latitude || !listing.user?.longitude) {
                    return null;
                  }
                  
                  return (
                    <SafeMarker
                      key={(listing.$id || listing.id)}
                      position={[listing.user.latitude, listing.user.longitude]}
                    >
                      <SafePopup>
                        <strong
                          style={{ cursor: 'pointer' }}
                          onClick={() => listing.user?.id && navigate(`/users/${listing.user.id}`)}
                        >
                          {listing.title}
                        </strong>
                        <br />
                        {listing.category}
                        <br />
                        <small>By: 
                          <span 
                            className="text-primary" 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (listing.user?.id) {
                                navigate(`/users/${listing.user.id}`);
                              }
                            }}
                          >
                            {listing.user?.username || 'Unknown User'}
                          </span>
                        </small>
                        <br />
                        <small>
                          <LocationDisplay 
                            listing={listing} 
                            cityCache={cityCache} 
                            setCityCache={setCityCache} 
                          /> away
                        </small>
                        <br />
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => navigate(`/listings/${(listing.$id || listing.id)}`)}
                        >
                          View Listing
                        </Button>
                      </SafePopup>
                    </SafeMarker>
                  );
                })}
              </MapWrapper>
            </Card.Body>
          </Card>
          
          {searchResults.length > 0 && (
            <Card className="mt-3">
              <Card.Body>
                <h5>All Search Results ({searchResults.length} items)</h5>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <Row>
                    {searchResults.map(listing => (
                      <Col key={(listing.$id || listing.id)} xs={12} sm={6} md={4} className="mb-3">
                        <Card 
                          className="h-100 listing-card"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/listings/${(listing.$id || listing.id)}`)}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <Card.Body>
                            <h6 
                              className="text-primary" 
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/users/${listing.user.id}`);
                              }}
                            >
                              {listing.title}
                            </h6>
                            <p className="small mb-1">{listing.category}</p>
                            <p className="small text-muted mb-2">By: 
                              <span 
                                className="text-primary" 
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/users/${listing.user.id}`);
                                }}
                              >
                                {listing.user.username}
                              </span>
                            </p>
                            <div className="d-flex justify-content-between align-items-center">
                              <Badge bg="info">
                                {listing.condition}
                              </Badge>
                              <Badge bg="secondary">
                                <LocationDisplay 
                                  listing={listing} 
                                  cityCache={cityCache} 
                                  setCityCache={setCityCache} 
                                />
                              </Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default SearchControls;