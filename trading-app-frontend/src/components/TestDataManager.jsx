import React, { useState } from 'react';
import { Button, Card, Alert, Spinner, Badge, Row, Col, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { addTestItems, clearTestItems } from '../utils/addTestItems';
import { createDemoUsersAndItems, cleanupDemoData } from '../utils/createDemoUsers';
import databaseSeeder from '../services/databaseSeeder';
import sampleDataCreator from '../utils/sampleDataCreator';
import { toast } from 'react-toastify';

const TestDataManager = () => {
  const { currentUser } = useSelector(state => state.user);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showManager, setShowManager] = useState(false);
  const [seedingOptions, setSeedingOptions] = useState({
    includeUsers: true,
    includeItems: true,
    includeWants: true,
    includeTrades: true,
    includeMessages: true,
    includeMatches: true,
    includeNotifications: true,
    includeSavedItems: true,
    userCount: 6,
    itemsPerUser: 4,
    wantsPerUser: 2
  });
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const handleAddTestItems = async () => {
    if (!currentUser?.$id) {
      toast.error('Please log in first to add test items');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Adding test items for user:', currentUser.$id);
      const result = await addTestItems(currentUser.$id);
      
      if (result.success) {
        toast.success(`Successfully added ${result.itemsAdded} test items!`);
        setResult({
          type: 'success',
          message: `Added ${result.itemsAdded} test marketplace items`
        });
        
        // Refresh the page after 2 seconds to show new items
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to add test items');
        setResult({
          type: 'error',
          message: 'Failed to add test items',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Error adding test items:', error);
      toast.error('Error adding test items: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearTestItems = async () => {
    if (!currentUser?.$id) {
      toast.error('Please log in first');
      return;
    }
    
    if (!window.confirm('Are you sure you want to clear all test items?')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const success = await clearTestItems(currentUser.$id);
      
      if (success) {
        toast.success('Successfully cleared test items!');
        setResult({
          type: 'success',
          message: 'Cleared all test items'
        });
        
        // Refresh the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Failed to clear test items');
        setResult({
          type: 'error',
          message: 'Failed to clear test items'
        });
      }
    } catch (error) {
      console.error('Error clearing test items:', error);
      toast.error('Error clearing test items: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoUsers = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Creating demo users and items...');
      const result = await createDemoUsersAndItems();
      
      if (result.success) {
        toast.success(`Successfully created ${result.users.length} demo users with ${result.items.length} items!`);
        setResult({
          type: 'success',
          message: `Created ${result.users.length} demo users with ${result.items.length} total items`
        });
        
        // Refresh the page after 3 seconds to show new data
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error('Failed to create demo users');
        setResult({
          type: 'error',
          message: 'Failed to create demo users'
        });
      }
    } catch (error) {
      console.error('Error creating demo users:', error);
      toast.error('Error creating demo users: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupDemoData = async () => {
    if (!window.confirm('This will delete ALL demo users and their items. Are you sure?')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Cleaning up demo data...');
      const success = await cleanupDemoData();
      
      if (success) {
        toast.success('Successfully cleaned up all demo data!');
        setResult({
          type: 'success',
          message: 'All demo data has been cleaned up'
        });
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Failed to cleanup demo data');
        setResult({
          type: 'error',
          message: 'Failed to cleanup demo data'
        });
      }
    } catch (error) {
      console.error('Error cleaning up demo data:', error);
      toast.error('Error cleaning up demo data: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComprehensiveSeed = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🌱 Starting comprehensive database seeding...');
      const result = await databaseSeeder.seedDatabase(seedingOptions);
      
      if (result.success) {
        toast.success(`Successfully seeded database! Created ${result.summary.total} records.`);
        setResult({
          type: 'success',
          message: `Comprehensive seed completed: ${result.summary.total} total records`,
          summary: result.summary
        });
        
        // Refresh the page after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error('Failed to seed database: ' + result.error);
        setResult({
          type: 'error',
          message: 'Failed to seed database: ' + result.error
        });
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Error seeding database: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSampleDataCreation = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🎯 Creating sample data...');
      const result = await sampleDataCreator.createAllSampleData();
      
      if (result.success) {
        toast.success(`Successfully created sample data! Total: ${result.summary.total} records.`);
        setResult({
          type: 'success',
          message: `Sample data created: ${result.summary.total} records`,
          summary: result.summary
        });
        
        // Refresh the page after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error('Failed to create sample data: ' + result.error);
        setResult({
          type: 'error',
          message: 'Failed to create sample data: ' + result.error
        });
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast.error('Error creating sample data: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComprehensiveCleanup = async () => {
    if (!window.confirm('This will delete ALL seeded test data including users, items, trades, messages, etc. Are you sure?')) {
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🧹 Comprehensive cleanup...');
      
      // Try multiple cleanup methods
      const results = await Promise.allSettled([
        databaseSeeder.cleanup(),
        cleanupDemoData(),
        currentUser?.$id ? clearTestItems(currentUser.$id) : Promise.resolve(true)
      ]);

      const successfulCleanups = results.filter(r => 
        r.status === 'fulfilled' && r.value !== false && r.value?.success !== false
      ).length;
      
      if (successfulCleanups > 0) {
        toast.success(`Cleanup completed! ${successfulCleanups}/${results.length} operations successful.`);
        setResult({
          type: 'success',
          message: `Comprehensive cleanup completed: ${successfulCleanups}/${results.length} operations successful`
        });
        
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Cleanup failed');
        setResult({
          type: 'error',
          message: 'Cleanup operations failed'
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast.error('Error during cleanup: ' + error.message);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle button to show/hide the manager
  if (!showManager) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999
        }}
      >
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setShowManager(true)}
          title="Test Data Manager (Dev Only)"
        >
          🧪 Test Data
        </Button>
      </div>
    );
  }
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '350px'
      }}
    >
      <Card className="shadow-lg">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <Badge bg="warning" className="me-2">DEV</Badge>
            Test Data Manager
          </span>
          <Button
            variant="close"
            size="sm"
            onClick={() => setShowManager(false)}
          />
        </Card.Header>
        <Card.Body>
          {!currentUser ? (
            <Alert variant="warning">
              Please log in first to manage test data
            </Alert>
          ) : (
            <>
              <p className="small text-muted mb-3">
                Create comprehensive test data for complete Trading Post testing experience.
              </p>

              {/* Seeding Options */}
              <div className="mb-3 p-2 bg-light rounded">
                <div className="small text-muted mb-2">
                  <strong>⚙️ Seeding Options</strong>
                </div>
                <Row className="g-1">
                  <Col xs={6}>
                    <Form.Control
                      size="sm"
                      type="number"
                      min="1"
                      max="20"
                      value={seedingOptions.userCount}
                      onChange={(e) => setSeedingOptions(prev => ({...prev, userCount: parseInt(e.target.value)}))}
                      placeholder="Users"
                    />
                    <small className="text-muted">Users</small>
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      size="sm"
                      type="number"
                      min="1"
                      max="10"
                      value={seedingOptions.itemsPerUser}
                      onChange={(e) => setSeedingOptions(prev => ({...prev, itemsPerUser: parseInt(e.target.value)}))}
                      placeholder="Items/User"
                    />
                    <small className="text-muted">Items/User</small>
                  </Col>
                </Row>
              </div>
              
              <Row className="g-2">
                <Col xs={12}>
                  <div className="small text-muted mb-2">
                    <strong>🌱 Comprehensive Seeding</strong>
                  </div>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleComprehensiveSeed}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>🌱 Full Seed</>
                    )}
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={handleSampleDataCreation}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>🎯 Sample Data</>
                    )}
                  </Button>
                </Col>
                
                <Col xs={12}>
                  <hr className="my-2" />
                  <div className="small text-muted mb-2">
                    <strong>🎭 Legacy Demo Data</strong>
                  </div>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateDemoUsers}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>👥 Demo Users</>
                    )}
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleAddTestItems}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>➕ My Items</>
                    )}
                  </Button>
                </Col>
                
                <Col xs={12}>
                  <hr className="my-2" />
                  <div className="small text-muted mb-2">
                    <strong>🧹 Cleanup Options</strong>
                  </div>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleComprehensiveCleanup}
                    disabled={loading}
                    className="w-100"
                  >
                    🧹 Full Cleanup
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClearTestItems}
                    disabled={loading}
                    className="w-100"
                  >
                    🗑️ Clear Items
                  </Button>
                </Col>
              </Row>
              
              {result && (
                <Alert 
                  variant={result.type === 'success' ? 'success' : 'danger'}
                  className="mt-3 mb-0"
                >
                  {result.message}
                  
                  {result.summary && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <strong>Created:</strong>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {result.summary.users > 0 && <Badge bg="secondary" className="small">👥 {result.summary.users}</Badge>}
                          {result.summary.items > 0 && <Badge bg="info" className="small">📦 {result.summary.items}</Badge>}
                          {result.summary.wants > 0 && <Badge bg="warning" className="small">🎯 {result.summary.wants}</Badge>}
                          {result.summary.trades > 0 && <Badge bg="success" className="small">🤝 {result.summary.trades}</Badge>}
                          {result.summary.messages > 0 && <Badge bg="primary" className="small">💬 {result.summary.messages}</Badge>}
                          {result.summary.matches > 0 && <Badge bg="dark" className="small">🤖 {result.summary.matches}</Badge>}
                          {result.summary.notifications > 0 && <Badge bg="light text-dark" className="small">🔔 {result.summary.notifications}</Badge>}
                          {result.summary.savedItems > 0 && <Badge bg="secondary" className="small">💾 {result.summary.savedItems}</Badge>}
                        </div>
                      </small>
                    </div>
                  )}
                  
                  {result.errors && result.errors.length > 0 && (
                    <ul className="mb-0 mt-2">
                      {result.errors.map((err, idx) => (
                        <li key={idx} className="small">
                          {err.item}: {err.error}
                        </li>
                      ))}
                    </ul>
                  )}
                </Alert>
              )}
              
              <div className="mt-3 p-2 bg-light rounded">
                <small className="text-muted">
                  <strong>🌱 Full Seed:</strong> Complete database with users, items, trades, messages, etc.<br/>
                  <strong>🎯 Sample Data:</strong> Alternative comprehensive data creation method<br/>
                  <strong>👥 Demo Users:</strong> 5 predefined users with specialized items<br/>
                  <strong>➕ My Items:</strong> Add test items to your current account<br/>
                  <strong>🧹 Full Cleanup:</strong> Remove ALL seeded test data (careful!)<br/>
                  <br/>
                  <strong>Categories:</strong> Electronics, Furniture, Sports, Books, Kitchen, Tools, Fashion, Art
                </small>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TestDataManager;