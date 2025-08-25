import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Carousel, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';
import itemsService from '../services/itemsService';
import appwriteDatabase from '../services/appwriteDatabase';
import { useSelector } from 'react-redux';
import { getCachedCityFromCoordinates, formatLocationDisplay } from '../utils/geocoding';
import VerifiedBadge from './VerifiedBadge';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [locationText, setLocationText] = useState('Location');
  const [ownerMembershipStatus, setOwnerMembershipStatus] = useState(null);
  const [contacting, setContacting] = useState(false);

  const fetchListing = useCallback(async () => {
    try {
      console.log('🔍 Fetching listing with ID:', id);
      
      // Use itemsService directly instead of API
      const result = await itemsService.getItem(id);
      
      if (result.success && result.item) {
        console.log('✅ Item fetched successfully:', result.item);
        
        const item = result.item;
        
        // Try to get owner/user data
        let owner = null;
        try {
          const userId = item.user_id || item.userId || item.owner_id || item.ownerId;
          console.log('🔍 Trying to get user data for userId:', userId);
          
          if (userId) {
            const userResult = await appwriteDatabase.getUserById(userId);
            if (userResult.success && userResult.user) {
              owner = {
                id: userResult.user.$id || userResult.user.id,
                username: userResult.user.username || userResult.user.name || userResult.user.email?.split('@')[0] || 'Unknown User',
                email: userResult.user.email,
                created_at: userResult.user.$createdAt || userResult.user.created_at,
                latitude: userResult.user.latitude,
                longitude: userResult.user.longitude
              };
              console.log('✅ Found owner data:', owner);
            }
          }
        } catch (userError) {
          console.warn('⚠️ Could not fetch owner data:', userError);
        }
        
        // Create listing object with owner data
        const listingWithOwner = {
          ...item,
          owner: owner
        };
        
        console.log('🎯 Setting listing with owner:', listingWithOwner);
        setListing(listingWithOwner);
        setIsSaved(item.is_saved || false);
        
        // Load owner's membership status if we have the owner
        if (owner?.id) {
          try {
            const membershipResponse = await api.get(`/users/${owner.id}/membership-status`);
            setOwnerMembershipStatus(membershipResponse.data);
          } catch (membershipError) {
            console.warn('Could not load owner membership status:', membershipError);
          }
        }
      } else {
        console.error('❌ Failed to fetch item:', result.error);
        toast.error('Failed to load listing');
        navigate('/');
      }
    } catch (error) {
      console.error('❌ Error in fetchListing:', error);
      toast.error('Failed to load listing');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  useEffect(() => {
    const updateLocationText = async () => {
      if (!listing?.owner?.latitude || !listing?.owner?.longitude) {
        setLocationText(listing?.distance ? `${listing.distance.toFixed(1)} miles away` : 'Location');
        return;
      }
      
      try {
        const city = await getCachedCityFromCoordinates(listing.owner.latitude, listing.owner.longitude);
        setLocationText(formatLocationDisplay(listing.distance, city));
      } catch (error) {
        console.error('Error getting city:', error);
        setLocationText(listing?.distance ? `${listing.distance.toFixed(1)} miles away` : 'Location');
      }
    };
    
    updateLocationText();
  }, [listing]);

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await api.delete(`/api/listings/${id}/save`);
        setIsSaved(false);
        toast.success('Item removed from saved');
      } else {
        await api.post(`/api/listings/${id}/save`);
        setIsSaved(true);
        toast.success('Item saved');
      }
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const handleContact = async () => {
    setContacting(true);
    console.log('🔧 Contact seller clicked', { 
      listing: listing, 
      ownerId: listing?.owner?.id,
      ownerData: listing?.owner 
    });
    
    try {
      if (!listing?.owner?.id) {
        console.error('❌ Cannot contact seller: missing owner ID');
        toast.error('Cannot contact seller - missing contact information');
        return;
      }
      
      if (!currentUser) {
        console.error('❌ Cannot contact seller: user not logged in');
        toast.error('Please log in to contact seller');
        navigate('/login');
        return;
      }
      
      console.log('✅ Navigating to messages with user ID:', listing.owner.id);
      navigate(`/messages/${listing.owner.id}`);
    } catch (error) {
      console.error('❌ Error navigating to messages:', error);
      toast.error('Error opening messages - please try again');
    } finally {
      setContacting(false);
    }
  };

  const getConditionBadge = (condition) => {
    const variants = {
      'new': 'success',
      'like_new': 'info',
      'good': 'primary',
      'fair': 'warning'
    };
    return <Badge bg={variants[condition] || 'secondary'}>{condition?.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (!listing) {
    return (
      <Container className="py-4">
        <div className="text-center">Listing not found</div>
      </Container>
    );
  }

  const isOwner = currentUser && listing?.owner?.id && currentUser.id === listing.owner.id;

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <Card>
            <Card.Body>
              {listing.images && listing.images.length > 0 ? (
                <Carousel className="mb-4">
                  {listing.images.map((image, index) => (
                    <Carousel.Item key={index}>
                      <img
                        src={`${api.defaults.baseURL}${image}`}
                        alt={`${listing.title} ${index + 1}`}
                        className="d-block w-100"
                        style={{ maxHeight: '500px', objectFit: 'contain' }}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : (
                <div className="text-center py-5 bg-light mb-4">
                  <i className="fas fa-image fa-4x text-muted"></i>
                  <p className="text-muted mt-2">No images available</p>
                </div>
              )}

              <h2>{listing.title}</h2>
              
              <div className="d-flex align-items-center gap-3 mb-3">
                <h3 className="text-primary mb-0">${listing.price}</h3>
                {listing.condition && getConditionBadge(listing.condition)}
                <Badge bg="secondary">{listing.category}</Badge>
                {listing.listing_type === 'service' && (
                  <Badge bg="info">Service</Badge>
                )}
              </div>

              <hr />

              <h5>Description</h5>
              <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                {listing.description}
              </p>

              {listing.listing_type === 'service' && (
                <>
                  {listing.service_type && (
                    <div className="mb-3">
                      <strong>Service Type:</strong> {listing.service_type}
                    </div>
                  )}
                  {listing.hourly_rate && (
                    <div className="mb-3">
                      <strong>Hourly Rate:</strong> ${listing.hourly_rate}/hour
                    </div>
                  )}
                  {listing.availability && (
                    <div className="mb-3">
                      <strong>Availability:</strong> {listing.availability}
                    </div>
                  )}
                </>
              )}

              <div className="text-muted">
                <small>Listed {new Date(listing.created_at).toLocaleDateString()}</small>
                {listing.views && (
                  <small className="ms-3">
                    <i className="fas fa-eye"></i> {listing.views} views
                  </small>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div 
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" 
                  style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                  onClick={() => listing?.owner?.id && navigate(`/users/${listing.owner.id}`)}
                >
                  <i className="fas fa-user"></i>
                </div>
                <div className="ms-3 flex-grow-1">
                  <div className="d-flex align-items-center mb-1">
                    <h6 className="mb-0 me-2">
                      <a 
                        href={listing?.owner?.id ? `/users/${listing.owner.id}` : '#'}
                        onClick={(e) => {
                          e.preventDefault();
                          if (listing?.owner?.id) {
                            navigate(`/users/${listing.owner.id}`);
                          }
                        }}
                        className="text-decoration-none text-dark"
                      >
                        {listing.owner?.username || 'Unknown User'}
                      </a>
                    </h6>
                    <VerifiedBadge 
                      isVerified={ownerMembershipStatus?.is_verified_human} 
                      size="sm" 
                    />
                  </div>
                  <small className="text-muted">
                    Member since {listing.owner?.created_at ? new Date(listing.owner.created_at).toLocaleDateString() : 'Unknown'}
                  </small>
                </div>
              </div>

              {!isOwner ? (
                <>
                  <Button 
                    variant="primary" 
                    className="w-100 mb-2"
                    onClick={handleContact}
                    disabled={contacting || !listing?.owner?.id}
                  >
                    {contacting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-comment"></i> Contact Seller
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    className="w-100 mb-2"
                    onClick={() => listing?.owner?.id && navigate(`/users/${listing.owner.id}`)}
                  >
                    <i className="fas fa-user"></i> View Profile
                  </Button>
                  <Button 
                    variant={isSaved ? 'secondary' : 'outline-secondary'}
                    className="w-100"
                    onClick={handleSaveToggle}
                  >
                    <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark`}></i>
                    {isSaved ? ' Saved' : ' Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="primary" 
                    className="w-100 mb-2"
                    onClick={() => navigate(`/listings/edit/${(listing.$id || listing.id)}`)}
                  >
                    <i className="fas fa-edit"></i> Edit Listing
                  </Button>
                  <div className="text-center text-muted">
                    <small>This is your listing</small>
                  </div>
                </>
              )}

              <hr />

              <div className="text-muted">
                <div className="mb-2">
                  <i className="fas fa-map-marker-alt"></i>
                  <span className="ms-2">
                    {locationText}
                  </span>
                </div>
                <div>
                  <i className="fas fa-shield-alt"></i>
                  <span className="ms-2">Safe transaction tips</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ListingDetail;