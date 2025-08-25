import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge, Dropdown, Modal, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
import featureService from '../services/featureImplementation';
import { getCachedCityFromCoordinates, formatLocationDisplay } from '../utils/geocoding';
import { getStockPhotoForListing, preloadStockPhotos } from '../services/stockPhotos';
import { handleError } from '../utils/errorHandler';
import './Marketplace.css';

// Enhanced Location Display with more details
const LocationDisplay = ({ listing, cityCache, setCityCache }) => {
  const [locationText, setLocationText] = useState(
    listing.distance ? `${(listing.distance * 0.621371).toFixed(1)}mi` : 'Location unknown'
  );
  
  useEffect(() => {
    const getLocationText = async () => {
      if (!listing.user?.latitude || !listing.user?.longitude) {
        setLocationText('Location unknown');
        return;
      }
      
      const key = `${listing.user.latitude.toFixed(3)},${listing.user.longitude.toFixed(3)}`;
      
      if (cityCache instanceof Map && cityCache.has(key)) {
        const city = cityCache.get(key);
        setLocationText(formatLocationDisplay(listing.distance, city));
        return;
      }
      
      try {
        const city = await getCachedCityFromCoordinates(listing.user.latitude, listing.user.longitude);
        if (typeof setCityCache === 'function') {
          setCityCache(prev => new Map(prev || new Map()).set(key, city));
        }
        setLocationText(formatLocationDisplay(listing.distance, city));
      } catch (error) {
        console.error('Error getting city:', error);
        setLocationText(listing.distance ? `${(listing.distance * 0.621371).toFixed(1)}mi` : 'Location unknown');
      }
    };
    
    getLocationText();
  }, [listing, cityCache, setCityCache]);
  
  return <span className="location-display">{locationText}</span>;
};

