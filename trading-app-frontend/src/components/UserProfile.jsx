import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, Tab, Tabs, Badge, Alert, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { updateUserProfile } from '../store/slices/userSlice';
import VerifiedBadge from './VerifiedBadge';
import MembershipModal from './MembershipModal';
import api from '../services/api';

const UserProfile = () => {
  const dispatch = useDispatch();
  const { currentUser, loading: userLoading } = useSelector(state => state.user);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    phone: '',
    location: '',
    zipcode: '',
    profileImage: null,
    preferredCategories: [],
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false
    }
  });
  
  const [membership, setMembership] = useState(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [profileStats, setProfileStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        phone: currentUser.phone || '',
        location: currentUser.location || '',
        zipcode: currentUser.zipcode || '',
        profileImage: currentUser.profileImage || null,
        preferredCategories: currentUser.preferredCategories || [],
        notifications: {
          email: currentUser.notifications?.email ?? true,
          push: currentUser.notifications?.push ?? true,
          sms: currentUser.notifications?.sms ?? false,
          marketing: currentUser.notifications?.marketing ?? false
        }
      });
      loadMembership();
      loadProfileStats();
      loadRecentActivity();
    }
  }, [currentUser]);

  const loadMembership = async () => {
    try {
      const response = await api.get('/memberships/my-membership');
      setMembership(response.data);
    } catch (error) {
      console.error('Error loading membership:', error);
    }
  };

  const loadProfileStats = async () => {
    try {
      const response = await api.get('/users/profile-stats');
      setProfileStats(response.data);
    } catch (error) {
      console.error('Error loading profile stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await api.get('/users/recent-activity');
      setRecentActivity(response.data);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploadingImage(true);
    try {
      const response = await api.post('/upload/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData(prev => ({ ...prev, profileImage: response.data.url }));
      toast.success('Profile image updated successfully!');
    } catch (error) {
      toast.error('Failed to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleCategoryToggle = (category) => {
    setFormData(prev => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(category)
        ? prev.preferredCategories.filter(c => c !== category)
        : [...prev.preferredCategories, category]
    }));
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/account');
      toast.success('Account deleted successfully');
      // Redirect to login or home
      window.location.href = '/login';
    } catch (error) {
      toast.error('Failed to delete account');
    }
    setShowDeleteModal(false);
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };


  const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Tools', 'Automotive', 'Services', 'Other'];

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Profile Header */}
          <Card className="mb-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div className="position-relative d-inline-block">
                    <div 
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                      style={{ width: '100px', height: '100px', cursor: 'pointer' }}
                      onClick={() => document.getElementById('profileImageInput').click()}
                    >
                      {formData.profileImage ? (
                        <img 
                          src={`${api.defaults.baseURL}${formData.profileImage}`} 
                          alt="Profile" 
                          className="rounded-circle"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className="fas fa-user fa-2x text-muted"></i>
                      )}
                    </div>
                    {uploadingImage && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle bg-dark bg-opacity-50 d-flex align-items-center justify-content-center">
                        <div className="spinner-border spinner-border-sm text-white" role="status"></div>
                      </div>
                    )}
                  </div>
                  <input
                    id="profileImageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="mt-2">
                    <small className="text-muted">Click to change photo</small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-2">
                    <h3 className="mb-0 me-3">{formData.username}</h3>
                    <VerifiedBadge 
                      isVerified={membership?.is_active} 
                      size="md" 
                      showText={true} 
                    />
                  </div>
                  <p className="text-muted mb-2">{formData.email}</p>
                  <p className="mb-3">{formData.bio}</p>
                  
                  {/* Profile Stats */}
                  <Row className="text-center">
                    <Col xs={4}>
                      <div className="h5 mb-0">{profileStats.totalListings || 0}</div>
                      <small className="text-muted">Listings</small>
                    </Col>
                    <Col xs={4}>
                      <div className="h5 mb-0">{profileStats.completedTrades || 0}</div>
                      <small className="text-muted">Trades</small>
                    </Col>
                    <Col xs={4}>
                      <div className="h5 mb-0">{profileStats.rating ? `${profileStats.rating.toFixed(1)}⭐` : 'N/A'}</div>
                      <small className="text-muted">Rating</small>
                    </Col>
                  </Row>
                </Col>
                <Col md={3} className="text-end">
                  {!membership?.is_active && (
                    <Button 
                      variant="primary" 
                      onClick={() => setShowMembershipModal(true)}
                    >
                      <i className="fas fa-check-circle me-1"></i>
                      Get Verified
                    </Button>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Profile Tabs */}
          <Card>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                
                {/* Profile Settings Tab */}
                <Tab eventKey="profile" title="Profile Settings">
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="(555) 123-4567"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="zipcode"
                            value={formData.zipcode}
                            onChange={handleInputChange}
                            placeholder="12345"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, State"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" disabled={userLoading}>
                      {userLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Form>
                </Tab>

                {/* Preferences Tab */}
                <Tab eventKey="preferences" title="Preferences">
                  <Form>
                    <Form.Group className="mb-4">
                      <Form.Label>Preferred Categories</Form.Label>
                      <div className="d-flex flex-wrap gap-2">
                        {categories.map(category => (
                          <Badge
                            key={category}
                            bg={formData.preferredCategories.includes(category) ? 'primary' : 'outline-secondary'}
                            className="p-2"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCategoryToggle(category)}
                          >
                            {category}
                          </Badge>
                        ))}
                      </div>
                      <Form.Text className="text-muted">
                        Select categories you're interested in for personalized recommendations
                      </Form.Text>
                    </Form.Group>

                    <h5>Notification Settings</h5>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="email-notifications"
                        label="Email notifications"
                        checked={formData.notifications.email}
                        onChange={(e) => handleNotificationChange('email', e.target.checked)}
                      />
                      <Form.Check
                        type="checkbox"
                        id="push-notifications"
                        label="Push notifications"
                        checked={formData.notifications.push}
                        onChange={(e) => handleNotificationChange('push', e.target.checked)}
                      />
                      <Form.Check
                        type="checkbox"
                        id="sms-notifications"
                        label="SMS notifications"
                        checked={formData.notifications.sms}
                        onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                      />
                      <Form.Check
                        type="checkbox"
                        id="marketing-notifications"
                        label="Marketing emails"
                        checked={formData.notifications.marketing}
                        onChange={(e) => handleNotificationChange('marketing', e.target.checked)}
                      />
                    </Form.Group>

                    <Button variant="primary" onClick={handleSubmit}>
                      Save Preferences
                    </Button>
                  </Form>
                </Tab>

                {/* Activity Tab */}
                <Tab eventKey="activity" title="Recent Activity">
                  {recentActivity.length > 0 ? (
                    <div>
                      {recentActivity.map((activity, index) => (
                        <Card key={index} className="mb-3">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{activity.title}</h6>
                                <p className="text-muted small mb-1">{activity.description}</p>
                                <small className="text-muted">{activity.timestamp}</small>
                              </div>
                              <Badge bg={activity.type === 'trade' ? 'success' : 'primary'}>
                                {activity.type}
                              </Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-history fa-3x text-muted mb-3"></i>
                      <h5>No recent activity</h5>
                      <p className="text-muted">Your recent trades and activity will appear here</p>
                    </div>
                  )}
                </Tab>

                {/* Account Tab */}
                <Tab eventKey="account" title="Account">
                  <Alert variant="info" className="mb-4">
                    <h6>Account Information</h6>
                    <p className="mb-2"><strong>Member since:</strong> {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Unknown'}</p>
                    <p className="mb-2"><strong>Account Status:</strong> {membership?.is_active ? 'Verified Human' : 'Standard'}</p>
                    <p className="mb-0"><strong>Total Trades:</strong> {profileStats.completedTrades || 0}</p>
                  </Alert>

                  <h5 className="text-danger">Danger Zone</h5>
                  <Card className="border-danger">
                    <Card.Body>
                      <h6>Delete Account</h6>
                      <p className="text-muted">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button 
                        variant="outline-danger" 
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Account
                      </Button>
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Delete Account Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Warning:</strong> This action is permanent and cannot be undone.
          </Alert>
          <p>Are you sure you want to delete your account? All your listings, messages, and trade history will be permanently removed.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Membership Modal */}
      <MembershipModal
        show={showMembershipModal}
        onHide={() => setShowMembershipModal(false)}
        onMembershipUpdate={loadMembership}
      />
    </Container>
  );
};

export default UserProfile;