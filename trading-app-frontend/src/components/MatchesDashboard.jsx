import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Container, Card, Table, Button, Badge, Pagination, Alert, 
  Modal, Form, Row, Col, ProgressBar, Tooltip, OverlayTrigger 
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchMatches, acceptMatch, declineMatch, setCurrentPage } from '../store/slices/matchesSlice';
import appwriteAIMatching from '../services/appwriteAIMatching';
import { subscribeToUserNotifications } from '../services/appwriteRealtime';
import aiMatchingService from '../services/aiMatchingService';
import semanticMatchingService from '../services/semanticMatchingService';
import behaviorAnalytics from '../services/behaviorAnalytics';
import bundleMatching from '../services/bundleMatching';
import proactiveMatching from '../services/proactiveMatching';
import SmartMatchFilters from './SmartMatchFilters';

const MatchesDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { matches, currentPage, totalPages, loading, error } = useSelector(state => state.matches);
  const { currentUser } = useSelector(state => state.user);
  
  // Enhanced state for new features
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineFeedback, setDeclineFeedback] = useState('');
  const [blockSimilar, setBlockSimilar] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsights, setAIInsights] = useState(null);
  const [showProactiveMatches, setShowProactiveMatches] = useState(false);
  const [proactiveMatches, setProactiveMatches] = useState([]);
  const [showBundleDetails, setShowBundleDetails] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [matchExplanations, setMatchExplanations] = useState(new Map());
  const [generatingMatches, setGeneratingMatches] = useState(false);

  useEffect(() => {
    // Initialize AI matching on component mount
    appwriteAIMatching.initializeForUser().then(userId => {
      if (userId) {
        console.log('✅ AI Matching initialized for user:', userId);
      }
    });
  }, []);

  useEffect(() => {
    dispatch(fetchMatches({ page: currentPage, limit: 10 }));
    
    // Setup real-time notifications for new matches
    if (currentUser && !realTimeEnabled) {
      setupRealTimeNotifications();
      setRealTimeEnabled(true);
    }
    
    // Load AI insights and proactive matches
    if (currentUser) {
      loadAIInsights();
      loadProactiveMatches();
    }
  }, [dispatch, currentPage, currentUser, realTimeEnabled]);
  
  const loadAIInsights = async () => {
    try {
      const insights = await behaviorAnalytics.getUserAnalytics(currentUser.id, '30d', {
        includeSegmentation: true,
        includePredictions: true,
        includeComparisons: true,
        includeInsights: true
      });
      setAIInsights(insights);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    }
  };
  
  const loadProactiveMatches = async () => {
    try {
      const predictions = await proactiveMatching.generateProactivePredictions(currentUser.id, {
        includeTrendPredictions: true,
        includeCollectionCompletion: true,
        includeSeasonalPredictions: true,
        includeSocialInfluence: true
      });
      setProactiveMatches(predictions.proactiveMatches || []);
    } catch (error) {
      console.error('Failed to load proactive matches:', error);
    }
  };
  
  const setupRealTimeNotifications = async () => {
    try {
      await subscribeToUserNotifications(currentUser.id, {
        'new_match': (data) => {
          toast.info('🤖 New AI match found!', { autoClose: 5000 });
          dispatch(fetchMatches({ page: currentPage, limit: 10 }));
        },
        'match_accepted': (data) => {
          toast.success('🎉 Someone accepted your match!', { autoClose: 5000 });
          // Refresh matches to update status
          dispatch(fetchMatches({ page: currentPage, limit: 10 }));
        }
      });
    } catch (error) {
      console.error('Failed to setup real-time notifications:', error);
    }
  };

  const handleAcceptMatch = async (match) => {
    try {
      // Track user interaction for learning
      await behaviorAnalytics.trackEvent(currentUser.id, 'match_accepted', {
        match_id: match.id,
        match_score: match.optimized_score || match.overall_score,
        match_type: match.match_type || 'standard',
        semantic_score: match.semantic_score,
        bundle_match: match.is_bundle_match
      });
      
      const acceptData = {
        match_id: match.id,
        message: `Hi! I'm interested in trading my ${match.your_listing?.title || 'item'} for your ${match.their_listing?.title || 'item'}. Let's discuss the details!`,
        propose_meetup: false
      };
      
      const response = await dispatch(acceptMatch(acceptData)).unwrap();
      toast.success('🎉 Match accepted! Initial message sent. Redirecting to conversation...');
      
      // Navigate to messages with the matched user
      navigate(`/messages/${response.conversation?.receiver_id || match.matched_user?.id}`);
    } catch (error) {
      console.error('Accept match error:', error);
      toast.error('Failed to accept match. Please try again.');
    }
  };
  
  const handleDeclineMatch = (match) => {
    setSelectedMatch(match);
    setDeclineReason('');
    setDeclineFeedback('');
    setBlockSimilar(false);
    setShowDeclineModal(true);
  };
  
  const submitDeclineMatch = async () => {
    if (!declineReason) {
      toast.error('Please select a reason for declining.');
      return;
    }
    
    try {
      // Track user interaction for learning
      await behaviorAnalytics.trackEvent(currentUser.id, 'match_declined', {
        match_id: selectedMatch.id,
        match_score: selectedMatch.optimized_score || selectedMatch.overall_score,
        decline_reason: declineReason,
        feedback: declineFeedback,
        block_similar: blockSimilar,
        match_type: selectedMatch.match_type || 'standard'
      });
      
      const declineData = {
        match_id: selectedMatch.id,
        reason: declineReason,
        feedback: declineFeedback,
        block_similar: blockSimilar
      };
      
      await dispatch(declineMatch(declineData)).unwrap();
      toast.success('Match declined. This helps improve our AI recommendations!');
      setShowDeclineModal(false);
      setSelectedMatch(null);
    } catch (error) {
      console.error('Decline match error:', error);
      toast.error('Failed to decline match. Please try again.');
    }
  };
  
  const handleViewMatchDetails = async (match) => {
    // Track interaction
    await behaviorAnalytics.trackEvent(currentUser.id, 'match_viewed', {
      match_id: match.id,
      match_score: match.optimized_score || match.overall_score,
      view_duration: Date.now(), // Will be updated when modal closes
      clicked_details: true
    });
    
    // Generate detailed explanation if not already cached
    if (!matchExplanations.has(match.id)) {
      const explanation = await generateMatchExplanation(match);
      setMatchExplanations(prev => new Map(prev.set(match.id, explanation)));
    }
    
    setSelectedMatch(match);
    setShowMatchDetails(true);
  };
  
  const generateMatchExplanation = async (match) => {
    try {
      // Get detailed AI analysis
      const item1 = match.your_listing || match.item1_details;
      const item2 = match.their_listing || match.item2_details;
      
      if (!item1 || !item2) return { reasoning: 'Basic match compatibility' };
      
      // Get semantic analysis
      const semanticAnalysis = await semanticMatchingService.calculateSemanticSimilarity(item1, item2);
      
      // Check for bundle opportunities
      let bundleAnalysis = null;
      if (match.is_bundle_match || match.bundle_opportunity) {
        bundleAnalysis = await bundleMatching.findBundleMatches(item1, [item2]);
      }
      
      return {
        reasoning: match.ai_reasoning || 'AI compatibility analysis',
        semantic: semanticAnalysis,
        bundle: bundleAnalysis,
        confidence_factors: match.optimization_factors || {},
        prediction_context: match.prediction_type ? {
          type: match.prediction_type,
          reasoning: match.prediction_reasoning
        } : null
      };
    } catch (error) {
      console.error('Error generating match explanation:', error);
      return { reasoning: 'Error generating explanation' };
    }
  };
  
  const handleShowAIInsights = () => {
    setShowAIInsights(true);
  };
  
  const handleShowProactiveMatches = () => {
    setShowProactiveMatches(true);
  };
  
  const handleBundleDetails = (bundle) => {
    setSelectedBundle(bundle);
    setShowBundleDetails(true);
  };

  const handleGenerateNewMatches = async () => {
    setGeneratingMatches(true);
    try {
      // Initialize and generate new AI matches
      const userId = await appwriteAIMatching.initializeForUser();
      if (!userId) {
        toast.error('Please log in to generate matches');
        return;
      }

      const newMatches = await appwriteAIMatching.generateAIMatches(userId, {
        maxMatches: 10,
        includeSemanticMatches: true,
        includeBundleMatches: true,
        includeProactiveMatches: true
      });

      if (newMatches && newMatches.length > 0) {
        toast.success(`🎉 Generated ${newMatches.length} new AI matches!`);
        // Refresh the matches list
        dispatch(fetchMatches({ page: 1, limit: 10, useAI: true }));
      } else {
        toast.info('No new matches found. Try adding more items to your listings!');
      }
    } catch (error) {
      console.error('Failed to generate matches:', error);
      toast.error('Failed to generate matches. Please try again.');
    } finally {
      setGeneratingMatches(false);
    }
  };

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    if (score >= 0.4) return 'info';
    return 'secondary';
  };
  
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    return '#dc3545';
  };
  
  const formatDistance = (distance) => {
    if (!distance) return 'Unknown';
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  };
  
  const getMatchTypeLabel = (matchType) => {
    const labels = {
      'standard': 'Standard',
      'cross_category': 'Cross-Cat',
      'bundle': 'Bundle',
      'premium': 'Premium',
      'semantic': 'Smart',
      'predicted': 'Predicted'
    };
    return labels[matchType] || matchType;
  };
  
  const getOptimizationSummary = (factors) => {
    const summaries = [];
    if (factors.perfect_location) summaries.push('perfect distance');
    if (factors.high_behavior_match) summaries.push('matches your style');
    if (factors.trending_item) summaries.push('trending item');
    if (factors.cross_category) summaries.push('smart suggestion');
    if (factors.bundle_match) summaries.push('bundle opportunity');
    if (factors.seasonal_relevance) summaries.push('seasonally relevant');
    
    return summaries.length > 0 ? summaries.slice(0, 2).join(', ') : 'good compatibility';
  };
  
  const renderScoreTooltip = (match) => {
    return (
      <div>
        <div><strong>AI Score:</strong> {((match.optimized_score || match.overall_score || match.ai_score) * 100).toFixed(0)}%</div>
        <div><strong>Value Match:</strong> {((match.value_score || 0) * 100).toFixed(0)}%</div>
        <div><strong>Location:</strong> {((match.location_score || match.geographic_score || 0) * 100).toFixed(0)}%</div>
        <div><strong>Similarity:</strong> {((match.semantic_score || match.category_score || 0) * 100).toFixed(0)}%</div>
        <div><strong>AI Confidence:</strong> {((match.confidence_level || 0.5) * 100).toFixed(0)}%</div>
        {match.distance_km && <div><strong>Distance:</strong> {formatDistance(match.distance_km)}</div>}
        {match.behavior_score && <div><strong>Personal Fit:</strong> {(match.behavior_score * 100).toFixed(0)}%</div>}
        {match.market_trend_score && <div><strong>Market Trend:</strong> {(match.market_trend_score * 100).toFixed(0)}%</div>}
        {match.match_type && <div><strong>Type:</strong> {getMatchTypeLabel(match.match_type)}</div>}
      </div>
    );
  };
  
  const sortedAndFilteredMatches = matches
    .filter(match => {
      if (filterBy === 'all') return true;
      if (filterBy === 'high-score') return match.overall_score >= 0.7;
      if (filterBy === 'nearby') return match.distance_km && match.distance_km <= 25;
      if (filterBy === 'same-category') return match.category_score >= 0.8;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.overall_score - a.overall_score;
      if (sortBy === 'distance') return (a.distance_km || 999) - (b.distance_km || 999);
      if (sortBy === 'value') return (b.value_score || 0) - (a.value_score || 0);
      if (sortBy === 'recent') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

  const renderDetailedExplanation = (explanation) => {
    if (!explanation) return null;
    
    return (
      <div>
        {explanation.semantic && (
          <div className="mb-3">
            <h6>🧠 Semantic Analysis:</h6>
            <p>{explanation.semantic.reasoning}</p>
            {explanation.semantic.equivalency_type && (
              <Badge bg="info">Type: {explanation.semantic.equivalency_type}</Badge>
            )}
          </div>
        )}
        
        {explanation.bundle && explanation.bundle.length > 0 && (
          <div className="mb-3">
            <h6>📦 Bundle Opportunities:</h6>
            <p>This could be part of a larger bundle trade</p>
          </div>
        )}
        
        {explanation.prediction_context && (
          <div className="mb-3">
            <h6>🔮 Prediction Context:</h6>
            <p><strong>Type:</strong> {explanation.prediction_context.type}</p>
            <p><strong>Reason:</strong> {explanation.prediction_context.reasoning}</p>
          </div>
        )}
        
        {explanation.confidence_factors && Object.keys(explanation.confidence_factors).length > 0 && (
          <div>
            <h6>🎯 Confidence Factors:</h6>
            <div className="d-flex flex-wrap gap-2">
              {explanation.confidence_factors && typeof explanation.confidence_factors === 'object' && 
               Object.entries(explanation.confidence_factors).map(([factor, value]) => (
                value && <Badge key={factor} bg="light" text="dark">{factor.replace('_', ' ')}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Container className="py-4">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">AI-Powered Matches</h2>
            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleGenerateNewMatches}
                disabled={generatingMatches}
              >
                {generatingMatches ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Generating...
                  </>
                ) : (
                  <>🤖 Generate AI Matches</>
                )}
              </Button>
              <Button 
                variant="outline-info" 
                size="sm"
                onClick={handleShowAIInsights}
                disabled={!aiInsights}
              >
                📊 AI Insights
              </Button>
              <Button 
                variant="outline-success" 
                size="sm"
                onClick={handleShowProactiveMatches}
                disabled={proactiveMatches.length === 0}
              >
                🔮 Predictions ({proactiveMatches.length})
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="danger" dismissible>
              {error}
            </Alert>
          )}

          {loading ? (
            <p>Loading matches...</p>
          ) : matches.length === 0 ? (
            <Alert variant="info">
              No matches found. Make sure you have opted-in for AI matching in your profile.
            </Alert>
          ) : (
            <>
          {/* Enhanced Filters and Sort Controls */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="score">Sort by Match Score</option>
                <option value="distance">Sort by Distance</option>
                <option value="value">Sort by Value Match</option>
                <option value="recent">Sort by Most Recent</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                <option value="all">All Matches</option>
                <option value="high-score">High Score (70%+)</option>
                <option value="nearby">Nearby (25km)</option>
                <option value="same-category">Same Category</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Button 
                variant="outline-primary" 
                onClick={() => dispatch(fetchMatches({ page: 1, limit: 10, force_refresh: true }))}
                disabled={loading}
              >
                🔄 Refresh Matches
              </Button>
            </Col>
          </Row>
              <div className="table-responsive">
              <Table striped bordered hover className="mb-0">
                <thead>
                  <tr>
                    <th>Match User</th>
                    <th>Items</th>
                    <th>Match Score</th>
                    <th>Distance & Value</th>
                    <th>AI Reasoning</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredMatches.map(match => (
                    <tr key={match.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none text-start"
                              onClick={() => match.matched_user?.id && navigate(`/users/${match.matched_user.id}`)}
                            >
                              <strong>{match.matched_user?.name || match.matched_user?.username || 'Unknown User'}</strong>
                            </button>
                            <br />
                            <small className="text-muted">
                              {match.matched_user?.location && `📍 ${match.matched_user.location}`}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="mb-2">
                          <strong className="text-success">Their: {match.item2_details?.title || match.their_listing?.title}</strong>
                          <br />
                          <small className="text-muted">{match.item2_details?.category || match.their_listing?.category}</small>
                          {match.item2_estimated_value && (
                            <><br /><small className="text-info">~${match.item2_estimated_value}</small></>
                          )}
                        </div>
                        <div>
                          <strong className="text-primary">Your: {match.item1_details?.title || match.your_listing?.title}</strong>
                          <br />
                          <small className="text-muted">{match.item1_details?.category || match.your_listing?.category}</small>
                          {match.item1_estimated_value && (
                            <><br /><small className="text-info">~${match.item1_estimated_value}</small></>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{renderScoreTooltip(match)}</Tooltip>}
                        >
                          <div>
                            <div className="d-flex align-items-center justify-content-center mb-1">
                              <Badge bg={getScoreBadgeVariant(match.optimized_score || match.overall_score || match.ai_score)} className="me-1">
                                {((match.optimized_score || match.overall_score || match.ai_score) * 100).toFixed(0)}%
                              </Badge>
                              {match.match_type && (
                                <Badge bg="secondary" className="small">
                                  {getMatchTypeLabel(match.match_type)}
                                </Badge>
                              )}
                            </div>
                            <div className="text-center">
                              <small style={{ color: getConfidenceColor(match.confidence_level || 0.5) }}>
                                🎯 {((match.confidence_level || 0.5) * 100).toFixed(0)}% confident
                              </small>
                            </div>
                            {/* Enhanced score breakdown */}
                            <div className="mt-1">
                              <div style={{ fontSize: '10px' }}>
                                {/* Value Score */}
                                <ProgressBar 
                                  now={(match.value_score || 0) * 100} 
                                  style={{ height: '3px' }}
                                  variant="warning"
                                  className="mb-1"
                                  title={`Value: ${((match.value_score || 0) * 100).toFixed(0)}%`}
                                />
                                {/* Location Score */}
                                <ProgressBar 
                                  now={(match.location_score || match.geographic_score || 0) * 100} 
                                  style={{ height: '3px' }}
                                  variant="info"
                                  className="mb-1"
                                  title={`Location: ${((match.location_score || match.geographic_score || 0) * 100).toFixed(0)}%`}
                                />
                                {/* Category/Semantic Score */}
                                <ProgressBar 
                                  now={(match.semantic_score || match.category_score || 0) * 100} 
                                  style={{ height: '3px' }}
                                  variant="success"
                                  title={`Similarity: ${((match.semantic_score || match.category_score || 0) * 100).toFixed(0)}%`}
                                />
                              </div>
                            </div>
                            {/* Special indicators */}
                            <div className="mt-1 d-flex justify-content-center gap-1">
                              {match.optimization_factors?.cross_category && (
                                <small className="badge bg-info" title="Cross-category match">🔄</small>
                              )}
                              {match.optimization_factors?.bundle_match && (
                                <small className="badge bg-warning" title="Bundle opportunity">📦</small>
                              )}
                              {match.optimization_factors?.high_behavior_match && (
                                <small className="badge bg-success" title="Perfect for you">⭐</small>
                              )}
                              {match.optimization_factors?.trending_item && (
                                <small className="badge bg-danger" title="Trending">🔥</small>
                              )}
                              {match.proactive_match && (
                                <small className="badge bg-purple" title="Predicted interest">🔮</small>
                              )}
                            </div>
                          </div>
                        </OverlayTrigger>
                      </td>
                      <td>
                        {match.distance_km && (
                          <div className="mb-1">
                            <small><strong>📍 {formatDistance(match.distance_km)}</strong></small>
                          </div>
                        )}
                        {match.value_difference_percentage !== undefined && (
                          <div>
                            <small className="text-muted">
                              💰 {match.value_difference_percentage.toFixed(1)}% value diff
                            </small>
                          </div>
                        )}
                        <div className="mt-1">
                          <small className="text-muted">
                            {new Date(match.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="small mb-2">
                          {match.ai_reasoning || match.ai_reason || 'AI compatibility analysis'}
                        </div>
                        {match.prediction_reasoning && (
                          <div className="small text-muted mb-2">
                            <strong>Prediction:</strong> {match.prediction_reasoning}
                          </div>
                        )}
                        {match.optimization_factors && Object.keys(match.optimization_factors).length > 0 && (
                          <div className="small text-success mb-2">
                            <strong>Why it&apos;s great:</strong> {getOptimizationSummary(match.optimization_factors)}
                          </div>
                        )}
                        <div className="d-flex gap-1">
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0"
                            onClick={() => handleViewMatchDetails(match)}
                          >
                            🔍 Details
                          </Button>
                          {match.is_bundle_match && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0"
                              onClick={() => handleBundleDetails(match)}
                            >
                              📦 Bundle
                            </Button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleAcceptMatch(match)}
                            disabled={loading}
                            className="mb-1"
                          >
                            ✅ Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDeclineMatch(match)}
                            disabled={loading}
                          >
                            ❌ Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              </div>

              {totalPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  {[...Array(totalPages)].map((_, idx) => (
                    <Pagination.Item
                      key={idx + 1}
                      active={currentPage === idx + 1}
                      onClick={() => handlePageChange(idx + 1)}
                    >
                      {idx + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              )}
            
            {/* Decline Match Modal */}
            <Modal show={showDeclineModal} onHide={() => setShowDeclineModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Decline Match</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Why are you declining this match? *</Form.Label>
                    <Form.Select 
                      value={declineReason} 
                      onChange={(e) => setDeclineReason(e.target.value)}
                      required
                    >
                      <option value="">Select a reason...</option>
                      <option value="location">Too far away</option>
                      <option value="value">Value doesn't match</option>
                      <option value="category">Not interested in this category</option>
                      <option value="quality">Item quality concerns</option>
                      <option value="other">Other reason</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Additional feedback (optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={declineFeedback}
                      onChange={(e) => setDeclineFeedback(e.target.value)}
                      placeholder="Help us improve our AI recommendations..."
                      maxLength={300}
                    />
                    <Form.Text className="text-muted">
                      {declineFeedback.length}/300 characters
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Block similar matches in the future"
                      checked={blockSimilar}
                      onChange={(e) => setBlockSimilar(e.target.checked)}
                    />
                    <Form.Text className="text-muted">
                      This will adjust your preferences to avoid similar matches.
                    </Form.Text>
                  </Form.Group>
                </Form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDeclineModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="danger" 
                  onClick={submitDeclineMatch}
                  disabled={!declineReason}
                >
                  Decline Match
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Enhanced Match Details Modal */}
            <Modal show={showMatchDetails} onHide={() => setShowMatchDetails(false)} size="xl">
              <Modal.Header closeButton>
                <Modal.Title>
                  📊 Smart Match Analysis
                  {selectedMatch?.match_type && (
                    <Badge bg="secondary" className="ms-2">{getMatchTypeLabel(selectedMatch.match_type)}</Badge>
                  )}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedMatch && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Card className="mb-3">
                          <Card.Header><strong>Their Item</strong></Card.Header>
                          <Card.Body>
                            <h6>{selectedMatch.item2_details?.title || selectedMatch.their_listing?.title}</h6>
                            <p className="text-muted mb-2">
                              {selectedMatch.item2_details?.description || 'No description available'}
                            </p>
                            <div className="d-flex justify-content-between">
                              <small><strong>Category:</strong> {selectedMatch.item2_details?.category}</small>
                              {selectedMatch.item2_estimated_value && (
                                <small><strong>Est. Value:</strong> ${selectedMatch.item2_estimated_value}</small>
                              )}
                            </div>
                            {selectedMatch.item2_details?.condition && (
                              <div className="mt-2">
                                <Badge bg="info">{selectedMatch.item2_details.condition}</Badge>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="mb-3">
                          <Card.Header><strong>Your Item</strong></Card.Header>
                          <Card.Body>
                            <h6>{selectedMatch.item1_details?.title || selectedMatch.your_listing?.title}</h6>
                            <p className="text-muted mb-2">
                              {selectedMatch.item1_details?.description || 'No description available'}
                            </p>
                            <div className="d-flex justify-content-between">
                              <small><strong>Category:</strong> {selectedMatch.item1_details?.category}</small>
                              {selectedMatch.item1_estimated_value && (
                                <small><strong>Est. Value:</strong> ${selectedMatch.item1_estimated_value}</small>
                              )}
                            </div>
                            {selectedMatch.item1_details?.condition && (
                              <div className="mt-2">
                                <Badge bg="info">{selectedMatch.item1_details.condition}</Badge>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    
                    {/* AI Analysis Section */}
                    <Card className="mb-3">
                      <Card.Header><strong>🤖 AI Analysis & Reasoning</strong></Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={8}>
                            <div className="mb-3">
                              <h6>Why This Match Works:</h6>
                              <p className="text-success">{selectedMatch.ai_reasoning || selectedMatch.ai_reason}</p>
                              
                              {selectedMatch.prediction_reasoning && (
                                <div className="alert alert-info">
                                  <strong>🔮 Prediction Context:</strong> {selectedMatch.prediction_reasoning}
                                </div>
                              )}
                              
                              {selectedMatch.optimization_factors && (
                                <div className="mb-3">
                                  <h6>Special Qualities:</h6>
                                  <div className="d-flex flex-wrap gap-2">
                                    {selectedMatch.optimization_factors.cross_category && (
                                      <Badge bg="info">🔄 Smart Cross-Category</Badge>
                                    )}
                                    {selectedMatch.optimization_factors.bundle_match && (
                                      <Badge bg="warning">📦 Bundle Opportunity</Badge>
                                    )}
                                    {selectedMatch.optimization_factors.high_behavior_match && (
                                      <Badge bg="success">⭐ Perfect for You</Badge>
                                    )}
                                    {selectedMatch.optimization_factors.trending_item && (
                                      <Badge bg="danger">🔥 Trending Item</Badge>
                                    )}
                                    {selectedMatch.optimization_factors.perfect_location && (
                                      <Badge bg="primary">📍 Perfect Distance</Badge>
                                    )}
                                    {selectedMatch.optimization_factors.seasonal_relevance && (
                                      <Badge bg="secondary">🍃 Seasonally Relevant</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className="text-center">
                              <div className="display-4 text-success mb-2">
                                {((selectedMatch.optimized_score || selectedMatch.overall_score || selectedMatch.ai_score) * 100).toFixed(0)}%
                              </div>
                              <div className="text-muted">Overall Match Score</div>
                              <div className="mt-2">
                                <small style={{ color: getConfidenceColor(selectedMatch.confidence_level || 0.5) }}>
                                  🎯 {((selectedMatch.confidence_level || 0.5) * 100).toFixed(0)}% AI Confidence
                                </small>
                              </div>
                            </div>
                          </Col>
                        </Row>
                        
                        {/* Detailed Score Breakdown */}
                        <Row className="mt-4">
                          <Col md={3}>
                            <small><strong>Value Compatibility:</strong></small>
                            <ProgressBar 
                              now={(selectedMatch.value_score || 0) * 100} 
                              label={`${((selectedMatch.value_score || 0) * 100).toFixed(0)}%`}
                              variant="warning"
                            />
                          </Col>
                          <Col md={3}>
                            <small><strong>Location Score:</strong></small>
                            <ProgressBar 
                              now={(selectedMatch.location_score || selectedMatch.geographic_score || 0) * 100} 
                              label={`${((selectedMatch.location_score || selectedMatch.geographic_score || 0) * 100).toFixed(0)}%`}
                              variant="info"
                            />
                          </Col>
                          <Col md={3}>
                            <small><strong>Similarity Score:</strong></small>
                            <ProgressBar 
                              now={(selectedMatch.semantic_score || selectedMatch.category_score || 0) * 100} 
                              label={`${((selectedMatch.semantic_score || selectedMatch.category_score || 0) * 100).toFixed(0)}%`}
                              variant="success"
                            />
                          </Col>
                          <Col md={3}>
                            <small><strong>Personal Fit:</strong></small>
                            <ProgressBar 
                              now={(selectedMatch.behavior_score || 0.5) * 100} 
                              label={`${((selectedMatch.behavior_score || 0.5) * 100).toFixed(0)}%`}
                              variant="primary"
                            />
                          </Col>
                        </Row>
                        
                        {/* Additional Details */}
                        <Row className="mt-3">
                          <Col md={6}>
                            {selectedMatch.distance_km && (
                              <p><strong>Distance:</strong> {formatDistance(selectedMatch.distance_km)}</p>
                            )}
                            {selectedMatch.value_difference_percentage !== undefined && (
                              <p><strong>Value Difference:</strong> {selectedMatch.value_difference_percentage.toFixed(1)}%</p>
                            )}
                          </Col>
                          <Col md={6}>
                            {selectedMatch.market_trend_score && (
                              <p><strong>Market Trend:</strong> {(selectedMatch.market_trend_score * 100).toFixed(0)}%</p>
                            )}
                            {selectedMatch.created_at && (
                              <p><strong>Match Found:</strong> {new Date(selectedMatch.created_at).toLocaleString()}</p>
                            )}
                          </Col>
                        </Row>
                        
                        {/* Detailed Explanation */}
                        {matchExplanations.has(selectedMatch.id) && (
                          <div className="mt-4">
                            <h6>Detailed AI Explanation:</h6>
                            {renderDetailedExplanation(matchExplanations.get(selectedMatch.id))}
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer className="d-flex justify-content-between">
                <div>
                  <Button variant="outline-secondary" onClick={() => setShowMatchDetails(false)}>
                    Close
                  </Button>
                </div>
                {selectedMatch && (
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-danger" 
                      onClick={() => {
                        setShowMatchDetails(false);
                        handleDeclineMatch(selectedMatch);
                      }}
                    >
                      ❌ Decline
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={() => {
                        setShowMatchDetails(false);
                        handleAcceptMatch(selectedMatch);
                      }}
                    >
                      ✓ Accept Match
                    </Button>
                  </div>
                )}
              </Modal.Footer>
            </Modal>
            
            {/* AI Insights Modal */}
            <Modal show={showAIInsights} onHide={() => setShowAIInsights(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>📊 Your AI Trading Insights</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {aiInsights && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Card className="mb-3">
                          <Card.Header><strong>Trading Performance</strong></Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Success Rate:</span>
                              <strong>{(aiInsights.coreMetrics?.trading?.successRate * 100 || 0).toFixed(0)}%</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Match Acceptance:</span>
                              <strong>{(aiInsights.coreMetrics?.matching?.acceptanceRate * 100 || 0).toFixed(0)}%</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Activity Level:</span>
                              <strong>{aiInsights.engagementAnalysis?.engagementLevel || 'Medium'}</strong>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="mb-3">
                          <Card.Header><strong>AI Segmentation</strong></Card.Header>
                          <Card.Body>
                            <div className="text-center">
                              <h5 className="text-primary">{aiInsights.userSegmentation?.segment || 'Regular Trader'}</h5>
                              <p className="text-muted">
                                {aiInsights.userSegmentation?.confidence ? 
                                  `${(aiInsights.userSegmentation.confidence * 100).toFixed(0)}% confidence` : 
                                  'Based on your trading patterns'
                                }
                              </p>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    
                    {aiInsights.insights && aiInsights.insights.length > 0 && (
                      <Card className="mb-3">
                        <Card.Header><strong>💡 Personalized Insights</strong></Card.Header>
                        <Card.Body>
                          {aiInsights.insights.slice(0, 3).map((insight, index) => (
                            <Alert key={index} variant="info">
                              <strong>{insight.title || 'Insight'}:</strong> {insight.description || insight.message}
                            </Alert>
                          ))}
                        </Card.Body>
                      </Card>
                    )}
                    
                    {aiInsights.peerComparisons && (
                      <Card>
                        <Card.Header><strong>📈 Compared to Similar Users</strong></Card.Header>
                        <Card.Body>
                          <Row>
                            {Object.entries(aiInsights.peerComparisons.comparisons || {}).map(([metric, comparison]) => (
                              <Col md={6} key={metric}>
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between">
                                    <span className="text-capitalize">{metric.replace('_', ' ')}:</span>
                                    <strong>{comparison.comparison}</strong>
                                  </div>
                                  <small className="text-muted">{comparison.percentile.toFixed(0)}th percentile</small>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowAIInsights(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Proactive Matches Modal */}
            <Modal show={showProactiveMatches} onHide={() => setShowProactiveMatches(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>🔮 AI Predictions & Opportunities</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {proactiveMatches.length > 0 ? (
                  <>
                    <Alert variant="info">
                      <strong>🤖 AI Predictions:</strong> These matches were found based on your behavior patterns, 
                      trending items, and predictive analysis.
                    </Alert>
                    
                    {proactiveMatches.slice(0, 10).map((match, index) => (
                      <Card key={index} className="mb-3">
                        <Card.Body>
                          <Row>
                            <Col md={8}>
                              <h6>{match.their_listing?.title || match.item2_details?.title}</h6>
                              <p className="text-muted small mb-2">
                                {match.prediction_reasoning || match.ai_reasoning}
                              </p>
                              <div className="d-flex gap-2">
                                <Badge bg="primary">
                                  {(match.prediction_confidence * 100 || 70).toFixed(0)}% predicted interest
                                </Badge>
                                {match.prediction_type && (
                                  <Badge bg="secondary">{match.prediction_type}</Badge>
                                )}
                              </div>
                            </Col>
                            <Col md={4} className="text-end">
                              <div className="mb-2">
                                <strong>${match.their_listing?.estimated_value || match.item2_details?.estimated_value || 'N/A'}</strong>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline-primary"
                                onClick={() => handleViewMatchDetails(match)}
                              >
                                View Details
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Alert variant="info">
                    No predictive matches found at the moment. Keep using the platform and our AI will learn your preferences!
                  </Alert>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowProactiveMatches(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MatchesDashboard;