import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import api from '../services/api';

const ReviewDetail = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [reviewedUser, setReviewedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReviewDetail();
  }, [reviewId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReviewDetail = async () => {
    try {
      const response = await api.get(`/reviews/${reviewId}`);
      setReview(response.data);
      
      // Load the reviewed user's info
      const userResponse = await api.get(`/users/${response.data.reviewed_user_id}`);
      setReviewedUser(userResponse.data);
      
      setError(null);
    } catch (error) {
      console.error('Error loading review detail:', error);
      setError('Review not found');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'danger';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Loading review...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <h4>Error</h4>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8} className="mx-auto">
          {/* Header */}
          <div className="d-flex align-items-center mb-4">
            <Button
              variant="outline-secondary"
              onClick={() => navigate(-1)}
              className="me-3"
            >
              <i className="fas fa-arrow-left"></i> Back
            </Button>
            <h2 className="mb-0">Review Detail</h2>
          </div>

          {/* Review Card */}
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {/* Review Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <h5 className="mb-2">
                    Review for{' '}
                    <Button
                      variant="link"
                      className="p-0 text-decoration-none"
                      onClick={() => navigate(`/users/${reviewedUser.id}`)}
                    >
                      {reviewedUser?.username}
                    </Button>
                  </h5>
                  <small className="text-muted">
                    By {review.reviewer_name} • {formatDate(review.created_at)}
                  </small>
                </div>
                <Badge bg="secondary">{review.transaction_type}</Badge>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <div className={`h2 text-${getRatingColor(review.rating)} mb-2`}>
                  {renderStars(review.rating)}
                </div>
                <p className="text-muted mb-0">
                  {review.rating} out of 5 stars
                </p>
              </div>

              {/* Review Comment */}
              <div className="mb-4">
                <h6>Review:</h6>
                <div className="bg-light p-3 rounded">
                  <p className="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {review.comment}
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(`/users/${reviewedUser.id}`)}
                >
                  View {reviewedUser?.username}'s Profile
                </Button>
                <small className="text-muted">
                  Review ID: #{review.id}
                </small>
              </div>
            </Card.Body>
          </Card>

          {/* Related Actions */}
          <div className="mt-4 text-center">
            <p className="text-muted mb-3">
              Want to see more reviews for {reviewedUser?.username}?
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/users/${reviewedUser.id}?tab=reviews`)}
            >
              View All Reviews
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ReviewDetail;