import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import itemsService from '../services/itemsService';
import savedItemsService from '../services/savedItemsService';
import featureService from '../services/featureImplementation';
import { getCachedCityFromCoordinates, formatLocationDisplay } from '../utils/geocoding';
import { getStockPhotoForListing, preloadStockPhotos } from '../services/stockPhotos';
import { handleError, generateErrorId } from '../utils/errorHandler';
import './Marketplace.css';

// Component to display location with city and distance
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
      
      if (cityCache && typeof cityCache.has === 'function' && cityCache.has(key)) {
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
  
  return <span>{locationText}</span>;
};

const Marketplace = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, sale, service
  const [savedItems, setSavedItems] = useState(new Set());
  const [userLocation, setUserLocation] = useState(null);
  const [cityCache, setCityCache] = useState(new Map());

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [Marketplace] Fetching listings from Appwrite...');
      
      // Use Appwrite itemsService to fetch items
      const options = {
        page: 1,
        limit: 50,
        search: searchQuery || null,
        sortBy: 'created_at',
        sortOrder: 'desc'
      };
      
      // Add filter by type if not 'all'
      if (filterType !== 'all') {
        options.listing_type = filterType;
      }
      
      const result = await itemsService.getItems(options);
      
      if (result.success) {
        console.log('✅ [Marketplace] Items fetched successfully:', result.items?.length || 0, 'items');
        setListings(Array.isArray(result.items) ? result.items : []);
      } else {
        console.error('❌ [Marketplace] Failed to fetch items:', result.error);
        toast.error('Failed to load marketplace items. Please try again.');
        setListings([]);
      }
    } catch (error) {
      console.error('❌ [Marketplace] Error fetching listings:', error);
      const errorResult = handleError(error, {
        context: 'Marketplace-FetchListings',
        fallbackMessage: 'Failed to load listings'
      });
      toast.error(errorResult.userMessage);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentUser]);

  useEffect(() => {
    // Set user location if available
    if (currentUser && currentUser.latitude && currentUser.longitude) {
      setUserLocation({
        latitude: currentUser.latitude,
        longitude: currentUser.longitude
      });
    }
    fetchListings();
    fetchSavedItems();
    
    // Preload stock photos for better performance
    preloadStockPhotos();
  }, [currentUser, fetchListings]);

  const fetchSavedItems = async () => {
    try {
      console.log('🔍 [Marketplace] Fetching saved items from Appwrite...');
      const result = await savedItemsService.getSavedItems();
      
      if (result.success && Array.isArray(result.savedItems)) {
        const savedIds = new Set(result.savedItems.map(item => item.item_id).filter(Boolean));
        console.log('✅ [Marketplace] Saved items fetched:', savedIds.size, 'items');
        setSavedItems(savedIds);
      } else {
        console.log('📝 [Marketplace] No saved items found or service not available');
        setSavedItems(new Set());
      }
    } catch (error) {
      console.warn('⚠️ [Marketplace] Saved items service error:', error);
      setSavedItems(new Set()); // Silent fallback - saved items are not critical
    }
  };

  const handleSaveToggle = async (itemId) => {
    try {
      if (savedItems.has(itemId)) {
        // Remove from saved items using Appwrite service
        const result = await savedItemsService.unsaveItem(itemId);
        if (result.success) {
          setSavedItems(new Set([...savedItems].filter(id => id !== itemId)));
          toast.success('Item removed from saved');
        } else {
          console.error('Failed to unsave item:', result.error);
          toast.error('Failed to remove item from saved');
        }
      } else {
        // Save item using Appwrite service
        const result = await savedItemsService.saveItem(itemId);
        if (result.success) {
          setSavedItems(new Set([...savedItems, itemId]));
          toast.success('Item saved');
        } else {
          console.error('Failed to save item:', result.error);
          toast.error('Failed to save item');
        }
      }
    } catch (error) {
      console.error('Error toggling save state:', error);
      handleError(error, {
        context: 'Marketplace-SaveToggle',
        fallbackMessage: `Failed to save item ${itemId}`
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const filteredListings = Array.isArray(listings) ? listings.filter(listing => {
    if (!listing) return false;
    if (filterType === 'all') return true;
    // For now, treat all items as 'sale' items since we don't have listing_type field yet
    return filterType === 'sale';
  }) : [];

  const getConditionBadge = (condition) => {
    const variants = {
      'new': 'success',
      'like_new': 'info',
      'good': 'primary',
      'fair': 'warning'
    };
    return <Badge bg={variants[condition] || 'secondary'}>{condition?.replace('_', ' ')}</Badge>;
  };

  return (
    <Container fluid className="marketplace-container">
      {/* Mobile Header - visible only on small screens */}
      <div className="mobile-header">
        <div className="mobile-header-content">
          <Form onSubmit={handleSearch} className="mobile-search-form">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search marketplace"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
              <Button type="submit" variant="outline-secondary" size="sm" className="btn-animated">
                <i className="fas fa-search icon-animated"></i>
              </Button>
            </InputGroup>
          </Form>
          <Button 
            variant="primary" 
            size="sm"
            className="mobile-sell-btn btn-animated btn-glow-primary"
            onClick={() => navigate('/listings/new')}
          >
            <i className="fas fa-plus icon-bounce"></i> Sell
          </Button>
        </div>
        <div className="mobile-filters">
          <Button
            variant={filterType === 'all' ? 'primary' : 'outline-secondary'}
            size="sm"
            className="filter-btn btn-animated"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button
            variant={filterType === 'sale' ? 'primary' : 'outline-secondary'}
            size="sm"
            className="filter-btn btn-animated"
            onClick={() => setFilterType('sale')}
          >
            For Sale
          </Button>
          <Button
            variant={filterType === 'service' ? 'primary' : 'outline-secondary'}
            size="sm"
            className="filter-btn btn-animated"
            onClick={() => setFilterType('service')}
          >
            Services
          </Button>
        </div>
      </div>

      <Row>
        {/* Sidebar */}
        <Col md={3} className="sidebar">
          <div className="sticky-top pt-3">
            <h5>Marketplace</h5>
            
            <Button 
              variant="primary" 
              className="w-100 mb-3 btn-animated btn-glow-primary"
              onClick={() => navigate('/listings/new')}
            >
              + Sell Something
            </Button>

            <Form onSubmit={handleSearch} className="mb-4">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search marketplace"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary" className="btn-animated">
                  <i className="fas fa-search icon-animated"></i>
                </Button>
              </InputGroup>
            </Form>

            <div className="filter-section">
              <h6>Filters</h6>
              <Form.Check
                type="radio"
                label="All listings"
                name="filter"
                id="filter-all"
                checked={filterType === 'all'}
                onChange={() => setFilterType('all')}
              />
              <Form.Check
                type="radio"
                label="Items for sale"
                name="filter"
                id="filter-sale"
                checked={filterType === 'sale'}
                onChange={() => setFilterType('sale')}
              />
              <Form.Check
                type="radio"
                label="Services"
                name="filter"
                id="filter-service"
                checked={filterType === 'service'}
                onChange={() => setFilterType('service')}
              />
            </div>

            <hr />

            <div className="nav-links">
              <div className="nav-link" onClick={() => navigate('/saved')}>
                <i className="fas fa-bookmark"></i> Saved items
              </div>
              <div className="nav-link" onClick={() => navigate('/messages')}>
                <i className="fas fa-inbox"></i> Inbox
              </div>
              <div className="nav-link" onClick={() => navigate('/my-listings')}>
                <i className="fas fa-user"></i> Your listings
              </div>
            </div>
          </div>
        </Col>

        {/* Main Content */}
        <Col md={9} className="main-content">
          <div className="content-header">
            <h4>Today's picks</h4>
            <div className="location-info">
              <i className="fas fa-map-marker-alt"></i> 
              <span> Within 50 miles{userLocation && currentUser?.zipcode ? ` of ${currentUser.zipcode}` : ''}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-animated mx-auto mb-3"></div>
              <div className="loading-dots">Loading marketplace</div>
            </div>
          ) : (
            <Row className="g-3">
              {filteredListings.map(listing => (
                <Col xs={6} md={4} lg={3} key={listing.$id}>
                  <Card className="listing-card h-100 card-animated" onClick={() => navigate(`/listings/${listing.$id}`)}>
                    <div className="image-container">
                      {listing.images && listing.images.length > 0 ? (
                        <img 
                          src={listing.images[0]}
                          alt={listing.title}
                          className="listing-image"
                        />
                      ) : (
                        (() => {
                          const stockPhoto = getStockPhotoForListing(listing);
                          return stockPhoto ? (
                            <img 
                              src={stockPhoto}
                              alt={listing.title}
                              className="listing-image stock-photo"
                              style={{ 
                                opacity: 0.85,
                                filter: 'brightness(1.1) contrast(1.05)'
                              }}
                            />
                          ) : (
                            <div className="no-image">
                              <i className="fas fa-image"></i>
                            </div>
                          );
                        })()
                      )}
                      <Button
                        className={`save-btn ${savedItems.has(listing.$id) ? 'saved' : ''}`}
                        variant="light"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToggle(listing.$id);
                        }}
                      >
                        <i className={`${savedItems.has(listing.$id) ? 'fas' : 'far'} fa-bookmark`}></i>
                      </Button>
                    </div>
                    <Card.Body className="p-2">
                      <div className="price-row">
                        <h5 className="mb-0">${listing.price}</h5>
                        {listing.condition && getConditionBadge(listing.condition)}
                      </div>
                      <p className="listing-title mb-1">
                        {listing.title}
                      </p>
                      <small className="text-muted">
                        {listing.city && <><i className="fas fa-map-marker-alt"></i> {listing.city} • </>}
                        <span className="text-primary">
                          Seller
                        </span>
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Marketplace;