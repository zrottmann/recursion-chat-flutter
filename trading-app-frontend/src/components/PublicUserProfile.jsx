import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Table, Spinner, Alert } from 'react-bootstrap';
import api from '../services/api';
import './PublicUserProfile.css';

const PublicUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(state => state.user.userInfo);
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile
      const userResponse = await api.get(`/users/${userId}`);
      setUser(userResponse.data);
      
      // Fetch user's listings
      const listingsResponse = await api.get(`/users/${userId}/listings`);
      setListings(listingsResponse.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleMessageUser = () => {
    navigate(`/messages/${userId}`);
  };

  const handleViewListing = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">User not found</Alert>
      </Container>
    );
  }

  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

  return (
    <Container className="public-user-profile mt-4">
      <Row>
        <Col md={4}>
          <Card className="user-info-card">
            <Card.Body>
              <div className="text-center mb-4">
                <div className="user-avatar mb-3">
                  {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                </div>
                <h3>{user.username || 'Unknown User'}</h3>
                {user.bio && <p className="text-muted">{user.bio}</p>}
                <p className="text-muted">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {!isOwnProfile && (
                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleMessageUser}
                  >
                    <i className="bi bi-chat-dots-fill me-2"></i>
                    Message User
                  </Button>
                </div>
              )}
              
              {isOwnProfile && (
                <div className="d-grid">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/profile')}
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Header>
              <h4>Listings ({listings.length})</h4>
            </Card.Header>
            <Card.Body>
              {listings.length === 0 ? (
                <p className="text-muted text-center">No listings yet</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Posted</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map(listing => (
                      <tr key={(listing.$id || listing.id)}>
                        <td>{listing.title}</td>
                        <td>{listing.category}</td>
                        <td>${listing.price}</td>
                        <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewListing((listing.$id || listing.id))}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PublicUserProfile;