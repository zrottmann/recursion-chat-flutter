import { useState, useEffect } from 'react';
import { Modal, Card, Form, Button, Badge, Row, Col, ListGroup, ProgressBar, Accordion } from 'react-bootstrap';
import { Sparkles, Edit3, Check, DollarSign, Package, Eye, TrendingUp, Target, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AIListingReview = ({ show, onHide, analysisData, onCreateListing }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    condition: 'good',
    use_ai_suggestion: true
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (analysisData?.suggestions) {
      const suggestions = analysisData.suggestions;
      const identification = suggestions.item_identification || {};
      const pricing = suggestions.final_pricing || {};
      const condition = suggestions.condition_analysis || {};
      
      setFormData({
        title: identification.item_name || suggestions.suggested_title || '',
        description: generateEnhancedDescription(suggestions),
        price: pricing.estimated_price || parseFloat(suggestions.suggested_price) || 0,
        category: identification.category || suggestions.suggested_category || '',
        condition: condition.condition_category || suggestions.suggested_condition || 'good',
        use_ai_suggestion: true
      });
    }
  }, [analysisData]);
  
  const generateEnhancedDescription = (suggestions) => {
    const identification = suggestions.item_identification || {};
    const condition = suggestions.condition_analysis || {};
    const features = identification.key_features || [];
    
    let description = `${identification.brand || ''} ${identification.model || identification.item_name || 'Item'}`;
    if (identification.estimated_age) {
      description += ` (${identification.estimated_age})`;
    }
    description += '.\n\n';
    
    if (features.length > 0) {
      description += `Key Features:\n${features.map(f => `• ${f}`).join('\n')}\n\n`;
    }
    
    description += `Condition: ${condition.condition_category || 'good'} `;
    if (condition.overall_score) {
      description += `(${condition.overall_score.toFixed(1)}/10)`;
    }
    
    if (condition.condition_notes && condition.condition_notes.length > 0) {
      description += `\n\nCondition Notes:\n${condition.condition_notes.map(n => `• ${n}`).join('\n')}`;
    }
    
    if (suggestions.recommendations && suggestions.recommendations.length > 0) {
      description += `\n\n${suggestions.recommendations.join(' ')}`.trim();
    }
    
    return description;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      use_ai_suggestion: false // Mark as user-modified
    }));
  };

  const revertToAI = () => {
    if (analysisData?.suggestions) {
      const suggestions = analysisData.suggestions;
      const identification = suggestions.item_identification || {};
      const pricing = suggestions.final_pricing || {};
      const condition = suggestions.condition_analysis || {};
      
      setFormData({
        title: identification.item_name || suggestions.suggested_title || '',
        description: generateEnhancedDescription(suggestions),
        price: pricing.estimated_price || parseFloat(suggestions.suggested_price) || 0,
        category: identification.category || suggestions.suggested_category || '',
        condition: condition.condition_category || suggestions.suggested_condition || 'good',
        use_ai_suggestion: true
      });
    }
  };

  const handleCreateListing = async () => {
    try {
      setCreating(true);
      
      const listingData = {
        session_id: analysisData.session_id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        use_ai_suggestion: formData.use_ai_suggestion,
        listing_type: 'sale' // Default to sale for AI-generated listings
      };

      const response = await api.post('/api/items/create-from-ai', listingData);
      
      toast.success('AI-powered listing created successfully!');
      onCreateListing(response.data);
      onHide();
      
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const _getConfidenceColor = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'danger';
  };

  const _getConfidenceText = (score) => {
    if (score >= 0.8) return 'High Confidence';
    if (score >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const renderConditionScoreBar = (score, label, max = 10) => (
    <div className="mb-2">
      <div className="d-flex justify-content-between mb-1">
        <small className="fw-bold">{label}</small>
        <small>{score?.toFixed(1) || 0}/{max}</small>
      </div>
      <ProgressBar 
        now={(score / max) * 100} 
        variant={score >= 8 ? 'success' : score >= 6 ? 'warning' : 'danger'}
        style={{ height: '6px' }}
      />
    </div>
  );

  const renderConfidenceIndicator = (confidence, size = 'sm') => (
    <Badge 
      bg={confidence >= 0.8 ? 'success' : confidence >= 0.6 ? 'warning' : 'danger'}
      className={size === 'lg' ? 'fs-6' : ''}
    >
      {(confidence * 100).toFixed(0)}% Confidence
    </Badge>
  );

  const renderPriceBreakdown = (pricing) => (
    <Card className="border-success">
      <Card.Header className="bg-light">
        <h6 className="mb-0">
          <DollarSign size={18} className="me-2" />
          AI Price Analysis
        </h6>
      </Card.Header>
      <Card.Body>
        <div className="text-center mb-3">
          <h3 className="text-success mb-1">
            ${pricing?.estimated_price?.toFixed(2) || '0.00'}
          </h3>
          {renderConfidenceIndicator(pricing?.confidence || 0.8, 'lg')}
        </div>
        
        {pricing?.price_range && (
          <div className="mb-3">
            <small className="text-muted">Estimated Range:</small>
            <div className="d-flex justify-content-between">
              <span>${pricing.price_range.min?.toFixed(2)}</span>
              <span>${pricing.price_range.max?.toFixed(2)}</span>
            </div>
            <ProgressBar className="mt-1" style={{ height: '4px' }}>
              <ProgressBar variant="success" now={50} />
            </ProgressBar>
          </div>
        )}
        
        {pricing?.factors && typeof pricing.factors === 'object' && pricing.factors !== null && (
          <div>
            <small className="fw-bold text-muted">Price Factors:</small>
            {Object.entries(pricing.factors).map(([factor, impact]) => (
              <div key={factor} className="d-flex justify-content-between small">
                <span>{factor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                <span className={impact.includes('+') ? 'text-success' : impact.includes('-') ? 'text-danger' : 'text-muted'}>
                  {impact}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );

  if (!analysisData) return null;

  const suggestions = analysisData.suggestions || analysisData.ai_suggestions || {};
  const identification = suggestions.item_identification || {};
  const conditionAnalysis = suggestions.condition_analysis || {};
  const marketAnalysis = suggestions.market_analysis || {};
  const finalPricing = suggestions.final_pricing || {};
  const isMultiAngle = analysisData.multiAngle || false;
  const processingTime = suggestions.processing_time || 0;

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <Sparkles size={24} className="text-primary me-2" />
          AI Analysis Complete
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Analysis Summary Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="mb-1">
              {identification.brand} {identification.model || identification.item_name}
              {isMultiAngle && <Badge bg="success" className="ms-2">Multi-Angle</Badge>}
            </h5>
            <div className="d-flex align-items-center gap-3">
              {renderConfidenceIndicator(identification.confidence || 0.8)}
              <small className="text-muted">
                Processed in {processingTime?.toFixed(1)}s
              </small>
              {analysisData.capturedImages?.length > 1 && (
                <small className="text-success">
                  <Eye size={14} className="me-1" />
                  {analysisData.capturedImages.length} angles analyzed
                </small>
              )}
            </div>
          </div>
          
          {analysisData.capturedImages?.[0] && (
            <img 
              src={analysisData.capturedImages[0].preview} 
              alt="Analyzed item"
              title="AI-analyzed item preview"
              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              className="rounded"
            />
          )}
        </div>

        <Row>
          <Col lg={8}>
            {/* AI Generated Listing Form */}
            <Card className="mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <Package size={18} className="me-2" />
                  AI-Generated Listing
                </h6>
                <div>
                  {!formData.use_ai_suggestion && (
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={revertToAI}
                      className="me-2"
                    >
                      <Sparkles size={14} className="me-1" />
                      Revert to AI
                    </Button>
                  )}
                  <Button 
                    variant={editMode ? 'outline-secondary' : 'outline-primary'} 
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit3 size={14} className="me-1" />
                    {editMode ? 'Preview' : 'Edit'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {editMode ? (
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={6}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Price ($)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Condition</Form.Label>
                          <Form.Select
                            value={formData.condition}
                            onChange={(e) => handleInputChange('condition', e.target.value)}
                          >
                            <option value="mint">Mint</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                ) : (
                  <div>
                    <h6 className="mb-2">{formData.title}</h6>
                    <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>
                      {formData.description}
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="text-success mb-0">${formData.price}</h5>
                      <Badge bg="info">Condition: {formData.condition}</Badge>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            {/* Price Analysis */}
            {renderPriceBreakdown(finalPricing)}
            
            {/* Condition Analysis */}
            <Card className="mt-3 border-info">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <Target size={18} className="me-2" />
                  Condition Analysis
                </h6>
              </Card.Header>
              <Card.Body>
                {conditionAnalysis.overall_score && (
                  <>
                    {renderConditionScoreBar(conditionAnalysis.overall_score, "Overall Score")}
                    {renderConditionScoreBar(conditionAnalysis.cosmetic_score, "Cosmetic")}
                    {renderConditionScoreBar(conditionAnalysis.functional_score, "Functional")}
                    {renderConditionScoreBar(conditionAnalysis.completeness_score, "Completeness")}
                  </>
                )}
                
                {conditionAnalysis.damage_details && (
                  <div className="mt-3">
                    <small className="fw-bold text-muted">Damage Assessment:</small>
                    <ListGroup variant="flush">
                      {conditionAnalysis.damage_details.scratches > 0.1 && (
                        <ListGroup.Item className="px-0 py-1 border-0">
                          <small>
                            <AlertTriangle size={12} className="text-warning me-1" />
                            Scratches: {(conditionAnalysis.damage_details.scratches * 100).toFixed(0)}%
                          </small>
                        </ListGroup.Item>
                      )}
                      {conditionAnalysis.damage_details.dents > 0.1 && (
                        <ListGroup.Item className="px-0 py-1 border-0">
                          <small>
                            <AlertTriangle size={12} className="text-warning me-1" />
                            Dents: {(conditionAnalysis.damage_details.dents * 100).toFixed(0)}%
                          </small>
                        </ListGroup.Item>
                      )}
                      {conditionAnalysis.damage_details.wear_patterns?.length > 0 && (
                        <ListGroup.Item className="px-0 py-1 border-0">
                          <small>
                            <Info size={12} className="text-info me-1" />
                            Wear: {conditionAnalysis.damage_details.wear_patterns.join(', ')}
                          </small>
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Advanced Analysis Details */}
        <Accordion className="mt-4">
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <TrendingUp size={16} className="me-2" />
              Market Intelligence & Advanced Analysis
            </Accordion.Header>
            <Accordion.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-primary">Market Analysis</h6>
                  {marketAnalysis.recent_sales && marketAnalysis.recent_sales.length > 0 ? (
                    <div>
                      <small className="fw-bold">Recent Sales:</small>
                      {marketAnalysis.recent_sales.map((sale, index) => (
                        <div key={index} className="d-flex justify-content-between small">
                          <span>{sale.platform}</span>
                          <span>${sale.price} ({sale.date})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <small className="text-muted">Market data processed from multiple sources</small>
                  )}
                  
                  {marketAnalysis.demand_level && (
                    <div className="mt-2">
                      <small className="fw-bold">Market Demand: </small>
                      <Badge bg={marketAnalysis.demand_level === 'high' ? 'success' : 
                                 marketAnalysis.demand_level === 'medium' ? 'warning' : 'secondary'}>
                        {marketAnalysis.demand_level}
                      </Badge>
                    </div>
                  )}
                </Col>
                
                <Col md={6}>
                  <h6 className="text-success">Item Details</h6>
                  <div>
                    {identification.key_features?.length > 0 && (
                      <div className="mb-2">
                        <small className="fw-bold">Key Features:</small>
                        <div>
                          {identification.key_features.map((feature, index) => (
                            <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {identification.estimated_age && (
                      <div className="mb-1">
                        <small><strong>Age:</strong> {identification.estimated_age}</small>
                      </div>
                    )}
                    
                    {identification.retail_price && (
                      <div className="mb-1">
                        <small><strong>Original Price:</strong> ${identification.retail_price}</small>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
              
              {suggestions.recommendations && suggestions.recommendations.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-info">AI Recommendations</h6>
                  <ul className="small mb-0">
                    {suggestions.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="success" 
          onClick={handleCreateListing}
          disabled={creating || !formData.title || !formData.description}
        >
          {creating ? 'Creating...' : (
            <>
              <Check size={16} className="me-2" />
              Create Listing
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AIListingReview;