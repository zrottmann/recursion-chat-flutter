import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import api from '../services/api';
import UserReviews from '../components/UserReviews';
import VerifiedBadge from '../components/VerifiedBadge';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');

  useEffect(() => {
    loadUserProfile();
    loadUserListings();
    loadReviewStats();
    loadMembershipStatus();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('User not found');
    }
  };

  const loadUserListings = async () => {
    try {
      const response = await api.get(`/users/${userId}/listings?page=1&limit=20`);
      setUserListings(response.data.listings || []);
    } catch (error) {
      console.error('Error loading user listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewStats = async () => {
    try {
      const response = await api.get(`/users/${userId}/review-stats`);
      setReviewStats(response.data);
    } catch (error) {
      console.error('Error loading review stats:', error);
    }
  };

  const loadMembershipStatus = async () => {
    try {
      const response = await api.get(`/users/${userId}/membership-status`);
      setMembershipStatus(response.data);
    } catch (error) {
      console.error('Error loading membership status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleListingClick = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading user profile...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h4>Error</h4>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          {/* User Header */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <div className="d-flex align-items-center mb-2">
                    <h2 className="mb-0 me-3">{user?.username || 'Loading...'}</h2>
                    <VerifiedBadge 
                      isVerified={membershipStatus?.is_verified_human} 
                      size="md" 
                      showText={true} 
                    />
                  </div>
                  <p className="text-muted mb-2">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Member since {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                  </p>
                  <p className="text-muted mb-0">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    {user?.latitude && user?.longitude ? 'Location verified' : 'Location not set'}
                  </p>
                </Col>
                <Col md={4} className="text-end">
                  <div className="d-flex flex-column align-items-end">
                    {reviewStats && reviewStats.total_reviews > 0 ? (
                      <>
                        <div className="h3 mb-0">
                          <span className={`text-${reviewStats.positive_percentage >= 90 ? 'success' : reviewStats.positive_percentage >= 75 ? 'warning' : 'danger'}`}>
                            {reviewStats.positive_percentage}% Positive
                          </span>
                        </div>
                        <small className="text-muted">
                          {reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? 's' : ''} • {reviewStats.average_rating}⭐
                        </small>
                        <small className="text-muted mt-1">
                          {userListings.length} Active Listings
                        </small>
                      </>
                    ) : (
                      <>
                        <div className="h5 mb-1 text-success">
                          {userListings.length} Active Listings
                        </div>
                        <small className="text-muted">
                          No reviews yet
                        </small>
                      </>
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="listings" title={`Listings (${userListings.length})`}>
              <Row>
                {userListings.length === 0 ? (
                  <Col>
                    <Alert variant="info" className="text-center">
                      <h5>No listings yet</h5>
                      <p className="mb-0">This user hasn't posted any listings.</p>
                    </Alert>
                  </Col>
                ) : (
                  userListings.map(listing => (
                    <Col md={6} lg={4} key={(listing.$id || listing.id)} className="mb-3">
                      <Card 
                        className="h-100 listing-card" 
                        onClick={() => handleListingClick((listing.$id || listing.id))}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{listing.title}</h6>
                            <span className="badge bg-primary">{listing.category}</span>
                          </div>
                          {listing.price && (
                            <h6 className="text-success mb-2">${listing.price}</h6>
                          )}
                          <p className="text-muted small mb-2">
                            {listing.description.length > 80 
                              ? `${listing.description.substring(0, 80)}...` 
                              : listing.description
                            }
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {formatDate(listing.created_at)}
                            </small>
                            <small className={`badge bg-${listing.is_available ? 'success' : 'secondary'}`}>
                              {listing.is_available ? 'Available' : 'Sold'}
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </Tab>

            <Tab eventKey="reviews" title="Reviews">
              <UserReviews userId={userId} userName={user?.username || 'User'} />
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;