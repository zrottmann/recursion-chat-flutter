#!/usr/bin/env python3
"""
Enhanced Equal Value Trading Matcher for Trading Post
Integrates AI photo pricing with sophisticated equal-value trade matching
"""

import asyncio
import json
import logging
import math
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
import numpy as np
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field

# Import existing matching components
from ai_matching_engine import (
    AIMatchingEngine, MatchingContext, ItemData, UserProfile,
    ValueMatcher, GeographicMatcher, CategoryMatcher, MLEnhancedMatcher
)

# Import our AI photo system
from unified_ai_photo_system import (
    unified_ai_system, UnifiedAnalysisResult, UnifiedAnalysisSession
)

# Import AI integration service
from ai_integration_service import AIIntegrationService, EnhancedItemData

# Import advanced pricing components
from advanced_price_estimation import (
    AdvancedPriceEstimate, ItemAttributes, AdvancedPriceEstimationEngine
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI router
router = APIRouter(prefix="/api/equal-value-matching", tags=["equal-value-trading"])


class TradePreference(Enum):
    """Trade preference types"""
    EXACT_VALUE = "exact_value"
    WITHIN_PERCENT = "within_percent"
    FLEXIBLE = "flexible"
    UPGRADE_FOCUSED = "upgrade_focused"
    VALUE_PLUS_CASH = "value_plus_cash"


@dataclass
class EqualValueTradeRequest:
    """Request for equal value trade matching"""
    photo_analysis_session_id: str
    user_id: int
    trade_preference: TradePreference = TradePreference.WITHIN_PERCENT
    max_value_difference_percent: float = 15.0
    max_distance_km: float = 50.0
    include_cash_adjustments: bool = True
    preferred_categories: List[str] = None
    excluded_categories: List[str] = None
    minimum_user_rating: float = 4.0
    require_photo_verification: bool = True


@dataclass
class PhotoBasedItemData:
    """Item data enhanced with AI photo analysis"""
    base_item: ItemData
    photo_analysis: UnifiedAnalysisResult
    enhanced_pricing: AdvancedPriceEstimate
    wear_assessment: Dict[str, Any]
    market_position: str
    confidence_score: float
    processing_time: float


@dataclass
class EqualValueMatch:
    """Equal value trade match with detailed analysis"""
    match_id: str
    user1_item: PhotoBasedItemData
    user2_item: PhotoBasedItemData
    value_analysis: Dict[str, Any]
    trade_feasibility: Dict[str, Any]
    ai_recommendation: str
    confidence_score: float
    match_quality_score: float
    created_at: datetime
    expires_at: datetime


class EqualValueTradingEngine:
    """
    Enhanced trading engine that focuses on equal value matches using AI photo pricing
    """
    
    def __init__(self):
        self.ai_matching_engine = AIMatchingEngine()
        self.ai_integration_service = AIIntegrationService()
        self.db_path = "trading_post.db"
        self._initialize_database()
        
        # Enhanced value matching parameters
        self.value_matching_algorithms = {
            TradePreference.EXACT_VALUE: self._exact_value_matching,
            TradePreference.WITHIN_PERCENT: self._percentage_based_matching,
            TradePreference.FLEXIBLE: self._flexible_value_matching,
            TradePreference.UPGRADE_FOCUSED: self._upgrade_focused_matching,
            TradePreference.VALUE_PLUS_CASH: self._value_plus_cash_matching
        }
        
        # Confidence thresholds
        self.min_confidence_thresholds = {
            "photo_analysis": 0.6,
            "price_estimation": 0.5,
            "value_matching": 0.7,
            "overall_match": 0.65
        }
    
    def _initialize_database(self):
        """Initialize database tables for equal value trading"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Equal value trade matches table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS equal_value_matches (
                    id TEXT PRIMARY KEY,
                    user1_id INTEGER NOT NULL,
                    user2_id INTEGER NOT NULL,
                    item1_photo_session_id TEXT NOT NULL,
                    item2_photo_session_id TEXT NOT NULL,
                    
                    item1_estimated_value REAL,
                    item2_estimated_value REAL,
                    value_difference_percent REAL,
                    value_confidence_score REAL,
                    
                    match_quality_score REAL,
                    confidence_score REAL,
                    trade_preference TEXT,
                    
                    ai_recommendation TEXT,
                    value_analysis TEXT,
                    trade_feasibility TEXT,
                    
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    
                    user1_viewed BOOLEAN DEFAULT FALSE,
                    user2_viewed BOOLEAN DEFAULT FALSE,
                    user1_response TEXT,
                    user2_response TEXT,
                    response_deadline TIMESTAMP
                )
            """)
            
            # Photo-based item registry
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS photo_based_items (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    photo_session_id TEXT UNIQUE NOT NULL,
                    
                    item_title TEXT,
                    item_category TEXT,
                    estimated_value REAL,
                    confidence_score REAL,
                    
                    available_for_trade BOOLEAN DEFAULT TRUE,
                    trade_preferences TEXT,
                    location TEXT,
                    coordinates TEXT,
                    
                    wear_assessment TEXT,
                    market_position TEXT,
                    processing_time REAL,
                    
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (photo_session_id) REFERENCES unified_analysis_sessions (id)
                )
            """)
            
            # Trade interaction history
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS trade_interactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    match_id TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    interaction_type TEXT NOT NULL,
                    interaction_data TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (match_id) REFERENCES equal_value_matches (id)
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("Equal value trading database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    async def find_equal_value_matches(self, request: EqualValueTradeRequest) -> List[EqualValueMatch]:
        """
        Find equal value trade matches based on AI photo analysis
        """
        try:
            start_time = time.time()
            
            # Get the photo analysis results
            photo_analysis = await unified_ai_system.get_analysis_results(
                request.photo_analysis_session_id
            )
            
            if not photo_analysis.success:
                raise HTTPException(status_code=400, detail="Photo analysis not completed or failed")
            
            # Create enhanced item data from photo analysis
            user_item = await self._create_photo_based_item_data(photo_analysis, request.user_id)
            
            # Register item in our system
            await self._register_photo_based_item(user_item)
            
            # Find candidate items for trading
            candidate_items = await self._find_candidate_items(user_item, request)
            
            # Generate equal value matches
            matches = []
            for candidate in candidate_items:
                match = await self._evaluate_equal_value_trade(
                    user_item, candidate, request
                )
                
                if match and match.confidence_score >= self.min_confidence_thresholds["overall_match"]:
                    matches.append(match)
            
            # Sort by match quality and confidence
            matches.sort(
                key=lambda m: (m.match_quality_score * m.confidence_score), 
                reverse=True
            )
            
            # Store matches in database
            stored_matches = []
            for match in matches[:20]:  # Limit to top 20 matches
                stored_match = await self._store_equal_value_match(match)
                if stored_match:
                    stored_matches.append(stored_match)
            
            processing_time = time.time() - start_time
            logger.info(f"Found {len(stored_matches)} equal value matches in {processing_time:.2f}s")
            
            return stored_matches
            
        except Exception as e:
            logger.error(f"Error finding equal value matches: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _create_photo_based_item_data(self, photo_analysis: UnifiedAnalysisResult, 
                                          user_id: int) -> PhotoBasedItemData:
        """Create enhanced item data from photo analysis"""
        try:
            # Extract item attributes from photo analysis
            item_id = photo_analysis.item_identification
            estimated_value = photo_analysis.price_analysis.get('estimated_price', 0)
            
            # Create base item data
            base_item = ItemData(
                id=f"photo_{photo_analysis.session_id}",
                user_id=str(user_id),
                title=item_id.get('primary_identification', {}).get('category', 'Unknown Item'),
                description=item_id.get('detailed_description', ''),
                category=item_id.get('primary_identification', {}).get('category', 'general'),
                type='offer',  # Photo-based items are offers
                estimated_value=estimated_value,
                location=None,  # Would be filled from user profile
                coordinates=None,
                tags=item_id.get('tags', []),
                created_at=datetime.utcnow()
            )
            
            # Create enhanced pricing data
            enhanced_pricing = AdvancedPriceEstimate(
                estimated_price=photo_analysis.price_analysis.get('estimated_price', 0),
                price_range_min=photo_analysis.price_analysis.get('price_range_min', 0),
                price_range_max=photo_analysis.price_analysis.get('price_range_max', 0),
                confidence_score=photo_analysis.price_analysis.get('confidence_score', 0.5),
                market_analysis=photo_analysis.price_analysis.get('market_analysis', {}),
                condition_impact=photo_analysis.condition_assessment,
                brand_premium=photo_analysis.price_analysis.get('brand_premium', 0),
                rarity_factor=photo_analysis.price_analysis.get('rarity_factor', 1.0),
                market_trends=photo_analysis.price_analysis.get('market_trends', {}),
                comparable_sales=photo_analysis.price_analysis.get('comparable_sales', []),
                pricing_factors=photo_analysis.price_analysis.get('pricing_factors', {}),
                valuation_method=photo_analysis.price_analysis.get('valuation_method', 'ai_analysis'),
                data_freshness=photo_analysis.price_analysis.get('data_freshness', 'current')
            )
            
            return PhotoBasedItemData(
                base_item=base_item,
                photo_analysis=photo_analysis,
                enhanced_pricing=enhanced_pricing,
                wear_assessment=photo_analysis.wear_analysis,
                market_position=photo_analysis.market_position or 'average',
                confidence_score=photo_analysis.confidence_score,
                processing_time=photo_analysis.processing_time
            )
            
        except Exception as e:
            logger.error(f"Error creating photo-based item data: {e}")
            raise
    
    async def _register_photo_based_item(self, item: PhotoBasedItemData):
        """Register a photo-based item in our trading system"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO photo_based_items 
                (id, user_id, photo_session_id, item_title, item_category, 
                 estimated_value, confidence_score, wear_assessment, 
                 market_position, processing_time, trade_preferences)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item.base_item.id,
                int(item.base_item.user_id),
                item.photo_analysis.session_id,
                item.base_item.title,
                item.base_item.category,
                item.base_item.estimated_value,
                item.confidence_score,
                json.dumps(item.wear_assessment),
                item.market_position,
                item.processing_time,
                json.dumps({"trade_preference": "within_percent", "max_difference": 15.0})
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Registered photo-based item: {item.base_item.id}")
            
        except Exception as e:
            logger.error(f"Error registering photo-based item: {e}")
    
    async def _find_candidate_items(self, user_item: PhotoBasedItemData, 
                                  request: EqualValueTradeRequest) -> List[PhotoBasedItemData]:
        """Find candidate items for equal value trading"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Build query parameters
            value_min = user_item.base_item.estimated_value * (1 - request.max_value_difference_percent / 100)
            value_max = user_item.base_item.estimated_value * (1 + request.max_value_difference_percent / 100)
            
            # Query for candidate items
            query = """
                SELECT pbi.*, uas.item_recognition, uas.condition_assessment, 
                       uas.wear_detection, uas.price_estimate
                FROM photo_based_items pbi
                JOIN unified_analysis_sessions uas ON pbi.photo_session_id = uas.id
                WHERE pbi.user_id != ? 
                  AND pbi.available_for_trade = TRUE
                  AND pbi.estimated_value BETWEEN ? AND ?
                  AND pbi.confidence_score >= ?
                  AND uas.status = 'completed'
            """
            
            params = [
                int(user_item.base_item.user_id),
                value_min,
                value_max,
                self.min_confidence_thresholds["photo_analysis"]
            ]
            
            # Add category filters if specified
            if request.preferred_categories:
                placeholders = ','.join(['?' for _ in request.preferred_categories])
                query += f" AND pbi.item_category IN ({placeholders})"
                params.extend(request.preferred_categories)
            
            if request.excluded_categories:
                placeholders = ','.join(['?' for _ in request.excluded_categories])
                query += f" AND pbi.item_category NOT IN ({placeholders})"
                params.extend(request.excluded_categories)
            
            query += " ORDER BY ABS(pbi.estimated_value - ?) ASC LIMIT 50"
            params.append(user_item.base_item.estimated_value)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            conn.close()
            
            # Convert to PhotoBasedItemData objects
            candidates = []
            for row in rows:
                try:
                    candidate = await self._row_to_photo_based_item(row)
                    if candidate:
                        candidates.append(candidate)
                except Exception as e:
                    logger.warning(f"Error converting row to item data: {e}")
                    continue
            
            logger.info(f"Found {len(candidates)} candidate items for equal value trading")
            return candidates
            
        except Exception as e:
            logger.error(f"Error finding candidate items: {e}")
            return []
    
    async def _row_to_photo_based_item(self, row) -> Optional[PhotoBasedItemData]:
        """Convert database row to PhotoBasedItemData object"""
        try:
            # Extract row data (assuming proper column order)
            (item_id, user_id, photo_session_id, item_title, item_category,
             estimated_value, confidence_score, _, wear_assessment_json,
             market_position, processing_time, _, _, _, _,
             item_recognition_json, condition_assessment_json,
             wear_detection_json, price_estimate_json) = row
            
            # Create base item
            base_item = ItemData(
                id=item_id,
                user_id=str(user_id),
                title=item_title,
                description="",
                category=item_category,
                type='offer',
                estimated_value=estimated_value,
                coordinates=None,
                created_at=datetime.utcnow()
            )
            
            # Parse JSON data
            wear_assessment = json.loads(wear_assessment_json) if wear_assessment_json else {}
            price_analysis = json.loads(price_estimate_json) if price_estimate_json else {}
            
            # Create mock photo analysis result (since we don't have the full object)
            photo_analysis = UnifiedAnalysisResult(
                session_id=photo_session_id,
                success=True,
                item_identification=json.loads(item_recognition_json) if item_recognition_json else {},
                condition_assessment=json.loads(condition_assessment_json) if condition_assessment_json else {},
                wear_analysis=wear_assessment,
                price_analysis=price_analysis,
                confidence_score=confidence_score,
                processing_time=processing_time,
                analysis_depth="comprehensive",
                recommendations=[],
                market_position=market_position
            )
            
            # Create enhanced pricing
            enhanced_pricing = AdvancedPriceEstimate(
                estimated_price=estimated_value,
                price_range_min=estimated_value * 0.8,
                price_range_max=estimated_value * 1.2,
                confidence_score=confidence_score,
                market_analysis={},
                condition_impact={},
                brand_premium=0.0,
                rarity_factor=1.0,
                market_trends={},
                comparable_sales=[],
                pricing_factors={},
                valuation_method="ai_analysis",
                data_freshness="current"
            )
            
            return PhotoBasedItemData(
                base_item=base_item,
                photo_analysis=photo_analysis,
                enhanced_pricing=enhanced_pricing,
                wear_assessment=wear_assessment,
                market_position=market_position,
                confidence_score=confidence_score,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error converting row to PhotoBasedItemData: {e}")
            return None
    
    async def _evaluate_equal_value_trade(self, user_item: PhotoBasedItemData,
                                        candidate_item: PhotoBasedItemData,
                                        request: EqualValueTradeRequest) -> Optional[EqualValueMatch]:
        """Evaluate if two items make a good equal value trade"""
        try:
            # Apply the appropriate value matching algorithm
            value_algorithm = self.value_matching_algorithms.get(
                request.trade_preference,
                self._percentage_based_matching
            )
            
            value_analysis = await value_algorithm(user_item, candidate_item, request)
            
            if not value_analysis['is_compatible']:
                return None
            
            # Calculate trade feasibility
            trade_feasibility = await self._calculate_trade_feasibility(
                user_item, candidate_item, request
            )
            
            # Generate AI recommendation
            ai_recommendation = await self._generate_trade_recommendation(
                user_item, candidate_item, value_analysis, trade_feasibility
            )
            
            # Calculate overall scores
            match_quality_score = self._calculate_match_quality_score(
                value_analysis, trade_feasibility
            )
            
            confidence_score = self._calculate_overall_confidence(
                user_item, candidate_item, value_analysis, trade_feasibility
            )
            
            # Create match object
            match = EqualValueMatch(
                match_id=f"eq_match_{user_item.base_item.id}_{candidate_item.base_item.id}_{int(time.time())}",
                user1_item=user_item,
                user2_item=candidate_item,
                value_analysis=value_analysis,
                trade_feasibility=trade_feasibility,
                ai_recommendation=ai_recommendation,
                confidence_score=confidence_score,
                match_quality_score=match_quality_score,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            
            return match
            
        except Exception as e:
            logger.error(f"Error evaluating equal value trade: {e}")
            return None
    
    async def _exact_value_matching(self, item1: PhotoBasedItemData, 
                                  item2: PhotoBasedItemData,
                                  request: EqualValueTradeRequest) -> Dict[str, Any]:
        """Exact value matching algorithm"""
        value1 = item1.base_item.estimated_value
        value2 = item2.base_item.estimated_value
        
        if not value1 or not value2:
            return {'is_compatible': False, 'reason': 'Missing value data'}
        
        difference_percent = abs(value1 - value2) / max(value1, value2) * 100
        
        # Very strict threshold for exact matching
        is_compatible = difference_percent <= 5.0
        
        return {
            'is_compatible': is_compatible,
            'algorithm': 'exact_value',
            'value1': value1,
            'value2': value2,
            'difference_percent': difference_percent,
            'compatibility_score': 1.0 - (difference_percent / 5.0) if difference_percent <= 5.0 else 0.0,
            'cash_adjustment': 0.0,
            'reason': 'Values are nearly identical' if is_compatible else f'Value difference too high: {difference_percent:.1f}%'
        }
    
    async def _percentage_based_matching(self, item1: PhotoBasedItemData,
                                       item2: PhotoBasedItemData,
                                       request: EqualValueTradeRequest) -> Dict[str, Any]:
        """Percentage-based value matching algorithm"""
        value1 = item1.base_item.estimated_value
        value2 = item2.base_item.estimated_value
        
        if not value1 or not value2:
            return {'is_compatible': False, 'reason': 'Missing value data'}
        
        difference_percent = abs(value1 - value2) / max(value1, value2) * 100
        
        is_compatible = difference_percent <= request.max_value_difference_percent
        
        # Calculate compatibility score
        if is_compatible:
            compatibility_score = 1.0 - (difference_percent / request.max_value_difference_percent)
        else:
            compatibility_score = 0.0
        
        return {
            'is_compatible': is_compatible,
            'algorithm': 'percentage_based',
            'value1': value1,
            'value2': value2,
            'difference_percent': difference_percent,
            'compatibility_score': compatibility_score,
            'cash_adjustment': 0.0,
            'max_allowed_percent': request.max_value_difference_percent,
            'reason': f'Within {request.max_value_difference_percent}% threshold' if is_compatible else f'Exceeds {request.max_value_difference_percent}% threshold'
        }
    
    async def _flexible_value_matching(self, item1: PhotoBasedItemData,
                                     item2: PhotoBasedItemData,
                                     request: EqualValueTradeRequest) -> Dict[str, Any]:
        """Flexible value matching considering item characteristics"""
        value1 = item1.base_item.estimated_value
        value2 = item2.base_item.estimated_value
        
        if not value1 or not value2:
            return {'is_compatible': False, 'reason': 'Missing value data'}
        
        difference_percent = abs(value1 - value2) / max(value1, value2) * 100
        
        # Adjust threshold based on item characteristics
        base_threshold = request.max_value_difference_percent
        
        # More flexibility for higher-confidence estimates
        confidence_adjustment = (item1.confidence_score + item2.confidence_score - 1.0) * 10
        
        # More flexibility for certain categories
        category_adjustments = {
            'collectibles': 10.0,
            'art': 15.0,
            'antiques': 20.0,
            'electronics': -5.0  # Less flexibility for electronics
        }
        
        category_adjustment = category_adjustments.get(item1.base_item.category, 0) + \
                            category_adjustments.get(item2.base_item.category, 0)
        
        adjusted_threshold = base_threshold + confidence_adjustment + category_adjustment
        adjusted_threshold = max(5.0, min(50.0, adjusted_threshold))  # Clamp between 5% and 50%
        
        is_compatible = difference_percent <= adjusted_threshold
        
        compatibility_score = 1.0 - (difference_percent / adjusted_threshold) if is_compatible else 0.0
        
        return {
            'is_compatible': is_compatible,
            'algorithm': 'flexible',
            'value1': value1,
            'value2': value2,
            'difference_percent': difference_percent,
            'compatibility_score': compatibility_score,
            'cash_adjustment': 0.0,
            'base_threshold': base_threshold,
            'adjusted_threshold': adjusted_threshold,
            'confidence_adjustment': confidence_adjustment,
            'category_adjustment': category_adjustment,
            'reason': f'Flexible matching with {adjusted_threshold:.1f}% threshold' if is_compatible else f'Exceeds flexible threshold of {adjusted_threshold:.1f}%'
        }
    
    async def _upgrade_focused_matching(self, item1: PhotoBasedItemData,
                                      item2: PhotoBasedItemData,
                                      request: EqualValueTradeRequest) -> Dict[str, Any]:
        """Upgrade-focused matching allowing higher value items"""
        value1 = item1.base_item.estimated_value
        value2 = item2.base_item.estimated_value
        
        if not value1 or not value2:
            return {'is_compatible': False, 'reason': 'Missing value data'}
        
        # Allow user to get higher value items with some flexibility
        if value2 > value1:
            # User gets upgrade - more lenient
            difference_percent = (value2 - value1) / value1 * 100
            max_upgrade_percent = request.max_value_difference_percent + 10  # Bonus for upgrades
            is_compatible = difference_percent <= max_upgrade_percent
            
            reason = f'Upgrade opportunity: +{difference_percent:.1f}%' if is_compatible else f'Upgrade too large: +{difference_percent:.1f}%'
        else:
            # User gives higher value - stricter
            difference_percent = (value1 - value2) / value1 * 100
            max_downgrade_percent = request.max_value_difference_percent - 5  # Stricter for downgrades
            is_compatible = difference_percent <= max_downgrade_percent
            
            reason = f'Acceptable downgrade: -{difference_percent:.1f}%' if is_compatible else f'Downgrade too large: -{difference_percent:.1f}%'
        
        compatibility_score = 1.0 - (difference_percent / (max_upgrade_percent if value2 > value1 else max_downgrade_percent)) if is_compatible else 0.0
        
        return {
            'is_compatible': is_compatible,
            'algorithm': 'upgrade_focused',
            'value1': value1,
            'value2': value2,
            'difference_percent': difference_percent if value2 > value1 else -difference_percent,
            'compatibility_score': compatibility_score,
            'cash_adjustment': 0.0,
            'is_upgrade': value2 > value1,
            'reason': reason
        }
    
    async def _value_plus_cash_matching(self, item1: PhotoBasedItemData,
                                      item2: PhotoBasedItemData,
                                      request: EqualValueTradeRequest) -> Dict[str, Any]:
        """Value matching allowing cash adjustments"""
        value1 = item1.base_item.estimated_value
        value2 = item2.base_item.estimated_value
        
        if not value1 or not value2:
            return {'is_compatible': False, 'reason': 'Missing value data'}
        
        value_difference = abs(value1 - value2)
        max_cash_adjustment = max(value1, value2) * 0.3  # Max 30% cash adjustment
        
        is_compatible = value_difference <= max_cash_adjustment
        
        if is_compatible:
            if value1 > value2:
                cash_from_user2 = value1 - value2
                cash_from_user1 = 0
                reason = f'Trade with ${cash_from_user2:.2f} cash from other user'
            else:
                cash_from_user1 = value2 - value1
                cash_from_user2 = 0
                reason = f'Trade with ${cash_from_user1:.2f} cash from you'
        else:
            cash_from_user1 = cash_from_user2 = 0
            reason = f'Cash adjustment too large: ${value_difference:.2f}'
        
        compatibility_score = 1.0 - (value_difference / max_cash_adjustment) if is_compatible else 0.0
        
        return {
            'is_compatible': is_compatible,
            'algorithm': 'value_plus_cash',
            'value1': value1,
            'value2': value2,
            'difference_amount': value_difference,
            'compatibility_score': compatibility_score,
            'cash_adjustment': value_difference if is_compatible else 0.0,
            'cash_from_user1': cash_from_user1 if is_compatible else 0.0,
            'cash_from_user2': cash_from_user2 if is_compatible else 0.0,
            'max_cash_adjustment': max_cash_adjustment,
            'reason': reason
        }
    
    async def _calculate_trade_feasibility(self, item1: PhotoBasedItemData,
                                         item2: PhotoBasedItemData,
                                         request: EqualValueTradeRequest) -> Dict[str, Any]:
        """Calculate trade feasibility factors"""
        try:
            feasibility = {
                'overall_feasibility': 0.0,
                'factors': {}
            }
            
            # Photo verification feasibility
            photo_feasibility = min(item1.confidence_score, item2.confidence_score)
            feasibility['factors']['photo_verification'] = photo_feasibility
            
            # Condition compatibility
            item1_condition = item1.wear_assessment.get('overall_condition', 'unknown')
            item2_condition = item2.wear_assessment.get('overall_condition', 'unknown')
            condition_feasibility = self._calculate_condition_compatibility(item1_condition, item2_condition)
            feasibility['factors']['condition_compatibility'] = condition_feasibility
            
            # Category compatibility
            category_feasibility = 0.8 if item1.base_item.category == item2.base_item.category else 0.6
            feasibility['factors']['category_compatibility'] = category_feasibility
            
            # Market position compatibility
            market_feasibility = self._calculate_market_position_compatibility(
                item1.market_position, item2.market_position
            )
            feasibility['factors']['market_position'] = market_feasibility
            
            # Calculate overall feasibility
            weights = {
                'photo_verification': 0.3,
                'condition_compatibility': 0.3,
                'category_compatibility': 0.2,
                'market_position': 0.2
            }
            
            feasibility['overall_feasibility'] = sum(
                feasibility['factors'][factor] * weight
                for factor, weight in weights.items()
            )
            
            return feasibility
            
        except Exception as e:
            logger.error(f"Error calculating trade feasibility: {e}")
            return {'overall_feasibility': 0.5, 'factors': {}}
    
    def _calculate_condition_compatibility(self, condition1: str, condition2: str) -> float:
        """Calculate compatibility between item conditions"""
        condition_scores = {
            'excellent': 1.0,
            'very_good': 0.9,
            'good': 0.8,
            'fair': 0.6,
            'poor': 0.4,
            'unknown': 0.5
        }
        
        score1 = condition_scores.get(condition1.lower(), 0.5)
        score2 = condition_scores.get(condition2.lower(), 0.5)
        
        # High compatibility when conditions are similar
        difference = abs(score1 - score2)
        return 1.0 - difference
    
    def _calculate_market_position_compatibility(self, position1: str, position2: str) -> float:
        """Calculate compatibility between market positions"""
        position_scores = {
            'premium': 1.0,
            'above_average': 0.8,
            'average': 0.6,
            'below_average': 0.4,
            'budget': 0.2
        }
        
        score1 = position_scores.get(position1.lower(), 0.6)
        score2 = position_scores.get(position2.lower(), 0.6)
        
        # Compatibility decreases with market position difference
        difference = abs(score1 - score2)
        return max(0.3, 1.0 - difference)
    
    def _calculate_match_quality_score(self, value_analysis: Dict[str, Any],
                                     trade_feasibility: Dict[str, Any]) -> float:
        """Calculate overall match quality score"""
        try:
            # Weight different factors
            value_weight = 0.4
            feasibility_weight = 0.6
            
            value_score = value_analysis.get('compatibility_score', 0.5)
            feasibility_score = trade_feasibility.get('overall_feasibility', 0.5)
            
            return (value_score * value_weight) + (feasibility_score * feasibility_weight)
            
        except Exception as e:
            logger.error(f"Error calculating match quality score: {e}")
            return 0.5
    
    def _calculate_overall_confidence(self, item1: PhotoBasedItemData,
                                    item2: PhotoBasedItemData,
                                    value_analysis: Dict[str, Any],
                                    trade_feasibility: Dict[str, Any]) -> float:
        """Calculate overall confidence in the match"""
        try:
            confidences = [
                item1.confidence_score,
                item2.confidence_score,
                value_analysis.get('compatibility_score', 0.5),
                trade_feasibility.get('overall_feasibility', 0.5)
            ]
            
            # Weighted average with photo confidence being most important
            weights = [0.3, 0.3, 0.25, 0.15]
            
            return sum(conf * weight for conf, weight in zip(confidences, weights))
            
        except Exception as e:
            logger.error(f"Error calculating overall confidence: {e}")
            return 0.5
    
    async def _generate_trade_recommendation(self, item1: PhotoBasedItemData,
                                           item2: PhotoBasedItemData,
                                           value_analysis: Dict[str, Any],
                                           trade_feasibility: Dict[str, Any]) -> str:
        """Generate AI-powered trade recommendation"""
        try:
            recommendation_parts = []
            
            # Value analysis summary
            algorithm = value_analysis.get('algorithm', 'unknown')
            compatibility_score = value_analysis.get('compatibility_score', 0.5)
            
            if compatibility_score > 0.8:
                recommendation_parts.append("Excellent value match")
            elif compatibility_score > 0.6:
                recommendation_parts.append("Good value compatibility")
            else:
                recommendation_parts.append("Acceptable value alignment")
            
            # Condition insights
            condition_score = trade_feasibility['factors'].get('condition_compatibility', 0.5)
            if condition_score > 0.8:
                recommendation_parts.append("similar condition levels")
            elif condition_score > 0.6:
                recommendation_parts.append("compatible conditions")
            
            # Market position insights
            market_score = trade_feasibility['factors'].get('market_position', 0.5)
            if market_score > 0.8:
                recommendation_parts.append("matching market segments")
            
            # Cash adjustment info
            if value_analysis.get('cash_adjustment', 0) > 0:
                cash_amount = value_analysis['cash_adjustment']
                recommendation_parts.append(f"with ${cash_amount:.2f} cash adjustment")
            
            # Photo verification confidence
            photo_score = trade_feasibility['factors'].get('photo_verification', 0.5)
            if photo_score > 0.8:
                recommendation_parts.append("high photo verification confidence")
            elif photo_score < 0.6:
                recommendation_parts.append("moderate photo verification confidence")
            
            base_recommendation = "; ".join(recommendation_parts)
            
            # Add overall assessment
            overall_score = (compatibility_score + trade_feasibility['overall_feasibility']) / 2
            
            if overall_score > 0.8:
                assessment = "Highly recommended trade"
            elif overall_score > 0.6:
                assessment = "Recommended trade"
            else:
                assessment = "Consider carefully"
            
            return f"{assessment}: {base_recommendation}."
            
        except Exception as e:
            logger.error(f"Error generating trade recommendation: {e}")
            return "Trade recommendation unavailable due to analysis error."
    
    async def _store_equal_value_match(self, match: EqualValueMatch) -> Optional[Dict[str, Any]]:
        """Store equal value match in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO equal_value_matches 
                (id, user1_id, user2_id, item1_photo_session_id, item2_photo_session_id,
                 item1_estimated_value, item2_estimated_value, value_difference_percent,
                 value_confidence_score, match_quality_score, confidence_score,
                 trade_preference, ai_recommendation, value_analysis, trade_feasibility,
                 expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                match.match_id,
                int(match.user1_item.base_item.user_id),
                int(match.user2_item.base_item.user_id),
                match.user1_item.photo_analysis.session_id,
                match.user2_item.photo_analysis.session_id,
                match.user1_item.base_item.estimated_value,
                match.user2_item.base_item.estimated_value,
                match.value_analysis.get('difference_percent', 0),
                match.value_analysis.get('compatibility_score', 0.5),
                match.match_quality_score,
                match.confidence_score,
                match.value_analysis.get('algorithm', 'unknown'),
                match.ai_recommendation,
                json.dumps(match.value_analysis),
                json.dumps(match.trade_feasibility),
                match.expires_at.isoformat()
            ))
            
            conn.commit()
            conn.close()
            
            return {
                'match_id': match.match_id,
                'user1_id': match.user1_item.base_item.user_id,
                'user2_id': match.user2_item.base_item.user_id,
                'match_quality_score': match.match_quality_score,
                'confidence_score': match.confidence_score,
                'ai_recommendation': match.ai_recommendation,
                'value_analysis': match.value_analysis,
                'created_at': match.created_at.isoformat(),
                'expires_at': match.expires_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error storing equal value match: {e}")
            return None


# Global equal value trading engine instance
equal_value_engine = EqualValueTradingEngine()


# Request/Response Models
class EqualValueTradeRequestModel(BaseModel):
    """Request model for equal value trade matching"""
    photo_analysis_session_id: str
    trade_preference: str = "within_percent"
    max_value_difference_percent: float = Field(default=15.0, ge=1.0, le=50.0)
    max_distance_km: float = Field(default=50.0, ge=1.0, le=500.0)
    include_cash_adjustments: bool = True
    preferred_categories: Optional[List[str]] = None
    excluded_categories: Optional[List[str]] = None
    minimum_user_rating: float = Field(default=4.0, ge=1.0, le=5.0)
    require_photo_verification: bool = True


class EqualValueMatchResponse(BaseModel):
    """Response model for equal value matches"""
    match_id: str
    user1_id: str
    user2_id: str
    match_quality_score: float
    confidence_score: float
    ai_recommendation: str
    value_analysis: Dict[str, Any]
    created_at: str
    expires_at: str


# API Endpoints
@router.post("/find-matches", response_model=List[EqualValueMatchResponse])
async def find_equal_value_matches(
    request: EqualValueTradeRequestModel,
    user_id: int,
    background_tasks: BackgroundTasks
):
    """
    Find equal value trade matches based on AI photo analysis
    """
    try:
        # Convert to internal request format
        internal_request = EqualValueTradeRequest(
            photo_analysis_session_id=request.photo_analysis_session_id,
            user_id=user_id,
            trade_preference=TradePreference(request.trade_preference),
            max_value_difference_percent=request.max_value_difference_percent,
            max_distance_km=request.max_distance_km,
            include_cash_adjustments=request.include_cash_adjustments,
            preferred_categories=request.preferred_categories or [],
            excluded_categories=request.excluded_categories or [],
            minimum_user_rating=request.minimum_user_rating,
            require_photo_verification=request.require_photo_verification
        )
        
        # Find matches
        matches = await equal_value_engine.find_equal_value_matches(internal_request)
        
        # Convert to response format
        response_matches = [
            EqualValueMatchResponse(
                match_id=match['match_id'],
                user1_id=match['user1_id'],
                user2_id=match['user2_id'],
                match_quality_score=match['match_quality_score'],
                confidence_score=match['confidence_score'],
                ai_recommendation=match['ai_recommendation'],
                value_analysis=match['value_analysis'],
                created_at=match['created_at'],
                expires_at=match['expires_at']
            )
            for match in matches
        ]
        
        logger.info(f"Found {len(response_matches)} equal value matches for user {user_id}")
        return response_matches
        
    except Exception as e:
        logger.error(f"Error in find_equal_value_matches endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/match/{match_id}")
async def get_match_details(match_id: str):
    """
    Get detailed information about a specific equal value match
    """
    try:
        conn = sqlite3.connect(equal_value_engine.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM equal_value_matches WHERE id = ?
        """, (match_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Convert to response format (would need proper column mapping)
        return {"message": f"Match {match_id} details would be returned here"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting match details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trade-preferences")
async def get_trade_preferences():
    """
    Get available trade preference options
    """
    return {
        "trade_preferences": [
            {
                "value": "exact_value",
                "label": "Exact Value",
                "description": "Items must have nearly identical values (≤5% difference)"
            },
            {
                "value": "within_percent",
                "label": "Within Percentage",
                "description": "Items within a configurable percentage difference"
            },
            {
                "value": "flexible",
                "label": "Flexible",
                "description": "Adjusted thresholds based on item characteristics"
            },
            {
                "value": "upgrade_focused",
                "label": "Upgrade Focused",
                "description": "Prefer trades that result in higher value items"
            },
            {
                "value": "value_plus_cash",
                "label": "Value + Cash",
                "description": "Allow cash adjustments to balance value differences"
            }
        ]
    }


# Export the enhanced equal value matching system
__all__ = [
    'EqualValueTradingEngine',
    'EqualValueTradeRequest',
    'PhotoBasedItemData',
    'EqualValueMatch',
    'TradePreference',
    'equal_value_engine',
    'router'
]