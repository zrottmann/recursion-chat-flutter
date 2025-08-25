import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Alert, Spinner, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import api from '../services/api';

// Stripe Elements styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Payment form component (inside Elements wrapper)
const PaymentForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await api.post('/payments/create-payment-intent', {
          membership_type: 'verified_human',
          amount_cents: 500, // $5.00
          currency: 'usd'
        });
        
        setPaymentIntent(response.data);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError('Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, [onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      onError('Payment system not ready. Please wait and try again.');
      return;
    }

    setProcessing(true);

    const card = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: card,
            billing_details: {
              // Add user details if available
            },
          }
        }
      );

      if (error) {
        console.error('Payment failed:', error);
        onError(error.message || 'Payment failed. Please try again.');
      } else if (confirmedIntent.status === 'succeeded') {
        // Payment succeeded - membership will be activated via webhook
        onSuccess({
          payment_intent_id: confirmedIntent.id,
          amount: confirmedIntent.amount / 100 // Convert cents to dollars
        });
      } else {
        onError('Payment was not completed. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected payment error:', error);
      onError('An unexpected error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!paymentIntent) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading payment form...</span>
        </Spinner>
        <p className="mt-2 text-muted">Preparing secure payment...</p>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-4">
        <h5 className="mb-3">Payment Information</h5>
        
        {/* Security badges */}
        <div className="d-flex justify-content-center mb-3">
          <small className="text-muted d-flex align-items-center">
            <i className="fas fa-shield-alt text-success me-1"></i>
            256-bit SSL Encryption
            <span className="mx-2">•</span>
            <i className="fas fa-lock text-success me-1"></i>
            PCI Compliant
          </small>
        </div>
        
        {/* Stripe Card Element */}
        <div className="border rounded p-3 bg-light">
          <CardElement options={cardElementOptions} />
        </div>
        
        <small className="text-muted mt-2 d-block">
          Your payment information is encrypted and processed securely by Stripe.
          We never store your card details.
        </small>
      </div>

      {/* Payment summary */}
      <Alert variant="info" className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Verified Human Membership</h6>
            <small>Billed monthly • Cancel anytime</small>
          </div>
          <div className="text-end">
            <h5 className="mb-0 text-success">${paymentIntent.amount_cents / 100}</h5>
          </div>
        </div>
      </Alert>

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-100"
        disabled={!stripe || processing}
      >
        {processing ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <i className="fas fa-credit-card me-2"></i>
            Complete Payment ($5.00)
          </>
        )}
      </Button>
    </Form>
  );
};

// Main modal component
const SecurePaymentModal = ({ show, onHide, onMembershipUpdate }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Initialize Stripe when modal opens
  useEffect(() => {
    if (show && !stripePromise) {
      const initializeStripe = async () => {
        try {
          // Get publishable key from backend
          const response = await api.post('/payments/create-payment-intent', {
            membership_type: 'verified_human',
            amount_cents: 500
          });
          
          const stripe = await loadStripe(response.data.publishable_key);
          setStripePromise(stripe);
        } catch (error) {
          console.error('Error initializing Stripe:', error);
          toast.error('Failed to initialize payment system');
        }
      };

      initializeStripe();
    }
  }, [show, stripePromise]);

  const handlePaymentSuccess = async (paymentData) => {
    setPaymentSuccess(true);
    setVerifyingPayment(true);

    // Wait for webhook to process and activate membership
    // Poll for membership status
    let attempts = 0;
    const maxAttempts = 10; // Wait up to 30 seconds
    
    const checkMembershipStatus = async () => {
      try {
        const response = await api.get('/payments/subscription-status');
        
        if (response.data.is_active && response.data.payment_verified) {
          setVerifyingPayment(false);
          toast.success('🎉 Payment successful! Your Verified Human membership is now active.');
          
          if (onMembershipUpdate) {
            onMembershipUpdate();
          }
          
          // Close modal after short delay
          setTimeout(() => {
            onHide();
            setPaymentSuccess(false);
          }, 2000);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkMembershipStatus, 3000); // Check again in 3 seconds
        } else {
          setVerifyingPayment(false);
          toast.warning('Payment processed but membership activation is taking longer than expected. Please refresh the page.');
        }
      } catch (error) {
        console.error('Error checking membership status:', error);
        setVerifyingPayment(false);
        toast.error('Payment processed but there was an error activating your membership. Please contact support.');
      }
    };

    // Start checking after 2 seconds to allow webhook processing
    setTimeout(checkMembershipStatus, 2000);
  };

  const handlePaymentError = (errorMessage) => {
    toast.error(errorMessage);
  };

  const handleClose = () => {
    if (!verifyingPayment) {
      onHide();
      setPaymentSuccess(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop={verifyingPayment ? 'static' : true}>
      <Modal.Header closeButton={!verifyingPayment}>
        <Modal.Title>
          <i className="fas fa-check-circle text-primary me-2"></i>
          {paymentSuccess ? 'Payment Processing...' : 'Secure Payment'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {paymentSuccess ? (
          // Success state - show verification in progress
          <div className="text-center py-4">
            <div className="mb-4">
              <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            
            <h4 className="text-success mb-3">Payment Successful!</h4>
            
            {verifyingPayment ? (
              <>
                <div className="mb-3">
                  <Spinner animation="border" variant="primary" />
                </div>
                <p className="text-muted">
                  Activating your Verified Human membership...<br/>
                  This may take a few moments.
                </p>
              </>
            ) : (
              <p className="text-success">Your membership is now active!</p>
            )}
          </div>
        ) : (
          // Payment form
          <Card className="border-0">
            <Card.Body>
              {/* Benefits reminder */}
              <Alert variant="info" className="mb-4">
                <h6><i className="fas fa-star me-2"></i>Verified Human Benefits:</h6>
                <ul className="mb-0 text-start">
                  <li><strong>Verified Badge</strong> - Blue checkmark on your profile</li>
                  <li><strong>AI Match Priority</strong> - Higher ranking in trade matches</li>
                  <li><strong>Trust Signal</strong> - Build credibility with other users</li>
                  <li><strong>Enhanced Security</strong> - Reduces spam and fake accounts</li>
                </ul>
              </Alert>

              {/* Payment form */}
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              ) : (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2 text-muted">Initializing secure payment system...</p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Modal.Body>
      
      {!paymentSuccess && (
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={handleClose}>
            Cancel
          </Button>
          <div className="text-end">
            <small className="text-muted d-block">
              <i className="fas fa-shield-alt me-1"></i>
              Powered by Stripe • Secure & PCI Compliant
            </small>
          </div>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default SecurePaymentModal;