import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const UserReviews = ({ userId, userName }) => {
  const { currentUser } = useSelector(state => state.user);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    transaction_type: 'purchase'
  });

  useEffect(() => {
    loadUserReviews();
    loadReviewStats();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserReviews = async () => {
    try {
      const response = await api.get(`/users/${userId}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reviewData = {
        reviewed_user_id: parseInt(userId),
        rating: parseInt(newReview.rating),
        comment: newReview.comment.trim(),
        transaction_type: newReview.transaction_type
      };

      await api.post('/reviews', reviewData);
      toast.success('Review submitted successfully!');
      
      // Reset form and close modal
      setNewReview({ rating: 5, comment: '', transaction_type: 'purchase' });
      setShowReviewModal(false);
      
      // Reload reviews
      await loadUserReviews();
      await loadReviewStats();
      
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="mt-2">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="user-reviews">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>User Reviews</h4>
        {currentUser && currentUser.id !== parseInt(userId) && (
          <Button 
            variant="primary" 
            onClick={() => setShowReviewModal(true)}
          >
            Write Review
          </Button>
        )}
      </div>

      {reviewStats && (
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={3} className="text-center">
                <h2 className="mb-0">{reviewStats.average_rating}</h2>
                <div className="text-warning h5">
                  {renderStars(Math.round(reviewStats.average_rating))}
                </div>
                <small className="text-muted">
                  {reviewStats.total_reviews} review{reviewStats.total_reviews !== 1 ? 's' : ''}
                </small>
              </Col>
              <Col md={9}>
                <h6>Rating Breakdown</h6>
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="d-flex align-items-center mb-1">
                    <span className="me-2" style={{ width: '60px' }}>
                      {star} {renderStars(star).charAt(0)}
                    </span>
                    <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                      <div 
                        className={`progress-bar bg-${getRatingColor(star)}`}
                        style={{ 
                          width: `${reviewStats.total_reviews > 0 
                            ? (reviewStats.rating_breakdown[star] / reviewStats.total_reviews) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <small className="text-muted" style={{ width: '40px' }}>
                      ({reviewStats.rating_breakdown[star]})
                    </small>
                  </div>
                ))}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {reviews.length === 0 ? (
        <Alert variant="info" className="text-center">
          <h5>No reviews yet</h5>
          <p className="mb-0">Be the first to review {userName}!</p>
        </Alert>
      ) : (
        <div>
          {reviews.map(review => (
            <Card 
              key={review.id} 
              className="mb-3 review-card" 
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
              onClick={() => navigate(`/reviews/${review.id}`)}
            >
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className={`text-${getRatingColor(review.rating)} h5 me-2`}>
                        {renderStars(review.rating)}
                      </span>
                      <Badge bg="secondary" className="me-2">
                        {review.transaction_type}
                      </Badge>
                    </div>
                    <p className="mb-2">
                      {review.comment.length > 150 
                        ? `${review.comment.substring(0, 150)}...` 
                        : review.comment
                      }
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        By {review.reviewer_name} • {formatDate(review.created_at)}
                      </small>
                      <small className="text-primary">
                        Click to read full review <i className="fas fa-arrow-right"></i>
                      </small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Write Review for {userName}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitReview}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <Form.Select
                value={newReview.rating}
                onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
                required
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Poor</option>
                <option value={1}>1 Star - Terrible</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Transaction Type</Form.Label>
              <Form.Select
                value={newReview.transaction_type}
                onChange={(e) => setNewReview({...newReview, transaction_type: e.target.value})}
                required
              >
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="trade">Trade</option>
                <option value="service">Service</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Review</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                placeholder="Share your experience..."
                required
                minLength={10}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {newReview.comment.length}/500 characters
              </Form.Text>
            </Form.Group>

            <Alert variant="info" className="small">
              <i className="fas fa-info-circle me-2"></i>
              Your review will be posted anonymously to protect your privacy.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting || !newReview.comment.trim()}
            >
              {submitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default UserReviews;