/**
 * Smart Match Filters Component
 * 
 * Advanced filtering and sorting component that integrates with the AI matching system
 * to provide intelligent filtering options based on user preferences and AI insights.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Row, Col, Button, Badge, Dropdown, ButtonGroup,
  OverlayTrigger, Tooltip, Collapse 
} from 'react-bootstrap';

const SmartMatchFilters = ({ 
  onFiltersChange, 
  currentFilters = {}, 
  matches = [], 
  aiInsights = null,
  userPreferences = null 
}) => {
  const [filters, setFilters] = useState({
    sortBy: 'ai_score',
    filterBy: 'all',
    minScore: 0.5,
    maxDistance: 100,
    categories: [],
    matchTypes: [],
    showOnlyOptimized: false,
    showOnlyPredicted: false,
    confidenceThreshold: 0.6,
    valueRange: { min: null, max: null },
    timeRange: 'all',
    ...currentFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState([]);

  useEffect(() => {
    generateSmartSuggestions();
  }, [matches, aiInsights]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const generateSmartSuggestions = () => {
    const suggestions = [];

    // Suggest hiding low-confidence matches if user has good options
    const highConfidenceMatches = matches.filter(m => (m.confidence_level || 0.5) > 0.8);
    if (highConfidenceMatches.length >= 5) {
      suggestions.push({
        type: 'confidence',
        title: 'Focus on High-Confidence Matches',
        description: `${highConfidenceMatches.length} matches have 80%+ AI confidence`,
        action: () => setFilters(prev => ({ ...prev, confidenceThreshold: 0.8 }))
      });
    }

    // Suggest category focus based on user behavior
    if (aiInsights?.behaviorPatterns?.category) {
      const topCategories = Object.entries(aiInsights.behaviorPatterns.category.interactions || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

      if (topCategories.length > 0) {
        suggestions.push({
          type: 'category',
          title: 'Focus on Your Favorite Categories',
          description: `You're most active in: ${topCategories.join(', ')}`,
          action: () => setFilters(prev => ({ ...prev, categories: topCategories }))
        });
      }
    }

    // Suggest distance optimization based on user's successful trades
    const localMatches = matches.filter(m => m.distance_km && m.distance_km <= 25);
    if (localMatches.length >= 3) {
      suggestions.push({
        type: 'location',
        title: 'Focus on Local Matches',
        description: `${localMatches.length} matches within 25km`,
        action: () => setFilters(prev => ({ ...prev, maxDistance: 25 }))
      });
    }

    // Suggest showing only AI-optimized matches
    const optimizedMatches = matches.filter(m => m.optimization_factors && Object.keys(m.optimization_factors).length > 0);
    if (optimizedMatches.length >= 3) {
      suggestions.push({
        type: 'optimization',
        title: 'Show Only AI-Optimized Matches',
        description: `${optimizedMatches.length} matches have special AI optimizations`,
        action: () => setFilters(prev => ({ ...prev, showOnlyOptimized: true }))
      });
    }

    setSmartSuggestions(suggestions);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCategoryToggle = (category) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleMatchTypeToggle = (matchType) => {
    setFilters(prev => ({
      ...prev,
      matchTypes: prev.matchTypes.includes(matchType)
        ? prev.matchTypes.filter(t => t !== matchType)
        : [...prev.matchTypes, matchType]
    }));
  };

  const resetFilters = () => {
    setFilters({
      sortBy: 'ai_score',
      filterBy: 'all',
      minScore: 0.5,
      maxDistance: 100,
      categories: [],
      matchTypes: [],
      showOnlyOptimized: false,
      showOnlyPredicted: false,
      confidenceThreshold: 0.6,
      valueRange: { min: null, max: null },
      timeRange: 'all'
    });
  };

  const applySmartPreset = (preset) => {
    switch (preset) {
      case 'high_quality':
        setFilters(prev => ({
          ...prev,
          minScore: 0.8,
          confidenceThreshold: 0.8,
          showOnlyOptimized: true
        }));
        break;
      case 'local_focus':
        setFilters(prev => ({
          ...prev,
          maxDistance: 25,
          sortBy: 'distance'
        }));
        break;
      case 'perfect_match':
        setFilters(prev => ({
          ...prev,
          minScore: 0.9,
          confidenceThreshold: 0.9,
          matchTypes: ['premium', 'semantic']
        }));
        break;
      case 'discovery':
        setFilters(prev => ({
          ...prev,
          showOnlyPredicted: true,
          matchTypes: ['cross_category', 'bundle']
        }));
        break;
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.minScore > 0.5) count++;
    if (filters.maxDistance < 100) count++;
    if (filters.categories.length > 0) count++;
    if (filters.matchTypes.length > 0) count++;
    if (filters.showOnlyOptimized) count++;
    if (filters.showOnlyPredicted) count++;
    if (filters.confidenceThreshold > 0.6) count++;
    if (filters.valueRange.min || filters.valueRange.max) count++;
    if (filters.timeRange !== 'all') count++;
    return count;
  };

  const availableCategories = [...new Set(matches.map(m => 
    m.item2_details?.category || m.their_listing?.category
  ).filter(Boolean))];

  const availableMatchTypes = [...new Set(matches.map(m => m.match_type).filter(Boolean))];

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">🎯 Smart Filters</h6>
          <div className="d-flex gap-2 align-items-center">
            {getActiveFilterCount() > 0 && (
              <Badge bg="primary">{getActiveFilterCount()} active</Badge>
            )}
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="mb-3">
            <div className="small text-muted mb-2">💡 Smart Suggestions:</div>
            <div className="d-flex flex-wrap gap-2">
              {smartSuggestions.map((suggestion, index) => (
                <OverlayTrigger
                  key={index}
                  placement="top"
                  overlay={<Tooltip>{suggestion.description}</Tooltip>}
                >
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={suggestion.action}
                  >
                    {suggestion.title}
                  </Button>
                </OverlayTrigger>
              ))}
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-3">
          <div className="small text-muted mb-2">⚡ Quick Presets:</div>
          <ButtonGroup size="sm">
            <Button variant="outline-primary" onClick={() => applySmartPreset('high_quality')}>
              High Quality
            </Button>
            <Button variant="outline-primary" onClick={() => applySmartPreset('local_focus')}>
              Local Focus
            </Button>
            <Button variant="outline-primary" onClick={() => applySmartPreset('perfect_match')}>
              Perfect Match
            </Button>
            <Button variant="outline-primary" onClick={() => applySmartPreset('discovery')}>
              Discovery
            </Button>
          </ButtonGroup>
        </div>

        {/* Basic Filters */}
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small">Sort By:</Form.Label>
              <Form.Select
                size="sm"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="ai_score">🤖 AI Score</option>
                <option value="confidence">🎯 Confidence</option>
                <option value="distance">📍 Distance</option>
                <option value="value">💰 Value</option>
                <option value="recent">🕒 Most Recent</option>
                <option value="semantic">🧠 Similarity</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small">Filter Type:</Form.Label>
              <Form.Select
                size="sm"
                value={filters.filterBy}
                onChange={(e) => handleFilterChange('filterBy', e.target.value)}
              >
                <option value="all">All Matches</option>
                <option value="high_score">High Score (70%+)</option>
                <option value="high_confidence">High Confidence (80%+)</option>
                <option value="nearby">Nearby (25km)</option>
                <option value="optimized">AI Optimized</option>
                <option value="predicted">Predicted Interests</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small">Min Score: {(filters.minScore * 100).toFixed(0)}%</Form.Label>
              <Form.Range
                min={0.3}
                max={1.0}
                step={0.05}
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', parseFloat(e.target.value))}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small">Max Distance: {filters.maxDistance}km</Form.Label>
              <Form.Range
                min={5}
                max={200}
                step={5}
                value={filters.maxDistance}
                onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Advanced Filters */}
        <Collapse in={showAdvanced}>
          <div>
            <hr />
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Categories:</Form.Label>
                  <div className="d-flex flex-wrap gap-1">
                    {availableCategories.map(category => (
                      <Badge
                        key={category}
                        bg={filters.categories.includes(category) ? "primary" : "outline-secondary"}
                        className="cursor-pointer"
                        onClick={() => handleCategoryToggle(category)}
                        style={{ cursor: 'pointer' }}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Match Types:</Form.Label>
                  <div className="d-flex flex-wrap gap-1">
                    {availableMatchTypes.map(type => (
                      <Badge
                        key={type}
                        bg={filters.matchTypes.includes(type) ? "success" : "outline-secondary"}
                        className="cursor-pointer"
                        onClick={() => handleMatchTypeToggle(type)}
                        style={{ cursor: 'pointer' }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Confidence Threshold: {(filters.confidenceThreshold * 100).toFixed(0)}%</Form.Label>
                  <Form.Range
                    min={0.3}
                    max={1.0}
                    step={0.05}
                    value={filters.confidenceThreshold}
                    onChange={(e) => handleFilterChange('confidenceThreshold', parseFloat(e.target.value))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Value Range:</Form.Label>
                  <Row>
                    <Col xs={6}>
                      <Form.Control
                        size="sm"
                        type="number"
                        placeholder="Min $"
                        value={filters.valueRange.min || ''}
                        onChange={(e) => handleFilterChange('valueRange', {
                          ...filters.valueRange,
                          min: e.target.value ? parseFloat(e.target.value) : null
                        })}
                      />
                    </Col>
                    <Col xs={6}>
                      <Form.Control
                        size="sm"
                        type="number"
                        placeholder="Max $"
                        value={filters.valueRange.max || ''}
                        onChange={(e) => handleFilterChange('valueRange', {
                          ...filters.valueRange,
                          max: e.target.value ? parseFloat(e.target.value) : null
                        })}
                      />
                    </Col>
                  </Row>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small">Time Range:</Form.Label>
                  <Form.Select
                    size="sm"
                    value={filters.timeRange}
                    onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="show-optimized"
                  label="Show only AI-optimized matches"
                  checked={filters.showOnlyOptimized}
                  onChange={(e) => handleFilterChange('showOnlyOptimized', e.target.checked)}
                />
              </Col>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="show-predicted"
                  label="Show only predicted interests"
                  checked={filters.showOnlyPredicted}
                  onChange={(e) => handleFilterChange('showOnlyPredicted', e.target.checked)}
                />
              </Col>
            </Row>
          </div>
        </Collapse>

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={resetFilters}
            disabled={getActiveFilterCount() === 0}
          >
            Reset All
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SmartMatchFilters;