// Enhanced Listing Card with more features
const ListingCard = ({ listing, savedItems, onSaveToggle, onViewDetails, cityCache, setCityCache }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const isSaved = savedItems.has(listing.$id || listing.id);
  
  const mainImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : getStockPhotoForListing(listing);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const getConditionBadge = (condition) => {
    const variants = {
      'new': 'success',
      'like_new': 'info', 
      'good': 'primary',
      'fair': 'warning',
      'poor': 'danger'
    };
    return <Badge bg={variants[condition] || 'secondary'}>{condition?.replace('_', ' ')}</Badge>;
  };

  const getListingTypeBadge = (type) => {
    return type === 'service' ? 
      <Badge bg="warning" className="me-2">Service</Badge> : 
      <Badge bg="success" className="me-2">For Sale</Badge>;
  };

  return (
    <Card className="listing-card h-100 shadow-sm hover-shadow">
      <div className="position-relative">
        {imageLoading && (
          <div className="image-placeholder d-flex align-items-center justify-content-center">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        <Card.Img
          variant="top"
          src={imageError ? getStockPhotoForListing(listing) : mainImage}
          alt={listing.title}
          className={`listing-image ${imageLoading ? 'd-none' : ''}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
          onClick={() => onViewDetails(listing.$id || listing.id)}
        />
        
        {/* Save button overlay */}
        <Button
          variant={isSaved ? 'danger' : 'outline-light'}
          size="sm"
          className="position-absolute top-0 end-0 m-2 save-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSaveToggle(listing.$id || listing.id);
          }}
        >
          <i className={`fas fa-heart ${isSaved ? 'text-white' : ''}`}></i>
        </Button>

        {/* Price badge */}
        {listing.price > 0 && (
          <Badge bg="dark" className="position-absolute bottom-0 start-0 m-2 price-badge">
            ${listing.price}
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <div className="mb-2">
          {getListingTypeBadge(listing.listing_type)}
          {listing.condition && getConditionBadge(listing.condition)}
        </div>
        
        <Card.Title className="h6 text-truncate" title={listing.title}>
          {listing.title}
        </Card.Title>
        
        <Card.Text className="text-muted small flex-grow-1 listing-description">
          {listing.description?.substring(0, 100)}
          {listing.description?.length > 100 && '...'}
        </Card.Text>

        <div className="listing-meta">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">
              <i className="fas fa-user me-1"></i>
              {listing.user?.username || 'Unknown'}
            </small>
            <small className="text-muted">
              <i className="fas fa-map-marker-alt me-1"></i>
              <LocationDisplay 
                listing={listing} 
                cityCache={cityCache} 
                setCityCache={setCityCache} 
              />
            </small>
          </div>
          
          {listing.views && (
            <small className="text-muted">
              <i className="fas fa-eye me-1"></i>
              {listing.views} views
            </small>
          )}
        </div>

        <div className="d-grid gap-2 mt-2">
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onViewDetails(listing.$id || listing.id)}
            className="btn-animated"
            title="Click to view details"
          >
            <span className="fw-bold">
              {listing.title}
            </span>
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

// Enhanced Search Filters
const AdvancedFilters = ({ filters, onFiltersChange, onReset }) => {
  return (
    <Card className="mb-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Advanced Filters</h6>
          <Button variant="link" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={filters.category || ''}
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="sports">Sports & Recreation</option>
                <option value="tools">Tools</option>
                <option value="automotive">Automotive</option>
                <option value="services">Services</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Condition</Form.Label>
              <Form.Select
                value={filters.condition || ''}
                onChange={(e) => onFiltersChange({ ...filters, condition: e.target.value })}
              >
                <option value="">Any Condition</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Price Range</Form.Label>
              <Row>
                <Col>
                  <Form.Control
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
                  />
                </Col>
              </Row>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Distance (miles)</Form.Label>
              <Form.Select
                value={filters.radius || '50'}
                onChange={(e) => onFiltersChange({ ...filters, radius: e.target.value })}
              >
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
                <option value="100">Within 100 miles</option>
                <option value="">Anywhere</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

// Main Enhanced Marketplace Component
const EnhancedMarketplace = ({ saved = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useSelector(state => state.user);
  
  // State management
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [savedItems, setSavedItems] = useState(new Set());
  const [cityCache, setCityCache] = useState(new Map());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  
  // Advanced filters
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    radius: searchParams.get('radius') || '50',
    listingType: searchParams.get('type') || 'all'
  });

  // Fetch listings with enhanced search
  const fetchListings = useCallback(async () => {
    console.log('🚀 [MARKETPLACE-DEBUG] fetchListings called');
    console.log('🚀 [MARKETPLACE-DEBUG] Current state - loading:', loading, 'listings count:', listings.length);
    
    setLoading(true);
    console.log('🔄 [MARKETPLACE-DEBUG] Loading state set to true');
    
    try {
      const searchData = {
        query: searchQuery,
        radius: filters.radius || 50,
        category: filters.category,
        condition: filters.condition,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        listingType: filters.listingType === 'all' ? '' : filters.listingType,
        sortBy: sortBy,
        saved: saved
      };
      
      // Add user's coordinates if available
      if (currentUser && currentUser.latitude && currentUser.longitude) {
        searchData.latitude = currentUser.latitude;
        searchData.longitude = currentUser.longitude;
      }
      
      console.log('🔍 [EnhancedMarketplace] Fetching listings with search data:', searchData);
      
      // Use feature service for searching
      const result = await featureService.searchListings({
        query: searchData.query || '',
        category: searchData.category === 'all' ? undefined : searchData.category,
        status: 'active',
        limit: 50
      });
      
      console.log('📊 [MARKETPLACE-DEBUG] Feature service result:', {
        success: result.success,
        listingsLength: result.listings?.length,
        listingsType: typeof result.listings,
        isArray: Array.isArray(result.listings),
        firstItem: result.listings?.[0]
      });
      
      if (result.success) {
        console.log('✅ [EnhancedMarketplace] Listings fetched successfully:', result.listings?.length || 0, 'items');
        console.log('📝 [MARKETPLACE-DEBUG] About to call setListings with:', result.listings);
        
        setListings(result.listings || []);
        
        console.log('✅ [MARKETPLACE-DEBUG] setListings called successfully');
      } else {
        console.log('⚠️ [MARKETPLACE-DEBUG] Feature service failed, trying fallback API');
        
        // Fallback to legacy API
        const response = await api.post('/api/listings/search', searchData);
        console.log('✅ [EnhancedMarketplace] Listings fetched via fallback:', response.data?.length || 0, 'items');
        console.log('📝 [MARKETPLACE-DEBUG] Fallback response data:', response.data);
        
        setListings(Array.isArray(response.data) ? response.data : []);
        console.log('✅ [MARKETPLACE-DEBUG] setListings called with fallback data');
      }
    } catch (error) {
      console.error('❌ [MARKETPLACE-DEBUG] Error in fetchListings:', error);
      console.error('Error fetching listings:', error);
      handleError(error, {
        context: 'EnhancedMarketplace-FetchListings',
        fallbackMessage: 'Failed to load listings'
      });
      setListings([]);
      console.log('🔄 [MARKETPLACE-DEBUG] setListings called with empty array due to error');
    } finally {
      setLoading(false);
      console.log('🏁 [MARKETPLACE-DEBUG] Loading state set to false - fetchListings complete');
    }
  }, [searchQuery, filters, sortBy, saved, currentUser]);

  // Fetch saved items
  const fetchSavedItems = useCallback(async () => {
    try {
      const response = await api.get('/saved-items');
      const items = Array.isArray(response.data) ? response.data : [];
      const savedIds = new Set(items.map(item => item?.$id || item?.id).filter(Boolean));
      setSavedItems(savedIds);
    } catch (error) {
      console.warn('Failed to fetch saved items:', error);
      setSavedItems(new Set());
    }
  }, []);

  // Handle save/unsave items
  const handleSaveToggle = async (itemId) => {
    try {
      if (savedItems.has(itemId)) {
        // Use feature service for unsaving
        const result = await featureService.unsaveItem(itemId);
        if (result.success) {
          setSavedItems(new Set([...savedItems].filter(id => id !== itemId)));
        } else {
          // Fallback to legacy API
          await api.delete(`/api/listings/${itemId}/save`);
          setSavedItems(new Set([...savedItems].filter(id => id !== itemId)));
          toast.success('Item removed from saved');
        }
      } else {
        // Use feature service for saving
        const result = await featureService.saveItem(itemId);
        if (result.success) {
          setSavedItems(new Set([...savedItems, itemId]));
        } else {
          // Fallback to legacy API
          await api.post(`/api/listings/${itemId}/save`);
          setSavedItems(new Set([...savedItems, itemId]));
          toast.success('Item saved');
        }
      }
    } catch (error) {
      handleError(error, {
        context: 'EnhancedMarketplace-SaveToggle',
        fallbackMessage: 'Failed to save item'
      });
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    updateSearchParams();
    fetchListings();
  };

  // Update URL parameters
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.category) params.set('category', filters.category);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.radius) params.set('radius', filters.radius);
    if (filters.listingType !== 'all') params.set('type', filters.listingType);
    
    setSearchParams(params);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      radius: '50',
      listingType: 'all'
    });
    setSearchQuery('');
    setSearchParams({});
  };

  // Handle filters change
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    updateSearchParams();
  };

  // Handle view details
  const handleViewDetails = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  // Sort listings with critical error handling
  const sortedListings = useMemo(() => {
    try {
      console.log('🔄 [MARKETPLACE-DEBUG] sortedListings useMemo called');
      console.log('📊 [MARKETPLACE-DEBUG] Input listings:', {
        count: listings?.length || 'undefined',
        isArray: Array.isArray(listings),
        firstItem: listings?.[0],
        sortBy: sortBy,
        listingsType: typeof listings,
        listingsValue: listings
      });
      
      // Defensive check for listings array
      if (!Array.isArray(listings)) {
        console.warn('⚠️ [MARKETPLACE-DEBUG] listings is not an array:', listings);
        return [];
      }
      
      const sorted = [...listings].sort((a, b) => {
        try {
          switch (sortBy) {
            case 'newest':
              return new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt);
            case 'oldest':
              return new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt);
            case 'price_low':
              return (a.price || 0) - (b.price || 0);
            case 'price_high':
              return (b.price || 0) - (a.price || 0);
            case 'distance':
              return (a.distance || 999) - (b.distance || 999);
            default:
              return 0;
          }
        } catch (sortError) {
          console.error('❌ [MARKETPLACE-DEBUG] Error in sort comparison:', sortError, { a, b });
          return 0; // Default sort if error
        }
      });
      
      console.log('✅ [MARKETPLACE-DEBUG] sortedListings result:', {
        count: sorted.length,
        firstItem: sorted[0]
      });
      
      return sorted;
    } catch (useMemoError) {
      console.error('❌ [MARKETPLACE-DEBUG] Critical error in sortedListings useMemo:', useMemoError);
      console.error('❌ [MARKETPLACE-DEBUG] Error details:', {
        message: useMemoError.message,
        stack: useMemoError.stack,
        listings: listings,
        sortBy: sortBy
      });
      // Return empty array to prevent app crash
      return [];
    }
  }, [listings, sortBy]);

  // Effects with enhanced error handling
  useEffect(() => {
    const runEffects = async () => {
      try {
        console.log('🔄 [MARKETPLACE-DEBUG] useEffect triggered - calling fetchListings');
        console.log('🔄 [MARKETPLACE-DEBUG] useEffect deps:', {
          fetchListingsType: typeof fetchListings,
          fetchSavedItemsType: typeof fetchSavedItems,
          saved
        });
        
        await fetchListings();
        console.log('✅ [MARKETPLACE-DEBUG] fetchListings completed in useEffect');
        
        if (!saved) {
          await fetchSavedItems();
          console.log('✅ [MARKETPLACE-DEBUG] fetchSavedItems completed in useEffect');
        }
        
        preloadStockPhotos();
        console.log('✅ [MARKETPLACE-DEBUG] All useEffect actions completed');
      } catch (effectError) {
        console.error('❌ [MARKETPLACE-DEBUG] Error in useEffect:', effectError);
        console.error('❌ [MARKETPLACE-DEBUG] Effect error details:', {
          message: effectError.message,
          stack: effectError.stack,
          saved,
          currentUser: !!currentUser
        });
      }
    };
    
    runEffects();
  }, [fetchListings, fetchSavedItems, saved]);

  useEffect(() => {
    updateSearchParams();
  }, [filters, searchQuery]);

  // Add component render logging with comprehensive error handling
  try {
    console.log('🎨 [MARKETPLACE-DEBUG] EnhancedMarketplace render called');
    console.log('🎨 [MARKETPLACE-DEBUG] Render state:', {
      loading,
      listingsCount: listings?.length || 'undefined',
      sortedListingsCount: sortedListings?.length || 'undefined',
      saved,
      searchQuery,
      filtersActive: Object.values(filters || {}).some(f => f && f !== '' && f !== 'all'),
      currentUser: !!currentUser,
      savedItemsCount: savedItems?.size || 'undefined',
      cityCache: cityCache instanceof Map ? cityCache.size : 'not a Map'
    });
    
    // Defensive checks for critical state
    if (typeof loading !== 'boolean') {
      console.error('❌ [MARKETPLACE-DEBUG] loading is not boolean:', loading);
    }
    if (!Array.isArray(sortedListings)) {
      console.error('❌ [MARKETPLACE-DEBUG] sortedListings is not array:', sortedListings);
    }
    if (!(savedItems instanceof Set)) {
      console.error('❌ [MARKETPLACE-DEBUG] savedItems is not Set:', savedItems);
    }
    
  } catch (renderLogError) {
    console.error('❌ [MARKETPLACE-DEBUG] Error in render logging:', renderLogError);
  }

  // Wrap entire render in error boundary
  try {
    console.log('🚀 [MARKETPLACE-DEBUG] Starting JSX render');
    return (
    <Container fluid className="marketplace-container">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2>{saved ? 'Saved Items' : 'Marketplace'}</h2>
            <Button 
              variant="primary" 
              onClick={() => navigate('/listings/new')}
              className="btn-animated"
            >
              <i className="fas fa-plus me-2"></i>
              Sell Something
            </Button>
          </div>

          {/* Search and controls */}
          <Row className="mb-3">
            <Col md={8}>
              <Form onSubmit={handleSearch}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search marketplace..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button type="submit" variant="outline-secondary">
                    <i className="fas fa-search"></i>
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <i className="fas fa-filter"></i>
                    Filters
                  </Button>
                </InputGroup>
              </Form>
            </Col>
            <Col md={4}>
              <div className="d-flex gap-2">
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  size="sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="distance">Distance</option>
                </Form.Select>
                
                <div className="btn-group" role="group">
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <i className="fas fa-th"></i>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <i className="fas fa-list"></i>
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Filters */}
          {showFilters && (
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={resetFilters}
            />
          )}
        </Col>
      </Row>

      {/* Results */}
      <Row>
        <Col>
          {(() => {
            try {
              // Critical conditional rendering logging
              console.log('🎯 [MARKETPLACE-DEBUG] Conditional rendering evaluation:');
              console.log('   loading:', loading);
              console.log('   sortedListings.length:', sortedListings?.length || 'undefined');
              console.log('   sortedListings type:', typeof sortedListings);
              console.log('   sortedListings isArray:', Array.isArray(sortedListings));
              
              if (loading) {
                console.log('🔄 [MARKETPLACE-DEBUG] RENDERING: Loading spinner');
                return (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p className="mt-2">Loading listings...</p>
                  </div>
                );
              } else if (!sortedListings || !Array.isArray(sortedListings) || sortedListings.length === 0) {
                console.log('📭 [MARKETPLACE-DEBUG] RENDERING: No listings found message');
                console.log('📭 [MARKETPLACE-DEBUG] sortedListings value:', sortedListings);
                return (
                  <div className="text-center py-5">
                    <i className="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5>No listings found</h5>
                    <p className="text-muted">
                      {saved ? "You haven't saved any items yet." : "Try adjusting your search criteria."}
                    </p>
                    {!saved && (
                      <Button variant="primary" onClick={() => navigate('/listings/new')}>
                        Create the first listing
                      </Button>
                    )}
                  </div>
                );
              } else {
                console.log('📋 [MARKETPLACE-DEBUG] RENDERING: Listings grid with', sortedListings.length, 'items');
                console.log('📋 [MARKETPLACE-DEBUG] First item to render:', sortedListings[0]);
                return (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="text-muted">
                        {sortedListings.length} listing{sortedListings.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                    
                    <Row>
                      {sortedListings.map((listing, index) => {
                        try {
                          console.log(`🎨 [MARKETPLACE-DEBUG] Rendering listing ${index}:`, listing?.$id || listing?.id, listing?.title);
                          return (
                            <Col 
                              key={listing?.$id || listing?.id || `listing-${index}`} 
                              md={viewMode === 'grid' ? 4 : 12} 
                              className="mb-4"
                            >
                              <ListingCard
                                listing={listing}
                                savedItems={savedItems}
                                onSaveToggle={handleSaveToggle}
                                onViewDetails={handleViewDetails}
                                cityCache={cityCache}
                                setCityCache={setCityCache}
                              />
                            </Col>
                          );
                        } catch (cardError) {
                          console.error(`❌ [MARKETPLACE-DEBUG] Error rendering listing ${index}:`, cardError, listing);
                          return (
                            <Col key={`error-${index}`} md={viewMode === 'grid' ? 4 : 12} className="mb-4">
                              <div className="alert alert-warning">
                                Error rendering listing {index + 1}
                              </div>
                            </Col>
                          );
                        }
                      })}
                    </Row>
                  </>
                );
              }
            } catch (conditionalRenderError) {
              console.error('❌ [MARKETPLACE-DEBUG] Critical error in conditional rendering:', conditionalRenderError);
              return (
                <div className="alert alert-danger">
                  <h5>Marketplace Error</h5>
                  <p>Error rendering marketplace: {conditionalRenderError.message}</p>
                  <small>Check console for details</small>
                </div>
              );
            }
          })()}
        </Col>
      </Row>
    </Container>
    );
  } catch (renderError) {
    console.error('❌ [MARKETPLACE-DEBUG] CRITICAL RENDER ERROR - Component failed to render:', renderError);
    console.error('❌ [MARKETPLACE-DEBUG] Full render error details:', {
      message: renderError.message,
      stack: renderError.stack,
      componentState: {
        loading,
        listingsCount: listings?.length,
        sortedListingsCount: sortedListings?.length,
        savedItemsCount: savedItems?.size,
        currentUser: !!currentUser,
        saved,
        searchQuery
      }
    });
    
    // Return error UI to show what went wrong
    return (
      <Container fluid className="marketplace-container">
        <div className="alert alert-danger m-4">
          <h4>🚨 Marketplace Render Error</h4>
          <p><strong>Error:</strong> {renderError.message}</p>
          <p><strong>Component State:</strong></p>
          <ul>
            <li>Loading: {String(loading)}</li>
            <li>Listings: {listings?.length || 'undefined'} items</li>
            <li>Sorted Listings: {sortedListings?.length || 'undefined'} items</li>
            <li>Saved Items: {savedItems?.size || 'undefined'} items</li>
            <li>Current User: {currentUser ? 'logged in' : 'not logged in'}</li>
          </ul>
          <small>Check browser console for full error details</small>
        </div>
      </Container>
    );
  }
};

export default EnhancedMarketplace;