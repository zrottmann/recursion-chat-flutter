import React, { useState } from 'react';
import { Modal, Button, Card, Alert } from 'react-bootstrap';
import SecurePaymentModal from './SecurePaymentModal';

const MembershipModal = ({ show, onHide, onMembershipUpdate }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSubscribe = () => {
    // Close membership info modal and open secure payment modal
    onHide();
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    if (onMembershipUpdate) {
      onMembershipUpdate();
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setShowPaymentModal(false);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-check-circle text-primary me-2"></i>
          Verified Human Membership
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="border-primary">
          <Card.Body className="text-center">
            <div className="mb-4">
              <i className="fas fa-shield-alt text-primary" style={{ fontSize: '3rem' }}></i>
            </div>
            
            <h4 className="text-primary mb-3">Get Verified Human Status</h4>
            
            <div className="mb-4">
              <h2 className="text-success mb-1">$5<small className="text-muted">/month</small></h2>
              <p className="text-muted">Billed monthly, cancel anytime</p>
            </div>

            <Alert variant="info" className="text-start">
              <h6><i className="fas fa-star me-2"></i>Premium Benefits:</h6>
              <ul className="mb-0">
                <li><strong>Verified Badge</strong> - Blue checkmark on your profile</li>
                <li><strong>AI Match Priority</strong> - Higher ranking in trade matches</li>
                <li><strong>Trust Signal</strong> - Build credibility with other users</li>
                <li><strong>Human Verification</strong> - Reduces spam and fake accounts</li>
                <li><strong>Community Status</strong> - Join the verified trader community</li>
              </ul>
            </Alert>

            <div className="mb-3">
              <small className="text-muted">
                <i className="fas fa-lock me-1"></i>
                Secure payment processing • Cancel anytime in settings
              </small>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={onHide}>
          Maybe Later
        </Button>
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleSubscribe}
          className="px-4"
        >
          <i className="fas fa-credit-card me-2"></i>
          Continue to Secure Payment
        </Button>
      </Modal.Footer>
      </Modal>

      {/* Secure Payment Modal */}
      <SecurePaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        membershipType="verified_human"
        amount={5.00}
        title="Verified Human Membership"
        description="Monthly subscription for verified human status with premium features"
      />
    </>
  );
};

export default MembershipModal;