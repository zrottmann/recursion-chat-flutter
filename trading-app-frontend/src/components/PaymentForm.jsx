import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, Button, Form, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { CreditCard, Shield, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Load Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_...');

const PAYMENT_TYPES = {
  membership: {
    name: 'Verified Human Membership',
    price: 4.99,
    description: 'Unlock AI features, priority support, and verified badges',
    features: [
      'AI Photo Mode for instant listings',
      'Advanced market analytics',
      'Priority customer support',
      'Verified Human badge',
      'No transaction fees for first 10 trades'
    ]
  },
  escrow: {
    name: 'Secure Trade Escrow',
    description: 'Professional escrow service for high-value trades',
    features: [
      'Secure payment holding',
      'Dispute resolution service',
      'Identity verification',
      'Shipping tracking integration',
      'Full refund protection'
    ]
  },
  featured: {
    name: 'Featured Listing',
    price: 2.99,
    description: 'Boost your listing visibility',
    features: [
      'Top of search results for 7 days',
      'Highlighted border and badge',
      '3x more views on average',
      'Mobile push notifications',
      'Social media auto-sharing'
    ]
  }
};

const CheckoutForm = ({ paymentType, amount, onSuccess, onError, metadata = {} }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [billingDetails, setBillingDetails] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: {
      line1: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'US'
    }
  });

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [amount, paymentType]);

  const createPaymentIntent = async () => {
    try {
      const response = await api.post('/api/payments/create-intent', {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_type: paymentType,
        metadata: {
          user_id: user?.id,
          ...metadata
        }
      });
      
      setClientSecret(response.data.client_secret);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      setError('Failed to initialize payment. Please try again.');
      onError?.(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: billingDetails
        }
      });

      if (error) {
        setError(error.message);
        onError?.(error);
      } else {
        setSucceeded(true);
        toast.success('Payment completed successfully!');
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      onError?.(err);
    }

    setProcessing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setBillingDetails(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setBillingDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (succeeded) {
    return (
      <Alert variant="success" className="text-center">
        <CheckCircle size={48} className="text-success mb-3" />
        <h5>Payment Successful!</h5>
        <p>Your payment has been processed successfully.</p>
      </Alert>
    );
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Billing Information */}
      <Card className="mb-3">
        <Card.Header>
          <h6 className="mb-0">
            <CreditCard className="me-2" size={20} />
            Billing Information
          </h6>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={billingDetails.name}
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
                  value={billingDetails.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control
              type="text"
              name="address.line1"
              value={billingDetails.address.line1}
              onChange={handleInputChange}
              placeholder="Street address"
              required
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="address.city"
                  value={billingDetails.address.city}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  name="address.state"
                  value={billingDetails.address.state}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>ZIP Code</Form.Label>
                <Form.Control
                  type="text"
                  name="address.postal_code"
                  value={billingDetails.address.postal_code}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Payment Method */}
      <Card className="mb-3">
        <Card.Header>
          <h6 className="mb-0">
            <Lock className="me-2" size={20} />
            Payment Method
          </h6>
        </Card.Header>
        <Card.Body>
          <div className="card-element-container p-3 border rounded">
            <CardElement
              options={{
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
              }}
            />
          </div>
          
          <div className="d-flex align-items-center mt-3 text-muted">
            <Shield size={16} className="me-2" />
            <small>Your payment information is encrypted and secure</small>
          </div>
        </Card.Body>
      </Card>

      {/* Submit Button */}
      <div className="d-grid">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!stripe || processing || !clientSecret}
        >
          {processing ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>

      <div className="text-center mt-3">
        <small className="text-muted">
          Powered by Stripe • 256-bit SSL encryption
        </small>
      </div>
    </Form>
  );
};

const PaymentForm = ({ paymentType, amount, onSuccess, onError, onCancel, metadata }) => {
  const paymentConfig = PAYMENT_TYPES[paymentType];

  if (!paymentConfig) {
    return (
      <Alert variant="danger">
        Invalid payment type specified.
      </Alert>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Complete Payment</h5>
            <Button variant="outline-secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Payment Summary */}
          <Card className="mb-4 bg-light">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="mb-1">{paymentConfig.name}</h6>
                  <p className="text-muted mb-0">{paymentConfig.description}</p>
                </div>
                <div className="text-end">
                  <h4 className="mb-0 text-primary">
                    ${amount ? amount.toFixed(2) : paymentConfig.price?.toFixed(2)}
                  </h4>
                  {paymentType === 'membership' && (
                    <Badge bg="success">One-time payment</Badge>
                  )}
                </div>
              </div>

              {paymentConfig.features && (
                <div>
                  <small className="text-muted fw-bold">Includes:</small>
                  <ul className="small mb-0 mt-1">
                    {paymentConfig.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Checkout Form */}
          <CheckoutForm
            paymentType={paymentType}
            amount={amount || paymentConfig.price}
            onSuccess={onSuccess}
            onError={onError}
            metadata={metadata}
          />
        </Card.Body>
      </Card>
    </Elements>
  );
};

export default PaymentForm;