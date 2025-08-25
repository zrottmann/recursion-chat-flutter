import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { addFakeListings } from '../utils/addFakeListings';

const AddFakeListingsButton = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAddFakeListings = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('🎬 Starting to add fake listings...');
      const response = await addFakeListings();
      
      if (response.success) {
        setResult(`Successfully added ${response.created} listings!`);
        // Refresh the page after 2 seconds to show new listings
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setError(response.error || 'Failed to add listings');
      }
    } catch (err) {
      console.error('Error adding fake listings:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3">
      <Button 
        variant="warning" 
        onClick={handleAddFakeListings}
        disabled={loading}
        className="d-flex align-items-center gap-2"
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" />
            Adding Fake Listings...
          </>
        ) : (
          <>
            <i className="fas fa-magic"></i>
            Add Sample Listings
          </>
        )}
      </Button>
      
      {result && (
        <Alert variant="success" className="mt-2">
          <i className="fas fa-check-circle me-2"></i>
          {result}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mt-2">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
    </div>
  );
};

export default AddFakeListingsButton;