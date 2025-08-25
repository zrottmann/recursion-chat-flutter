import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Container, Row, Col, Card, Badge, Button, Tab, Tabs,
  ListGroup, Alert, Spinner, Modal, Form, ProgressBar,
  Image, Dropdown, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import { 
  User, Star, MessageCircle, Flag, Shield, Award,
  Calendar, MapPin, Heart, Package, TrendingUp,
  Settings, Camera, Edit, Share, Download, Upload,
  CheckCircle, Clock, ThumbsUp, ThumbsDown, Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import cacheService from '../services/cacheService';
import UserReviews from './UserReviews';
import VerifiedBadge from './VerifiedBadge';
import './EnhancedUserProfile.css';

const EnhancedUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile data
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tradingHistory, setTradingHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reputation, setReputation] = useState(null);
  
  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Edit state
  const [editForm, setEditForm] = useState({
    bio: '',
    location: '',
    interests: [],
    privacy_settings: {
      show_email: false,
      show_location: true,
      show_trading_history: true,
      show_reviews: true
    }
  });
  
  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

  /**
   * Load profile data
   */
  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  /**
   * Load all profile data
   */
  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Try to get from cache first
      const cacheKey = `profile_${userId}`;
      const cachedProfile = cacheService.get(cacheKey);
      
      if (cachedProfile) {
        setProfile(cachedProfile);
        setLoading(false);
      }
      
      // Load fresh data
      const [
        profileResponse,
        listingsResponse,
        reviewsResponse,
        tradingResponse,
        analyticsResponse,
        reputationResponse
      ] = await Promise.all([
        api.get(`/users/${userId}/profile`),
        api.get(`/users/${userId}/listings`),
        api.get(`/users/${userId}/reviews`),
        api.get(`/users/${userId}/trading-history`),
        api.get(`/users/${userId}/analytics`),
        api.get(`/users/${userId}/reputation`)
      ]);
      
      const profileData = profileResponse.data;
      
      setProfile(profileData);
      setListings(listingsResponse.data);
      setReviews(reviewsResponse.data);
      setTradingHistory(tradingResponse.data);
      setAnalytics(analyticsResponse.data);
      setReputation(reputationResponse.data);
      
      // Cache profile data
      cacheService.set(cacheKey, profileData, { ttl: 5 * 60 * 1000 }); // 5 minutes
      
      // Initialize edit form if own profile
      if (isOwnProfile) {
        setEditForm({
          bio: profileData.bio || '',
          location: profileData.location || '',
          interests: profileData.interests || [],
          privacy_settings: profileData.privacy_settings || {
            show_email: false,
            show_location: true,
            show_trading_history: true,
            show_reviews: true
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to load profile data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update profile
   */
  const updateProfile = async () => {
    try {
      const response = await api.patch(`/users/${userId}/profile`, editForm);
      setProfile(response.data);
      setShowEditModal(false);
      toast.success('Profile updated successfully!');
      
      // Clear cache
      cacheService.delete(`profile_${userId}`);
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    }
  };

  /**
   * Start conversation with user
   */
  const startConversation = () => {
    navigate(`/messages/${userId}`);
  };

  /**
   * Report user
   */
  const reportUser = async (reason, details) => {
    try {
      await api.post('/reports/user', {
        reported_user_id: parseInt(userId),
        reason,
        details
      });
      
      setShowReportModal(false);
      toast.success('Report submitted successfully');
      
    } catch (error) {
      console.error('Failed to report user:', error);
      toast.error('Failed to submit report');
    }
  };

  /**
   * Share profile
   */
  const shareProfile = async (method) => {
    const profileUrl = `${window.location.origin}/users/${userId}`;
    
    try {
      if (method === 'copy') {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied to clipboard!');
      } else if (method === 'share' && navigator.share) {
        await navigator.share({
          title: `${profile.username}'s Profile - Trading Post`,
          text: `Check out ${profile.username}'s profile on Trading Post`,
          url: profileUrl
        });
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to share profile:', error);
    }
  };

  /**
   * Calculate reputation score
   */
  const calculateReputationScore = () => {
    if (!reputation) return 0;
    
    const {
      total_trades = 0,
      successful_trades = 0,
      average_rating = 0,
      response_time = 24,
      account_age_days = 0
    } = reputation;
    
    let score = 0;
    
    // Trading success rate (40% weight)
    const successRate = total_trades > 0 ? successful_trades / total_trades : 0;
    score += successRate * 40;
    
    // Average rating (30% weight)
    score += (average_rating / 5) * 30;
    
    // Response time (15% weight) - better score for faster response
    const responseScore = Math.max(0, (48 - response_time) / 48);
    score += responseScore * 15;
    
    // Account age (15% weight) - up to 1 year
    const ageScore = Math.min(1, account_age_days / 365);
    score += ageScore * 15;
    
    return Math.round(score);
  };

  /**
   * Get reputation level
   */
  const getReputationLevel = (score) => {
    if (score >= 90) return { level: 'Elite', color: 'success', icon: Award };
    if (score >= 75) return { level: 'Expert', color: 'info', icon: Star };
    if (score >= 60) return { level: 'Trusted', color: 'primary', icon: CheckCircle };
    if (score >= 40) return { level: 'Verified', color: 'warning', icon: Shield };
    return { level: 'New', color: 'secondary', icon: User };
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" />
        <span className="ms-2">Loading profile...</span>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="text-center py-5">
        <Alert variant="warning">
          <h5>Profile Not Found</h5>
          <p>The user profile you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  const reputationScore = calculateReputationScore();
  const reputationLevel = getReputationLevel(reputationScore);
  const ReputationIcon = reputationLevel.icon;

  return (
    <Container className="enhanced-user-profile py-4">
      {/* Profile Header */}
      <Card className="profile-header-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3} className="text-center">
              <div className="profile-avatar-container position-relative">
                <div className="profile-avatar bg-primary text-white d-flex align-items-center justify-content-center">
                  {profile.avatar_url ? (
                    <Image 
                      src={profile.avatar_url} 
                      alt={profile.username}
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>
                      {profile.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="position-absolute bottom-0 end-0 rounded-circle"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <Camera size={14} />
                  </Button>
                )}
              </div>
            </Col>
            
            <Col md={6}>
              <div className="d-flex align-items-center mb-2">
                <h2 className="mb-0 me-3">{profile.username}</h2>
                <VerifiedBadge 
                  isVerified={profile.is_verified}
                  size="md"
                  showText={false}
                />
                <Badge 
                  bg={reputationLevel.color} 
                  className="ms-2 d-flex align-items-center"
                >
                  <ReputationIcon size={14} className="me-1" />
                  {reputationLevel.level}
                </Badge>
              </div>
              
              <div className="profile-stats d-flex gap-4 mb-3">
                <div className="stat-item">
                  <strong>{reputation?.total_trades || 0}</strong>
                  <small className="text-muted d-block">Trades</small>
                </div>
                <div className="stat-item">
                  <strong>{reputation?.average_rating?.toFixed(1) || '0.0'}</strong>
                  <small className="text-muted d-block">Rating</small>
                </div>
                <div className="stat-item">
                  <strong>{reputationScore}</strong>
                  <small className="text-muted d-block">Reputation</small>
                </div>
                <div className="stat-item">
                  <strong>{listings.length}</strong>
                  <small className="text-muted d-block">Active Listings</small>
                </div>
              </div>
              
              {profile.bio && (
                <p className="text-muted mb-2">{profile.bio}</p>
              )}
              
              <div className="profile-meta d-flex gap-3 text-muted">
                {profile.location && (
                  <div className="d-flex align-items-center">
                    <MapPin size={14} className="me-1" />
                    <small>{profile.location}</small>
                  </div>
                )}
                <div className="d-flex align-items-center">
                  <Calendar size={14} className="me-1" />
                  <small>Joined {new Date(profile.created_at).toLocaleDateString()}</small>
                </div>
                {profile.last_seen && (
                  <div className="d-flex align-items-center">
                    <Clock size={14} className="me-1" />
                    <small>Last seen {new Date(profile.last_seen).toLocaleDateString()}</small>
                  </div>
                )}
              </div>
            </Col>
            
            <Col md={3} className="text-end">
              <div className="profile-actions d-flex flex-column gap-2">
                {!isOwnProfile ? (
                  <>
                    <Button 
                      variant="primary" 
                      onClick={startConversation}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <MessageCircle size={16} className="me-2" />
                      Message
                    </Button>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setShowShareModal(true)}
                      >
                        <Share size={14} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => setShowReportModal(true)}
                      >
                        <Flag size={14} />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline-primary"
                      onClick={() => setShowEditModal(true)}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <Edit size={16} className="me-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowShareModal(true)}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <Share size={16} className="me-2" />
                      Share Profile
                    </Button>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Reputation Progress Bar */}
      {reputation && (
        <Card className="mb-4">
          <Card.Body className="py-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Reputation Score</h6>
              <span className="text-muted">{reputationScore}/100</span>
            </div>
            <ProgressBar 
              now={reputationScore} 
              variant={reputationLevel.color}
              style={{ height: '8px' }}
            />
            <div className="d-flex justify-content-between text-muted small mt-2">
              <span>Success Rate: {reputation.total_trades > 0 ? 
                Math.round((reputation.successful_trades / reputation.total_trades) * 100) : 0}%</span>
              <span>Avg Response: {reputation.response_time}h</span>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Profile Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onSelect={setActiveTab}
        className="profile-tabs mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col lg={8}>
              {/* Recent Listings */}
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Recent Listings</h6>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setActiveTab('listings')}
                  >
                    View All
                  </Button>
                </Card.Header>
                <Card.Body>
                  {listings.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <Package size={48} className="mb-3" />
                      <p>No listings yet</p>
                    </div>
                  ) : (
                    <Row>
                      {listings.slice(0, 6).map(listing => (
                        <Col md={6} lg={4} key={(listing.$id || listing.id)} className="mb-3">
                          <Card className="listing-card h-100">
                            <Card.Img 
                              variant="top" 
                              src={listing.images?.[0] || '/placeholder-image.jpg'}
                              style={{ height: '150px', objectFit: 'cover' }}
                            />
                            <Card.Body className="p-3">
                              <h6 className="text-truncate">{listing.title}</h6>
                              <p className="text-success mb-0">${listing.price}</p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card.Body>
              </Card>

              {/* Recent Reviews */}
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Recent Reviews</h6>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setActiveTab('reviews')}
                  >
                    View All
                  </Button>
                </Card.Header>
                <Card.Body>
                  {reviews.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <Star size={48} className="mb-3" />
                      <p>No reviews yet</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {reviews.slice(0, 3).map(review => (
                        <ListGroup.Item key={review.id} className="px-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div className="d-flex align-items-center mb-1">
                                <div className="text-warning me-2">
                                  {'★'.repeat(review.rating)}
                                  {'☆'.repeat(5 - review.rating)}
                                </div>
                                <small className="text-muted">
                                  by {review.reviewer_name}
                                </small>
                              </div>
                              <p className="mb-0 small">{review.comment}</p>
                            </div>
                            <small className="text-muted">
                              {new Date(review.created_at).toLocaleDateString()}
                            </small>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={4}>
              {/* Quick Stats */}
              <Card className="mb-4">
                <Card.Header>
                  <h6 className="mb-0">Quick Stats</h6>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Profile Views</span>
                      <Badge bg="secondary">{analytics?.profile_views || 0}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Messages Sent</span>
                      <Badge bg="secondary">{analytics?.messages_sent || 0}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Successful Trades</span>
                      <Badge bg="success">{reputation?.successful_trades || 0}</Badge>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between px-0">
                      <span>Average Rating</span>
                      <Badge bg="warning">
                        {reputation?.average_rating?.toFixed(1) || '0.0'} ★
                      </Badge>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Interests</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} bg="light" text="dark">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="listings" title={`Listings (${listings.length})`}>
          <Row>
            {listings.map(listing => (
              <Col lg={4} md={6} key={(listing.$id || listing.id)} className="mb-4">
                <Card className="listing-card h-100">
                  <Card.Img 
                    variant="top" 
                    src={listing.images?.[0] || '/placeholder-image.jpg'}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onClick={() => navigate(`/listings/${(listing.$id || listing.id)}`)}
                    className="cursor-pointer"
                  />
                  <Card.Body>
                    <h6 className="text-truncate">{listing.title}</h6>
                    <p className="text-muted small mb-2">{listing.description}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-success fw-bold">${listing.price}</span>
                      <small className="text-muted">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Tab>

        <Tab eventKey="reviews" title={`Reviews (${reviews.length})`}>
          <UserReviews userId={userId} userName={profile.username} />
        </Tab>

        <Tab eventKey="trading" title="Trading History">
          <Card>
            <Card.Body>
              {tradingHistory.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <TrendingUp size={48} className="mb-3" />
                  <h5>No Trading History</h5>
                  <p>This user hasn't completed any trades yet.</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {tradingHistory.map(trade => (
                    <ListGroup.Item key={trade.id}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{trade.title}</h6>
                          <p className="mb-1 text-muted small">{trade.description}</p>
                          <Badge 
                            bg={trade.status === 'completed' ? 'success' : 'warning'}
                          >
                            {trade.status}
                          </Badge>
                        </div>
                        <div className="text-end">
                          <div className="text-success fw-bold">${trade.value}</div>
                          <small className="text-muted">
                            {new Date(trade.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Edit Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Your city or region"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Interests</Form.Label>
              <Form.Control
                type="text"
                value={editForm.interests.join(', ')}
                onChange={(e) => setEditForm(prev => ({ 
                  ...prev, 
                  interests: e.target.value.split(',').map(i => i.trim()).filter(i => i) 
                }))}
                placeholder="Electronics, Books, Gaming (comma separated)"
              />
            </Form.Group>
            
            <Card>
              <Card.Header>
                <h6 className="mb-0">Privacy Settings</h6>
              </Card.Header>
              <Card.Body>
                <Form.Check
                  type="switch"
                  id="show-email"
                  label="Show email address"
                  checked={editForm.privacy_settings.show_email}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    privacy_settings: {
                      ...prev.privacy_settings,
                      show_email: e.target.checked
                    }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="switch"
                  id="show-location"
                  label="Show location"
                  checked={editForm.privacy_settings.show_location}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    privacy_settings: {
                      ...prev.privacy_settings,
                      show_location: e.target.checked
                    }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="switch"
                  id="show-trading-history"
                  label="Show trading history"
                  checked={editForm.privacy_settings.show_trading_history}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    privacy_settings: {
                      ...prev.privacy_settings,
                      show_trading_history: e.target.checked
                    }
                  }))}
                  className="mb-2"
                />
                <Form.Check
                  type="switch"
                  id="show-reviews"
                  label="Show reviews"
                  checked={editForm.privacy_settings.show_reviews}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    privacy_settings: {
                      ...prev.privacy_settings,
                      show_reviews: e.target.checked
                    }
                  }))}
                />
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updateProfile}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Share Profile Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-2">
            <Button 
              variant="outline-primary"
              onClick={() => shareProfile('copy')}
            >
              Copy Link
            </Button>
            {navigator.share && (
              <Button 
                variant="outline-primary"
                onClick={() => shareProfile('share')}
              >
                Share via...
              </Button>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* Report User Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Report User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Select>
                <option value="">Select a reason...</option>
                <option value="spam">Spam or fake listings</option>
                <option value="scam">Suspected scam</option>
                <option value="inappropriate">Inappropriate behavior</option>
                <option value="fake">Fake profile</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Please provide additional details..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => reportUser('spam', 'Test report')}>
            Submit Report
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EnhancedUserProfile;