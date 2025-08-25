import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, Card, Form, Button, Row, Col, Alert, Badge, 
  Modal, ListGroup, InputGroup, ProgressBar 
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/api';

const MatchingPreferences = () => {
  const { currentUser } = useSelector(state => state.user);
  
  // Preference state
  const [preferences, setPreferences] = useState({
    max_distance_km: 50,
    preferred_categories: [],
    excluded_categories: [],
    max_value_difference_percent: 20,
    min_item_value: null,
    max_item_value: null,
    enable_ai_matching: true,
    notification_frequency: 'daily',
    auto_decline_low_scores: false,
    min_auto_decline_score: 0.3,
    learn_from_interactions: true
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryType, setCategoryType] = useState('preferred'); // 'preferred' or 'excluded'
  const [newCategory, setNewCategory] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Available categories
  const availableCategories = [
    'Electronics', 'Clothing', 'Books', 'Furniture', 'Tools', 
    'Vehicles', 'Services', 'Appliances', 'Collectibles', 'Sports',
    'Music', 'Art', 'Garden', 'Kids', 'Pets', 'Health', 'Food'
  ];

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matching/matching-preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error loading preferences:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load matching preferences');
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await api.put('/matching/matching-preferences', preferences);
      setHasChanges(false);
      toast.success('✅ Matching preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save matching preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const addCategory = (type) => {
    if (!newCategory.trim()) return;
    
    const categoryField = type === 'preferred' ? 'preferred_categories' : 'excluded_categories';
    const currentCategories = preferences[categoryField] || [];
    
    if (!currentCategories.includes(newCategory)) {
      handleInputChange(categoryField, [...currentCategories, newCategory]);
    }
    
    setNewCategory('');
    setShowCategoryModal(false);
  };

  const removeCategory = (type, category) => {
    const categoryField = type === 'preferred' ? 'preferred_categories' : 'excluded_categories';
    const currentCategories = preferences[categoryField] || [];
    
    handleInputChange(
      categoryField, 
      currentCategories.filter(cat => cat !== category)
    );
  };

  const openCategoryModal = (type) => {
    setCategoryType(type);
    setNewCategory('');
    setShowCategoryModal(true);
  };

  const getDistanceText = (distance) => {
    if (distance <= 5) return `${distance}km (Very Local)`;
    if (distance <= 25) return `${distance}km (Local Area)`;
    if (distance <= 100) return `${distance}km (Regional)`;
    return `${distance}km (Wide Area)`;
  };

  const getNotificationText = (frequency) => {
    const texts = {
      'instant': '🔔 Instant - Get notified immediately',
      'daily': '📅 Daily - One summary per day',
      'weekly': '📆 Weekly - Weekly digest',
      'disabled': '🔕 Disabled - No notifications'
    };
    return texts[frequency] || frequency;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading your matching preferences...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🤖 AI Matching Preferences</h2>
        {hasChanges && (
          <Badge bg="warning">Unsaved Changes</Badge>
        )}
      </div>

      <Row>
        <Col lg={8} className="mx-auto">
          
          {/* AI Matching Toggle */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">🎯 AI Matching</h5>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="enable-ai-matching"
                label="Enable AI-powered matching"
                checked={preferences.enable_ai_matching}
                onChange={(e) => handleInputChange('enable_ai_matching', e.target.checked)}
                className="mb-3"
              />
              
              {!preferences.enable_ai_matching && (
                <Alert variant="info">
                  When AI matching is disabled, you'll only see manual search results.
                  Enable it to get personalized, intelligent match suggestions!
                </Alert>
              )}
              
              {preferences.enable_ai_matching && (
                <div>
                  <Form.Check
                    type="switch"
                    id="learn-from-interactions"
                    label="Learn from my interactions to improve suggestions"
                    checked={preferences.learn_from_interactions}
                    onChange={(e) => handleInputChange('learn_from_interactions', e.target.checked)}
                    className="mb-2"
                  />
                  <Form.Text className="text-muted">
                    Helps AI understand your preferences based on matches you accept or decline.
                  </Form.Text>
                </div>
              )}
            </Card.Body>
          </Card>

          {preferences.enable_ai_matching && (
            <>
              {/* Geographic Preferences */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📍 Location & Distance</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Maximum Distance: <strong>{getDistanceText(preferences.max_distance_km)}</strong>
                    </Form.Label>
                    <Form.Range
                      min={1}
                      max={500}
                      step={5}
                      value={preferences.max_distance_km}
                      onChange={(e) => handleInputChange('max_distance_km', parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>1km</span>
                      <span>500km+</span>
                    </div>
                  </Form.Group>
                  
                  <Alert variant="info" className="small">
                    💡 Tip: Smaller distances mean more local trades, but fewer matches.
                    Larger distances give more options but may require shipping.
                  </Alert>
                </Card.Body>
              </Card>

              {/* Category Preferences */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">📦 Category Preferences</h5>
                </Card.Header>
                <Card.Body>
                  {/* Preferred Categories */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0"><strong>Preferred Categories</strong></Form.Label>
                      <Button 
                        size="sm" 
                        variant="outline-success"
                        onClick={() => openCategoryModal('preferred')}
                      >
                        + Add
                      </Button>
                    </div>
                    
                    <div className="mb-2">
                      {preferences.preferred_categories?.map(category => (
                        <Badge 
                          key={category} 
                          bg="success" 
                          className="me-2 mb-2 d-inline-flex align-items-center"
                        >
                          {category}
                          <button 
                            className="btn-close btn-close-white ms-2" 
                            style={{ fontSize: '10px' }}
                            onClick={() => removeCategory('preferred', category)}
                            aria-label={`Remove ${category}`}
                          ></button>
                        </Badge>
                      ))}
                      
                      {(!preferences.preferred_categories || preferences.preferred_categories.length === 0) && (
                        <span className="text-muted">No preferred categories selected</span>
                      )}
                    </div>
                    
                    <Form.Text className="text-muted">
                      Categories you&apos;re most interested in trading for.
                    </Form.Text>
                  </div>

                  {/* Excluded Categories */}
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Form.Label className="mb-0"><strong>Excluded Categories</strong></Form.Label>
                      <Button 
                        size="sm" 
                        variant="outline-danger"
                        onClick={() => openCategoryModal('excluded')}
                      >
                        + Add
                      </Button>
                    </div>
                    
                    <div className="mb-2">
                      {preferences.excluded_categories?.map(category => (
                        <Badge 
                          key={category} 
                          bg="danger" 
                          className="me-2 mb-2 d-inline-flex align-items-center"
                        >
                          {category}
                          <button 
                            className="btn-close btn-close-white ms-2" 
                            style={{ fontSize: '10px' }}
                            onClick={() => removeCategory('excluded', category)}
                            aria-label={`Remove ${category}`}
                          ></button>
                        </Badge>
                      ))}
                      
                      {(!preferences.excluded_categories || preferences.excluded_categories.length === 0) && (
                        <span className="text-muted">No categories excluded</span>
                      )}
                    </div>
                    
                    <Form.Text className="text-muted">
                      Categories you don&apos;t want to see in matches.
                    </Form.Text>
                  </div>
                </Card.Body>
              </Card>

              {/* Value Preferences */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">💰 Value Matching</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Maximum Value Difference: <strong>{preferences.max_value_difference_percent}%</strong>
                    </Form.Label>
                    <Form.Range
                      min={5}
                      max={100}
                      step={5}
                      value={preferences.max_value_difference_percent}
                      onChange={(e) => handleInputChange('max_value_difference_percent', parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between small text-muted">
                      <span>5% (Very strict)</span>
                      <span>100% (Any value)</span>
                    </div>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Minimum Item Value ($)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Any value"
                            value={preferences.min_item_value || ''}
                            onChange={(e) => handleInputChange('min_item_value', 
                              e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maximum Item Value ($)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>$</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Any value"
                            value={preferences.max_item_value || ''}
                            onChange={(e) => handleInputChange('max_item_value', 
                              e.target.value ? parseFloat(e.target.value) : null)}
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Notification Preferences */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">🔔 Notifications</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Notification Frequency</Form.Label>
                    <Form.Select
                      value={preferences.notification_frequency}
                      onChange={(e) => handleInputChange('notification_frequency', e.target.value)}
                    >
                      <option value="instant">Instant</option>
                      <option value="daily">Daily Summary</option>
                      <option value="weekly">Weekly Digest</option>
                      <option value="disabled">Disabled</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {getNotificationText(preferences.notification_frequency)}
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Advanced Settings */}
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">⚙️ Advanced Settings</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="switch"
                    id="auto-decline-low-scores"
                    label="Auto-decline matches with low scores"
                    checked={preferences.auto_decline_low_scores}
                    onChange={(e) => handleInputChange('auto_decline_low_scores', e.target.checked)}
                    className="mb-3"
                  />
                  
                  {preferences.auto_decline_low_scores && (
                    <Form.Group className="mb-3">
                      <Form.Label>
                        Auto-decline threshold: <strong>{(preferences.min_auto_decline_score * 100).toFixed(0)}%</strong>
                      </Form.Label>
                      <Form.Range
                        min={0.1}
                        max={0.8}
                        step={0.05}
                        value={preferences.min_auto_decline_score}
                        onChange={(e) => handleInputChange('min_auto_decline_score', parseFloat(e.target.value))}
                      />
                      <Form.Text className="text-muted">
                        Matches below this score will be automatically declined.
                      </Form.Text>
                    </Form.Group>
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {/* Save Button */}
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={loadPreferences}
              disabled={saving || !hasChanges}
            >
              Reset
            </Button>
            <Button 
              variant="primary" 
              onClick={savePreferences}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>💾 Save Preferences</>
              )}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Category Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Add {categoryType === 'preferred' ? 'Preferred' : 'Excluded'} Category
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Category</Form.Label>
            <Form.Select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="">Choose a category...</option>
              {availableCategories
                .filter(cat => {
                  const currentCategories = preferences[
                    categoryType === 'preferred' ? 'preferred_categories' : 'excluded_categories'
                  ] || [];
                  return !currentCategories.includes(cat);
                })
                .map(category => (
                  <option key={category} value={category}>{category}</option>
                ))
              }
            </Form.Select>
          </Form.Group>
          
          <Form.Group>
            <Form.Label>Or enter custom category</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter custom category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={categoryType === 'preferred' ? 'success' : 'danger'}
            onClick={() => addCategory(categoryType)}
            disabled={!newCategory.trim()}
          >
            Add Category
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MatchingPreferences;