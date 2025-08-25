#!/usr/bin/env python3
"""
Price Validation Engine for Trading Post
Validates and improves AI price estimates using real-time market data
"""

import asyncio
import json
import logging
import math
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
import numpy as np
from scipy import stats

# Import our market data system
from real_time_market_data import (
    market_data_aggregator, MarketDataSummary, MarketListing, MarketDataSource
)

# Import existing pricing components
from advanced_price_estimation import (
    AdvancedPriceEstimate, ItemAttributes, AdvancedPriceEstimationEngine
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ValidationResult(Enum):
    """Price validation results"""
    VALIDATED = "validated"
    ADJUSTED_UP = "adjusted_up"
    ADJUSTED_DOWN = "adjusted_down"
    INSUFFICIENT_DATA = "insufficient_data"
    SIGNIFICANT_DEVIATION = "significant_deviation"
    MARKET_ANOMALY = "market_anomaly"


@dataclass
class PriceValidation:
    """Price validation result"""
    original_estimate: float
    validated_price: float
    validation_result: ValidationResult
    confidence_score: float
    
    # Market comparison
    market_avg_price: float
    market_median_price: float
    price_vs_market_percent: float
    
    # Validation details
    market_data_points: int
    market_confidence: float
    validation_method: str
    adjustment_factors: Dict[str, float]
    
    # Recommendations
    price_recommendation: str
    market_insights: List[str]
    risk_assessment: str
    
    # Metadata
    validation_timestamp: datetime
    market_data_age_hours: float


@dataclass
class ValidationRule:
    """Price validation rule"""
    name: str
    description: str
    weight: float
    min_confidence_threshold: float
    max_deviation_percent: float
    adjustment_factor: float
    enabled: bool = True


class PriceValidationEngine:
    """
    Engine for validating AI price estimates against real market data
    """
    
    def __init__(self):
        self.market_aggregator = market_data_aggregator
        self.db_path = "trading_post.db"
        self._initialize_database()
        
        # Validation rules
        self.validation_rules = [
            ValidationRule(
                name="market_price_alignment",
                description="Align with market average price",
                weight=0.3,
                min_confidence_threshold=0.6,
                max_deviation_percent=25.0,
                adjustment_factor=0.7
            ),
            ValidationRule(
                name="median_price_check",
                description="Compare against market median",
                weight=0.25,
                min_confidence_threshold=0.5,
                max_deviation_percent=30.0,
                adjustment_factor=0.6
            ),
            ValidationRule(
                name="condition_price_adjustment",
                description="Adjust for item condition vs market",
                weight=0.2,
                min_confidence_threshold=0.4,
                max_deviation_percent=40.0,
                adjustment_factor=0.8
            ),
            ValidationRule(
                name="market_velocity_factor",
                description="Consider market velocity in pricing",
                weight=0.15,
                min_confidence_threshold=0.3,
                max_deviation_percent=20.0,
                adjustment_factor=0.5
            ),
            ValidationRule(
                name="source_reliability_weight",
                description="Weight by data source reliability",
                weight=0.1,
                min_confidence_threshold=0.5,
                max_deviation_percent=15.0,
                adjustment_factor=0.4
            )
        ]
        
        # Confidence thresholds
        self.min_market_data_points = 3
        self.high_confidence_threshold = 0.8
        self.adjustment_sensitivity = 0.15  # How sensitive to make adjustments
        
        # Source reliability scores
        self.source_reliability = {
            MarketDataSource.EBAY_COMPLETED: 0.9,
            MarketDataSource.EBAY_ACTIVE: 0.7,
            MarketDataSource.AMAZON_CURRENT: 0.8,
            MarketDataSource.FACEBOOK_MARKETPLACE: 0.6,
            MarketDataSource.MERCARI: 0.7,
            MarketDataSource.POSHMARK: 0.6,
            MarketDataSource.REVERB: 0.8,
            MarketDataSource.DISCOGS: 0.8,
            MarketDataSource.TCGPLAYER: 0.8
        }
    
    def _initialize_database(self):
        """Initialize price validation database tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Price validations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_validations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item_query TEXT NOT NULL,
                    category TEXT,
                    original_estimate REAL NOT NULL,
                    validated_price REAL NOT NULL,
                    validation_result TEXT NOT NULL,
                    confidence_score REAL NOT NULL,
                    
                    market_avg_price REAL,
                    market_median_price REAL,
                    price_vs_market_percent REAL,
                    market_data_points INTEGER,
                    market_confidence REAL,
                    
                    validation_method TEXT,
                    adjustment_factors TEXT,
                    price_recommendation TEXT,
                    market_insights TEXT,
                    risk_assessment TEXT,
                    
                    validation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    market_data_age_hours REAL
                )
            """)
            
            # Validation performance tracking
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS validation_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    validation_rule TEXT NOT NULL,
                    accuracy_score REAL NOT NULL,
                    adjustment_count INTEGER DEFAULT 0,
                    success_count INTEGER DEFAULT 0,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("Price validation database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    async def validate_price(self, ai_estimate: AdvancedPriceEstimate,
                           item_attributes: ItemAttributes,
                           force_market_refresh: bool = False) -> PriceValidation:
        """
        Validate AI price estimate against real market data
        """
        try:
            start_time = time.time()
            
            # Generate market query from item attributes
            market_query = self._generate_market_query(item_attributes)
            
            # Get market data
            market_data = await self.market_aggregator.get_market_data(
                market_query, 
                item_attributes.category,
                force_refresh=force_market_refresh
            )
            
            # Perform validation
            validation = await self._perform_validation(
                ai_estimate, item_attributes, market_data
            )
            
            # Store validation results
            await self._store_validation(validation, market_query, item_attributes.category)
            
            # Update rule performance
            await self._update_rule_performance(validation)
            
            processing_time = time.time() - start_time
            logger.info(f"Price validation completed in {processing_time:.2f}s: {validation.validation_result.value}")
            
            return validation
            
        except Exception as e:
            logger.error(f"Price validation failed: {e}")
            
            # Return fallback validation
            return PriceValidation(
                original_estimate=ai_estimate.estimated_price,
                validated_price=ai_estimate.estimated_price,
                validation_result=ValidationResult.INSUFFICIENT_DATA,
                confidence_score=0.3,
                market_avg_price=0.0,
                market_median_price=0.0,
                price_vs_market_percent=0.0,
                market_data_points=0,
                market_confidence=0.0,
                validation_method="error_fallback",
                adjustment_factors={},
                price_recommendation="Use AI estimate with caution",
                market_insights=["Validation failed due to technical error"],
                risk_assessment="High risk - validation unavailable",
                validation_timestamp=datetime.utcnow(),
                market_data_age_hours=0.0
            )
    
    def _generate_market_query(self, item_attributes: ItemAttributes) -> str:
        """Generate market search query from item attributes"""
        try:
            query_parts = []
            
            # Add brand if available
            if item_attributes.brand and item_attributes.brand.lower() != 'unknown':
                query_parts.append(item_attributes.brand)
            
            # Add model/name
            if item_attributes.model:
                query_parts.append(item_attributes.model)
            elif item_attributes.name:
                query_parts.append(item_attributes.name)
            
            # Add key specifications
            if hasattr(item_attributes, 'key_features') and item_attributes.key_features:
                # Add most distinctive features
                for feature in item_attributes.key_features[:2]:
                    if len(feature) > 2:  # Avoid short/generic terms
                        query_parts.append(feature)
            
            # Add category if specific
            if item_attributes.category and item_attributes.category not in ['general', 'other', 'unknown']:
                query_parts.append(item_attributes.category)
            
            # Combine and clean
            query = " ".join(query_parts)
            
            # Clean up the query
            query = self._clean_market_query(query)
            
            return query
            
        except Exception as e:
            logger.error(f"Error generating market query: {e}")
            return item_attributes.category or "general item"
    
    def _clean_market_query(self, query: str) -> str:
        """Clean and optimize market search query"""
        try:
            # Remove common noise words
            noise_words = ['used', 'new', 'excellent', 'good', 'fair', 'poor', 'condition', 'item']
            
            words = query.lower().split()
            cleaned_words = [word for word in words if word not in noise_words]
            
            # Limit query length for API compatibility
            if len(cleaned_words) > 5:
                cleaned_words = cleaned_words[:5]
            
            return " ".join(cleaned_words)
            
        except Exception as e:
            logger.error(f"Error cleaning market query: {e}")
            return query
    
    async def _perform_validation(self, ai_estimate: AdvancedPriceEstimate,
                                 item_attributes: ItemAttributes,
                                 market_data: MarketDataSummary) -> PriceValidation:
        """Perform the actual price validation"""
        try:
            original_price = ai_estimate.estimated_price
            
            # Check if we have sufficient market data
            if market_data.total_listings < self.min_market_data_points:
                return self._create_insufficient_data_validation(ai_estimate, market_data)
            
            # Calculate validation metrics
            validation_metrics = self._calculate_validation_metrics(
                ai_estimate, item_attributes, market_data
            )
            
            # Apply validation rules
            adjustment_factors = {}
            total_adjustment = 0.0
            total_weight = 0.0
            
            for rule in self.validation_rules:
                if not rule.enabled or market_data.confidence_level < rule.min_confidence_threshold:
                    continue
                
                adjustment = self._apply_validation_rule(
                    rule, ai_estimate, item_attributes, market_data, validation_metrics
                )
                
                adjustment_factors[rule.name] = adjustment
                total_adjustment += adjustment * rule.weight
                total_weight += rule.weight
            
            # Calculate final adjustment
            if total_weight > 0:
                final_adjustment_factor = total_adjustment / total_weight
            else:
                final_adjustment_factor = 0.0
            
            # Apply adjustment with sensitivity control
            adjusted_price = original_price * (1 + final_adjustment_factor * self.adjustment_sensitivity)
            
            # Determine validation result
            validation_result = self._determine_validation_result(
                original_price, adjusted_price, market_data, final_adjustment_factor
            )
            
            # Calculate confidence score
            confidence_score = self._calculate_validation_confidence(
                market_data, validation_metrics, adjustment_factors
            )
            
            # Generate insights and recommendations
            insights = self._generate_market_insights(market_data, validation_metrics)
            recommendation = self._generate_price_recommendation(
                validation_result, original_price, adjusted_price, market_data
            )
            risk_assessment = self._assess_pricing_risk(
                validation_result, market_data, validation_metrics
            )
            
            return PriceValidation(
                original_estimate=original_price,
                validated_price=adjusted_price,
                validation_result=validation_result,
                confidence_score=confidence_score,
                market_avg_price=market_data.avg_price,
                market_median_price=market_data.median_price,
                price_vs_market_percent=((original_price - market_data.avg_price) / market_data.avg_price * 100) if market_data.avg_price > 0 else 0,
                market_data_points=market_data.total_listings,
                market_confidence=market_data.confidence_level,
                validation_method="comprehensive_rule_based",
                adjustment_factors=adjustment_factors,
                price_recommendation=recommendation,
                market_insights=insights,
                risk_assessment=risk_assessment,
                validation_timestamp=datetime.utcnow(),
                market_data_age_hours=market_data.data_age_hours
            )
            
        except Exception as e:
            logger.error(f"Error performing validation: {e}")
            return self._create_insufficient_data_validation(ai_estimate, market_data)
    
    def _calculate_validation_metrics(self, ai_estimate: AdvancedPriceEstimate,
                                    item_attributes: ItemAttributes,
                                    market_data: MarketDataSummary) -> Dict[str, float]:
        """Calculate validation metrics"""
        try:
            metrics = {}
            
            original_price = ai_estimate.estimated_price
            market_avg = market_data.avg_price
            market_median = market_data.median_price
            
            # Price deviation metrics
            if market_avg > 0:
                metrics['price_vs_avg_percent'] = (original_price - market_avg) / market_avg * 100
                metrics['price_vs_avg_ratio'] = original_price / market_avg
            else:
                metrics['price_vs_avg_percent'] = 0.0
                metrics['price_vs_avg_ratio'] = 1.0
            
            if market_median > 0:
                metrics['price_vs_median_percent'] = (original_price - market_median) / market_median * 100
                metrics['price_vs_median_ratio'] = original_price / market_median
            else:
                metrics['price_vs_median_percent'] = 0.0
                metrics['price_vs_median_ratio'] = 1.0
            
            # Market spread analysis
            if market_data.max_price > market_data.min_price:
                price_range = market_data.max_price - market_data.min_price
                metrics['price_position_in_range'] = (original_price - market_data.min_price) / price_range
            else:
                metrics['price_position_in_range'] = 0.5
            
            # Volatility metrics
            if market_avg > 0:
                metrics['market_volatility'] = market_data.price_std_dev / market_avg
            else:
                metrics['market_volatility'] = 0.0
            
            # Data quality metrics
            metrics['data_quality_score'] = min(1.0, market_data.total_listings / 10.0)
            metrics['data_freshness_score'] = max(0.0, 1.0 - market_data.data_age_hours / 48.0)
            
            # Source diversity
            source_count = len(market_data.listings_by_source)
            metrics['source_diversity_score'] = min(1.0, source_count / 3.0)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating validation metrics: {e}")
            return {}
    
    def _apply_validation_rule(self, rule: ValidationRule,
                              ai_estimate: AdvancedPriceEstimate,
                              item_attributes: ItemAttributes,
                              market_data: MarketDataSummary,
                              metrics: Dict[str, float]) -> float:
        """Apply a specific validation rule"""
        try:
            if rule.name == "market_price_alignment":
                return self._apply_market_price_alignment_rule(
                    rule, ai_estimate, market_data, metrics
                )
            elif rule.name == "median_price_check":
                return self._apply_median_price_check_rule(
                    rule, ai_estimate, market_data, metrics
                )
            elif rule.name == "condition_price_adjustment":
                return self._apply_condition_adjustment_rule(
                    rule, ai_estimate, item_attributes, market_data, metrics
                )
            elif rule.name == "market_velocity_factor":
                return self._apply_market_velocity_rule(
                    rule, ai_estimate, market_data, metrics
                )
            elif rule.name == "source_reliability_weight":
                return self._apply_source_reliability_rule(
                    rule, ai_estimate, market_data, metrics
                )
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error applying validation rule {rule.name}: {e}")
            return 0.0
    
    def _apply_market_price_alignment_rule(self, rule: ValidationRule,
                                         ai_estimate: AdvancedPriceEstimate,
                                         market_data: MarketDataSummary,
                                         metrics: Dict[str, float]) -> float:
        """Apply market price alignment rule"""
        deviation_percent = abs(metrics.get('price_vs_avg_percent', 0))
        
        if deviation_percent <= rule.max_deviation_percent:
            # Small adjustment towards market average
            target_ratio = metrics.get('price_vs_avg_ratio', 1.0)
            adjustment = (1.0 - target_ratio) * rule.adjustment_factor
            return adjustment
        else:
            # Significant deviation - larger adjustment
            target_ratio = metrics.get('price_vs_avg_ratio', 1.0)
            adjustment = (1.0 - target_ratio) * 0.8  # Stronger adjustment
            return adjustment
    
    def _apply_median_price_check_rule(self, rule: ValidationRule,
                                     ai_estimate: AdvancedPriceEstimate,
                                     market_data: MarketDataSummary,
                                     metrics: Dict[str, float]) -> float:
        """Apply median price check rule"""
        deviation_percent = abs(metrics.get('price_vs_median_percent', 0))
        
        if deviation_percent <= rule.max_deviation_percent:
            target_ratio = metrics.get('price_vs_median_ratio', 1.0)
            adjustment = (1.0 - target_ratio) * rule.adjustment_factor
            return adjustment
        else:
            return 0.0  # Don't adjust if deviation is too large
    
    def _apply_condition_adjustment_rule(self, rule: ValidationRule,
                                       ai_estimate: AdvancedPriceEstimate,
                                       item_attributes: ItemAttributes,
                                       market_data: MarketDataSummary,
                                       metrics: Dict[str, float]) -> float:
        """Apply condition-based price adjustment rule"""
        try:
            # Get condition impact from market data
            condition_impact = market_data.condition_price_impact
            
            # Estimate item condition (this would come from AI analysis)
            estimated_condition = getattr(item_attributes, 'condition', 'good')
            
            if estimated_condition in condition_impact:
                market_condition_multiplier = condition_impact[estimated_condition]
                expected_adjustment = (market_condition_multiplier - 1.0) * rule.adjustment_factor
                return expected_adjustment
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error applying condition adjustment rule: {e}")
            return 0.0
    
    def _apply_market_velocity_rule(self, rule: ValidationRule,
                                  ai_estimate: AdvancedPriceEstimate,
                                  market_data: MarketDataSummary,
                                  metrics: Dict[str, float]) -> float:
        """Apply market velocity rule"""
        velocity = market_data.market_velocity
        
        if velocity > 0.7:  # Fast-moving market
            return 0.05  # Slight price increase
        elif velocity < 0.3:  # Slow-moving market
            return -0.05  # Slight price decrease
        else:
            return 0.0
    
    def _apply_source_reliability_rule(self, rule: ValidationRule,
                                     ai_estimate: AdvancedPriceEstimate,
                                     market_data: MarketDataSummary,
                                     metrics: Dict[str, float]) -> float:
        """Apply source reliability weighting rule"""
        try:
            # Calculate weighted average based on source reliability
            total_weighted_price = 0.0
            total_weight = 0.0
            
            for source_name, avg_price in market_data.avg_price_by_source.items():
                try:
                    source = MarketDataSource(source_name)
                    reliability = self.source_reliability.get(source, 0.5)
                    total_weighted_price += avg_price * reliability
                    total_weight += reliability
                except ValueError:
                    continue
            
            if total_weight > 0:
                weighted_avg_price = total_weighted_price / total_weight
                if weighted_avg_price > 0:
                    target_ratio = ai_estimate.estimated_price / weighted_avg_price
                    adjustment = (1.0 - target_ratio) * rule.adjustment_factor
                    return adjustment
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error applying source reliability rule: {e}")
            return 0.0
    
    def _determine_validation_result(self, original_price: float, adjusted_price: float,
                                   market_data: MarketDataSummary, 
                                   adjustment_factor: float) -> ValidationResult:
        """Determine the validation result"""
        try:
            price_change_percent = abs(adjusted_price - original_price) / original_price * 100
            
            if price_change_percent < 5:
                return ValidationResult.VALIDATED
            elif adjusted_price > original_price:
                if price_change_percent > 25:
                    return ValidationResult.SIGNIFICANT_DEVIATION
                else:
                    return ValidationResult.ADJUSTED_UP
            else:
                if price_change_percent > 25:
                    return ValidationResult.SIGNIFICANT_DEVIATION
                else:
                    return ValidationResult.ADJUSTED_DOWN
                    
        except Exception as e:
            logger.error(f"Error determining validation result: {e}")
            return ValidationResult.INSUFFICIENT_DATA
    
    def _calculate_validation_confidence(self, market_data: MarketDataSummary,
                                       metrics: Dict[str, float],
                                       adjustment_factors: Dict[str, float]) -> float:
        """Calculate validation confidence score"""
        try:
            confidence_factors = []
            
            # Market data quality
            confidence_factors.append(market_data.confidence_level * 0.3)
            
            # Data freshness
            data_freshness = max(0.0, 1.0 - market_data.data_age_hours / 24.0)
            confidence_factors.append(data_freshness * 0.2)
            
            # Source diversity
            source_diversity = metrics.get('source_diversity_score', 0.5)
            confidence_factors.append(source_diversity * 0.2)
            
            # Adjustment consistency
            if adjustment_factors:
                adjustments = list(adjustment_factors.values())
                adjustment_std = np.std(adjustments) if len(adjustments) > 1 else 0.0
                adjustment_consistency = max(0.0, 1.0 - adjustment_std)
                confidence_factors.append(adjustment_consistency * 0.3)
            else:
                confidence_factors.append(0.5 * 0.3)
            
            return sum(confidence_factors)
            
        except Exception as e:
            logger.error(f"Error calculating validation confidence: {e}")
            return 0.5
    
    def _generate_market_insights(self, market_data: MarketDataSummary,
                                 metrics: Dict[str, float]) -> List[str]:
        """Generate market insights"""
        insights = []
        
        try:
            # Price trend insight
            if market_data.price_trend == "increasing":
                insights.append("Market prices are trending upward")
            elif market_data.price_trend == "decreasing":
                insights.append("Market prices are trending downward")
            else:
                insights.append("Market prices are relatively stable")
            
            # Market velocity insight
            if market_data.market_velocity > 0.7:
                insights.append("Items in this category sell quickly")
            elif market_data.market_velocity < 0.3:
                insights.append("Items in this category move slowly")
            
            # Price volatility insight
            volatility = metrics.get('market_volatility', 0)
            if volatility > 0.3:
                insights.append("High price volatility - prices vary significantly")
            elif volatility < 0.1:
                insights.append("Stable pricing - consistent market values")
            
            # Data quality insight
            if market_data.total_listings >= 20:
                insights.append("Strong market data with many comparable sales")
            elif market_data.total_listings >= 10:
                insights.append("Good market data available")
            else:
                insights.append("Limited market data - use estimate cautiously")
            
        except Exception as e:
            logger.error(f"Error generating market insights: {e}")
            insights.append("Market analysis unavailable")
        
        return insights
    
    def _generate_price_recommendation(self, validation_result: ValidationResult,
                                     original_price: float, validated_price: float,
                                     market_data: MarketDataSummary) -> str:
        """Generate price recommendation"""
        try:
            price_change = ((validated_price - original_price) / original_price * 100) if original_price > 0 else 0
            
            if validation_result == ValidationResult.VALIDATED:
                return f"AI estimate of ${original_price:.2f} is well-supported by market data"
            elif validation_result == ValidationResult.ADJUSTED_UP:
                return f"Consider pricing at ${validated_price:.2f} ({price_change:+.1f}%) based on market data"
            elif validation_result == ValidationResult.ADJUSTED_DOWN:
                return f"Consider pricing at ${validated_price:.2f} ({price_change:+.1f}%) based on market data"
            elif validation_result == ValidationResult.SIGNIFICANT_DEVIATION:
                return f"Significant market deviation detected. Review pricing carefully."
            else:
                return "Insufficient market data for reliable validation"
                
        except Exception as e:
            logger.error(f"Error generating price recommendation: {e}")
            return "Price recommendation unavailable"
    
    def _assess_pricing_risk(self, validation_result: ValidationResult,
                           market_data: MarketDataSummary,
                           metrics: Dict[str, float]) -> str:
        """Assess pricing risk"""
        try:
            risk_factors = []
            
            # Data quality risk
            if market_data.total_listings < 5:
                risk_factors.append("Limited market data")
            
            # Data freshness risk
            if market_data.data_age_hours > 24:
                risk_factors.append("Outdated market data")
            
            # Volatility risk
            volatility = metrics.get('market_volatility', 0)
            if volatility > 0.4:
                risk_factors.append("High price volatility")
            
            # Validation risk
            if validation_result == ValidationResult.SIGNIFICANT_DEVIATION:
                risk_factors.append("Significant price deviation")
            elif validation_result == ValidationResult.INSUFFICIENT_DATA:
                risk_factors.append("Insufficient validation data")
            
            if not risk_factors:
                return "Low risk - well-supported pricing"
            elif len(risk_factors) == 1:
                return f"Moderate risk - {risk_factors[0]}"
            else:
                return f"High risk - {', '.join(risk_factors)}"
                
        except Exception as e:
            logger.error(f"Error assessing pricing risk: {e}")
            return "Risk assessment unavailable"
    
    def _create_insufficient_data_validation(self, ai_estimate: AdvancedPriceEstimate,
                                           market_data: MarketDataSummary) -> PriceValidation:
        """Create validation result for insufficient data"""
        return PriceValidation(
            original_estimate=ai_estimate.estimated_price,
            validated_price=ai_estimate.estimated_price,
            validation_result=ValidationResult.INSUFFICIENT_DATA,
            confidence_score=0.3,
            market_avg_price=market_data.avg_price,
            market_median_price=market_data.median_price,
            price_vs_market_percent=0.0,
            market_data_points=market_data.total_listings,
            market_confidence=market_data.confidence_level,
            validation_method="insufficient_data",
            adjustment_factors={},
            price_recommendation="Use AI estimate with caution - limited market data",
            market_insights=["Insufficient market data for validation"],
            risk_assessment="High risk - no market validation available",
            validation_timestamp=datetime.utcnow(),
            market_data_age_hours=market_data.data_age_hours
        )
    
    async def _store_validation(self, validation: PriceValidation, 
                              item_query: str, category: str):
        """Store validation results in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO price_validations 
                (item_query, category, original_estimate, validated_price, validation_result,
                 confidence_score, market_avg_price, market_median_price, price_vs_market_percent,
                 market_data_points, market_confidence, validation_method, adjustment_factors,
                 price_recommendation, market_insights, risk_assessment, market_data_age_hours)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item_query, category, validation.original_estimate, validation.validated_price,
                validation.validation_result.value, validation.confidence_score,
                validation.market_avg_price, validation.market_median_price,
                validation.price_vs_market_percent, validation.market_data_points,
                validation.market_confidence, validation.validation_method,
                json.dumps(validation.adjustment_factors), validation.price_recommendation,
                json.dumps(validation.market_insights), validation.risk_assessment,
                validation.market_data_age_hours
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error storing validation: {e}")
    
    async def _update_rule_performance(self, validation: PriceValidation):
        """Update validation rule performance metrics"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            for rule_name in validation.adjustment_factors.keys():
                cursor.execute("""
                    INSERT INTO validation_performance 
                    (validation_rule, accuracy_score, adjustment_count, success_count)
                    VALUES (?, ?, 1, ?)
                """, (
                    rule_name,
                    validation.confidence_score,
                    1 if validation.validation_result in [ValidationResult.VALIDATED, 
                                                         ValidationResult.ADJUSTED_UP,
                                                         ValidationResult.ADJUSTED_DOWN] else 0
                ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error updating rule performance: {e}")
    
    async def get_validation_history(self, item_query: str, category: str = "",
                                   days: int = 30) -> List[Dict[str, Any]]:
        """Get price validation history"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM price_validations 
                WHERE item_query = ? AND (category = ? OR ? = '')
                  AND validation_timestamp >= ?
                ORDER BY validation_timestamp DESC
            """, (
                item_query, category, category,
                (datetime.utcnow() - timedelta(days=days)).isoformat()
            ))
            
            rows = cursor.fetchall()
            conn.close()
            
            # Convert to dictionaries
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in rows]
            
        except Exception as e:
            logger.error(f"Error getting validation history: {e}")
            return []


# Global price validation engine instance
price_validation_engine = PriceValidationEngine()


# Export classes and functions
__all__ = [
    'ValidationResult',
    'PriceValidation', 
    'ValidationRule',
    'PriceValidationEngine',
    'price_validation_engine'
]