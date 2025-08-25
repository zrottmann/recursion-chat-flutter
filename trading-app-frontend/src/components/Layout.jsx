import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../store/slices/userSlice';
import MembershipModal from './MembershipModal';
import VerifiedBadge from './VerifiedBadge';
import NotificationCenter from './NotificationCenter';
import api from '../services/api';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membership, setMembership] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadMembership();
    }
  }, [isAuthenticated]);

  const loadMembership = async () => {
    try {
      const response = await api.get('/memberships/my-membership');
      setMembership(response.data);
    } catch (error) {
      console.error('Error loading membership:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="white" expand="lg" className="border-bottom">
        <Container fluid>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary fs-4 btn-animated">
            <i className="fas fa-store icon-float me-2"></i>Trading Post
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav>
              {isAuthenticated && (
                <>
                  {/* Moved buttons to left side as requested */}
                  {!membership?.is_active && (
                    <Button 
                      variant="warning" 
                      size="sm" 
                      className="me-2 btn-animated btn-glow-warning"
                      onClick={() => setShowMembershipModal(true)}
                      style={{ fontWeight: 'bold', fontSize: '0.8rem' }}
                      title="Get Verified"
                    >
                      <i className="fas fa-check-circle icon-animated"></i>
                      <span className="d-none d-md-inline ms-1">Get Verified</span>
                    </Button>
                  )}
                  <Nav.Link as={Link} to="/listings/new" className="btn btn-primary btn-sm me-2 btn-animated btn-glow-primary" title="Sell">
                    <i className="fas fa-plus icon-animated"></i>
                    <span className="d-none d-md-inline ms-1">Sell</span>
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="mx-auto">
              {isAuthenticated && (
                <>
                  <Nav.Link as={Link} to="/" className="mx-2 btn-animated" title="Marketplace">
                    <i className="fas fa-store icon-animated"></i>
                    <span className="d-none d-lg-inline ms-1">Marketplace</span>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/map" className="mx-2 btn-animated" title="Map View">
                    <i className="fas fa-map icon-animated"></i>
                    <span className="d-none d-lg-inline ms-1">Map View</span>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/matches" className="mx-2 btn-animated" title="AI Matches">
                    <i className="fas fa-robot icon-spin"></i>
                    <span className="d-none d-lg-inline ms-1">AI Matches</span>
                  </Nav.Link>
                  <Nav.Link as={Link} to="/messages" className="mx-2 btn-animated" title="Messages">
                    <i className="fas fa-comments icon-bounce"></i>
                    <span className="d-none d-lg-inline ms-1">Messages</span>
                  </Nav.Link>
                </>
              )}
            </Nav>
            <Nav className="d-flex align-items-center">
              {isAuthenticated ? (
                <>
                  {/* Notification Center */}
                  <div className="me-3">
                    <NotificationCenter />
                  </div>
                  
                  {/* Username section with more space and better alignment */}
                  <Nav.Link 
                    as={Link} 
                    to="/profile" 
                    className="btn-animated d-flex align-items-center me-2"
                    style={{ 
                      textDecoration: 'none',
                      minWidth: 'fit-content',
                      whiteSpace: 'nowrap'
                    }}
                    title="Profile"
                  >
                    <i className="fas fa-user-circle"></i>
                    <span className="d-none d-sm-inline ms-1 fw-semibold">{user?.username || 'User'}</span>
                    {membership?.is_active && (
                      <VerifiedBadge isVerified={true} size="sm" className="ms-1" />
                    )}
                  </Nav.Link>
                  
                  {/* Logout button with improved spacing */}
                  <Nav.Link 
                    onClick={handleLogout}
                    className="btn btn-outline-danger btn-sm btn-animated"
                    style={{ 
                      cursor: 'pointer',
                      textDecoration: 'none',
                      minWidth: 'fit-content'
                    }}
                    title="Logout"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="d-none d-sm-inline ms-1">Logout</span>
                  </Nav.Link>
                </>
              ) : (
                <Nav.Link as={Link} to="/login" className="btn btn-primary">Login</Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main>{children}</main>
      
      {/* Membership Modal */}
      <MembershipModal
        show={showMembershipModal}
        onHide={() => setShowMembershipModal(false)}
        onMembershipUpdate={() => {
          loadMembership();
          setShowMembershipModal(false);
        }}
      />
    </>
  );
};

export default Layout;