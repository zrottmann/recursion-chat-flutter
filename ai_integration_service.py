"""
Integration Service for AI Matching and Pricing Systems
Connects the AI matching engine with existing AI pricing and geographic services
"""

import asyncio
import json
import logging
import os
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

# Import AI pricing components
from ai_pricing import (
    AIAnalysisSession,
    PriceHistory,
    MarketPrice
)

# Import matching components
from ai_matching_engine import (
    ItemData,
    UserProfile,
    ValueMatcher,
    GeographicMatcher
)

# Import existing services
from appwrite_database import appwrite_db
from zipcode_service import ZipcodeService
from geospatial import GeospatialService

logger = logging.getLogger(__name__)


@dataclass
class EnhancedItemData:
    """Enhanced item data with AI pricing and geographic information"""
    base_item: ItemData
    ai_price_analysis: Optional[Dict[str, Any]] = None
    market_data: Optional[MarketPrice] = None
    precise_location: Optional[Tuple[float, float]] = None
    location_confidence: float = 0.5
    value_confidence: float = 0.5


class AIIntegrationService:
    """
    Service that integrates AI matching with pricing and geographic systems
    """
    
    def __init__(self):
        self.value_matcher = ValueMatcher()
        self.geo_matcher = GeographicMatcher()
        self.zipcode_service = ZipcodeService() if 'ZipcodeService' in globals() else None
        self.geospatial_service = GeospatialService() if 'GeospatialService' in globals() else None
        self.price_cache = {}  # Cache for pricing data
        self.location_cache = {}  # Cache for location data
    
    async def enhance_item_for_matching(self, item: ItemData, 
                                      db_session) -> EnhancedItemData:
        """
        Enhance an item with AI pricing and precise location data
        """
        try:
            enhanced_item = EnhancedItemData(base_item=item)
            
            # Get AI pricing analysis
            enhanced_item.ai_price_analysis = await self.get_ai_price_analysis(item, db_session)
            enhanced_item.market_data = await self.get_market_pricing_data(item, db_session)
            
            # Update item's estimated value with AI analysis
            if enhanced_item.ai_price_analysis:
                ai_price = enhanced_item.ai_price_analysis.get('estimated_price')
                market_price = enhanced_item.market_data.average_price if enhanced_item.market_data else None
                
                # Combine AI and market prices with confidence weighting
                enhanced_item.base_item.estimated_value = self._combine_price_estimates(
                    ai_price, market_price,
                    enhanced_item.ai_price_analysis.get('confidence', 0.5),
                    enhanced_item.market_data.confidence if enhanced_item.market_data else 0.5
                )
                enhanced_item.value_confidence = self._calculate_value_confidence(
                    enhanced_item.ai_price_analysis, enhanced_item.market_data
                )
            
            # Get precise geographic coordinates
            enhanced_item.precise_location = await self.get_precise_coordinates(item.location)
            enhanced_item.location_confidence = self._calculate_location_confidence(
                item.location, enhanced_item.precise_location
            )
            
            # Update base item coordinates
            if enhanced_item.precise_location:
                enhanced_item.base_item.coordinates = enhanced_item.precise_location
            
            return enhanced_item
            
        except Exception as e:
            logger.error(f"Error enhancing item {item.id}: {e}")
            return EnhancedItemData(base_item=item)
    
    async def get_ai_price_analysis(self, item: ItemData, db_session) -> Optional[Dict[str, Any]]:
        """
        Get AI price analysis for an item using the existing AI pricing system
        """
        try:
            # Check cache first
            cache_key = f"price_{item.id}_{item.category}_{hash(item.title)}"
            if cache_key in self.price_cache:
                cached_data = self.price_cache[cache_key]
                if (datetime.utcnow() - cached_data['timestamp']).hours < 24:
                    return cached_data['data']
            
            # Query existing AI analysis sessions
            existing_analysis = db_session.query(AIAnalysisSession).filter(
                AIAnalysisSession.item_identification.contains(item.title),
                AIAnalysisSession.status == 'completed'
            ).order_by(AIAnalysisSession.created_at.desc()).first()
            
            if existing_analysis:
                price_analysis = existing_analysis.price_analysis
                if price_analysis:
                    # Cache the result
                    self.price_cache[cache_key] = {
                        'data': price_analysis,
                        'timestamp': datetime.utcnow()
                    }
                    return price_analysis
            
            # If no existing analysis, estimate based on category and description
            estimated_price = await self._estimate_price_from_category(item)
            
            price_analysis = {
                'estimated_price': estimated_price,
                'confidence': 0.6,  # Medium confidence for category-based estimates
                'method': 'category_based',
                'factors': {
                    'category': item.category,
                    'title_keywords': self._extract_value_keywords(item.title),
                    'description_length': len(item.description) if item.description else 0
                }
            }
            
            # Cache the result
            self.price_cache[cache_key] = {
                'data': price_analysis,
                'timestamp': datetime.utcnow()
            }
            
            return price_analysis
            
        except Exception as e:
            logger.error(f"Error getting AI price analysis: {e}")
            return None
    
    async def get_market_pricing_data(self, item: ItemData, db_session) -> Optional[MarketPrice]:
        """
        Get market pricing data from historical records
        """
        try:
            # Query historical price data
            price_records = db_session.query(PriceHistory).filter(
                PriceHistory.item_category == item.category,
                PriceHistory.date_recorded >= datetime.utcnow() - timedelta(days=90)
            ).all()
            
            if not price_records:
                return None
            
            # Calculate market statistics
            prices = [record.price for record in price_records]
            
            market_data = MarketPrice(
                min_price=min(prices),
                max_price=max(prices),
                average_price=sum(prices) / len(prices),
                confidence=min(1.0, len(prices) / 20.0),  # Higher confidence with more data points
                source="historical_data",
                data_points=len(prices)
            )
            
            return market_data
            
        except Exception as e:
            logger.error(f"Error getting market pricing data: {e}")
            return None
    
    async def get_precise_coordinates(self, location: Optional[str]) -> Optional[Tuple[float, float]]:
        """
        Get precise coordinates using multiple geographic services
        """
        if not location:
            return None
        
        try:
            # Check cache first
            if location in self.location_cache:
                cached_data = self.location_cache[location]
                if (datetime.utcnow() - cached_data['timestamp']).days < 7:
                    return cached_data['coordinates']
            
            # Try zipcode service first for US locations
            if self.zipcode_service:
                zipcode_coords = await self._get_coordinates_from_zipcode_service(location)
                if zipcode_coords:
                    self.location_cache[location] = {
                        'coordinates': zipcode_coords,
                        'timestamp': datetime.utcnow()
                    }
                    return zipcode_coords
            
            # Try geospatial service
            if self.geospatial_service:
                geo_coords = await self._get_coordinates_from_geospatial_service(location)
                if geo_coords:
                    self.location_cache[location] = {
                        'coordinates': geo_coords,
                        'timestamp': datetime.utcnow()
                    }
                    return geo_coords
            
            # Fallback to basic geocoding
            coords = self.geo_matcher.get_coordinates(location)
            if coords:
                self.location_cache[location] = {
                    'coordinates': coords,
                    'timestamp': datetime.utcnow()
                }
            
            return coords
            
        except Exception as e:
            logger.error(f"Error getting precise coordinates for {location}: {e}")
            return None
    
    async def calculate_enhanced_value_compatibility(self, item1: EnhancedItemData, 
                                                   item2: EnhancedItemData,
                                                   user_preferences: Dict) -> Dict[str, float]:
        """
        Calculate enhanced value compatibility using AI pricing data
        """
        try:
            base_score = self.value_matcher.get_value_compatibility_score(
                item1.base_item.estimated_value or 0,
                item2.base_item.estimated_value or 0,
                user_preferences.get('max_value_difference_percent', 20.0)
            )
            
            # Adjust score based on confidence levels
            confidence_factor = (item1.value_confidence + item2.value_confidence) / 2
            adjusted_score = base_score * (0.5 + 0.5 * confidence_factor)
            
            # Consider market volatility
            market_volatility_factor = 1.0
            if item1.market_data and item2.market_data:
                volatility1 = (item1.market_data.max_price - item1.market_data.min_price) / item1.market_data.average_price
                volatility2 = (item2.market_data.max_price - item2.market_data.min_price) / item2.market_data.average_price
                avg_volatility = (volatility1 + volatility2) / 2
                market_volatility_factor = max(0.7, 1.0 - avg_volatility * 0.3)
            
            final_score = adjusted_score * market_volatility_factor
            
            return {
                'base_value_score': base_score,
                'confidence_adjusted_score': adjusted_score,
                'final_value_score': final_score,
                'value_confidence': confidence_factor,
                'market_volatility_factor': market_volatility_factor,
                'item1_estimated_value': item1.base_item.estimated_value,
                'item2_estimated_value': item2.base_item.estimated_value
            }
            
        except Exception as e:
            logger.error(f"Error calculating enhanced value compatibility: {e}")
            return {'final_value_score': 0.5}  # Default neutral score
    
    async def calculate_enhanced_geographic_score(self, item1: EnhancedItemData,
                                                item2: EnhancedItemData,
                                                user_preferences: Dict) -> Dict[str, float]:
        """
        Calculate enhanced geographic score using precise coordinates
        """
        try:
            if not item1.precise_location or not item2.precise_location:
                return {'final_geographic_score': 0.5, 'distance_km': None}
            
            # Calculate precise distance
            distance_km = self.geo_matcher.calculate_distance(
                item1.precise_location, item2.precise_location
            )
            
            # Get base geographic score
            max_distance = user_preferences.get('max_distance_km', 50.0)
            base_score = self.geo_matcher.get_geographic_score(distance_km, max_distance)
            
            # Adjust based on location confidence
            confidence_factor = (item1.location_confidence + item2.location_confidence) / 2
            adjusted_score = base_score * (0.7 + 0.3 * confidence_factor)
            
            # Consider transportation and logistics
            logistics_factor = self._calculate_logistics_factor(distance_km, item1, item2)
            final_score = adjusted_score * logistics_factor
            
            return {
                'base_geographic_score': base_score,
                'confidence_adjusted_score': adjusted_score,
                'final_geographic_score': final_score,
                'distance_km': distance_km,
                'location_confidence': confidence_factor,
                'logistics_factor': logistics_factor
            }
            
        except Exception as e:
            logger.error(f"Error calculating enhanced geographic score: {e}")
            return {'final_geographic_score': 0.5, 'distance_km': None}
    
    def _combine_price_estimates(self, ai_price: Optional[float], market_price: Optional[float],
                               ai_confidence: float, market_confidence: float) -> Optional[float]:
        """Combine AI and market price estimates with confidence weighting"""
        if not ai_price and not market_price:
            return None
        
        if not ai_price:
            return market_price
        
        if not market_price:
            return ai_price
        
        # Weight by confidence levels
        total_confidence = ai_confidence + market_confidence
        if total_confidence == 0:
            return (ai_price + market_price) / 2
        
        weighted_price = (
            (ai_price * ai_confidence + market_price * market_confidence) / total_confidence
        )
        
        return weighted_price
    
    def _calculate_value_confidence(self, ai_analysis: Optional[Dict], 
                                  market_data: Optional[MarketPrice]) -> float:
        """Calculate overall confidence in value estimation"""
        confidences = []
        
        if ai_analysis:
            confidences.append(ai_analysis.get('confidence', 0.5))
        
        if market_data:
            confidences.append(market_data.confidence)
        
        if not confidences:
            return 0.3  # Low confidence when no data
        
        # Average confidence with slight boost for having multiple sources
        avg_confidence = sum(confidences) / len(confidences)
        multiple_source_boost = 0.1 if len(confidences) > 1 else 0
        
        return min(1.0, avg_confidence + multiple_source_boost)
    
    def _calculate_location_confidence(self, location: Optional[str], 
                                     coordinates: Optional[Tuple[float, float]]) -> float:
        """Calculate confidence in location accuracy"""
        if not location or not coordinates:
            return 0.3
        
        # Higher confidence for specific addresses vs general locations
        confidence = 0.5
        
        # Check for specific location indicators
        if any(indicator in location.lower() for indicator in ['street', 'ave', 'road', 'blvd']):
            confidence += 0.3
        
        # Check for zipcode
        if any(char.isdigit() for char in location):
            confidence += 0.2
        
        return min(1.0, confidence)
    
    async def _estimate_price_from_category(self, item: ItemData) -> float:
        """Estimate price based on category and item characteristics"""
        category_base_prices = {
            'electronics': 150.0,
            'clothing': 30.0,
            'books': 15.0,
            'furniture': 200.0,
            'tools': 80.0,
            'vehicles': 5000.0,
            'services': 100.0,
            'appliances': 300.0,
            'collectibles': 50.0,
            'sports': 75.0
        }
        
        base_price = category_base_prices.get(item.category.lower(), 50.0)
        
        # Adjust based on title keywords
        value_keywords = self._extract_value_keywords(item.title)
        
        multiplier = 1.0
        for keyword in value_keywords['high_value']:
            multiplier *= 1.3
        
        for keyword in value_keywords['low_value']:
            multiplier *= 0.7
        
        return base_price * multiplier
    
    def _extract_value_keywords(self, title: str) -> Dict[str, List[str]]:
        """Extract keywords that indicate item value"""
        title_lower = title.lower()
        
        high_value_keywords = []
        low_value_keywords = []
        
        high_value_terms = [
            'new', 'unused', 'premium', 'professional', 'brand', 'original',
            'certified', 'warranty', 'mint', 'perfect', 'excellent'
        ]
        
        low_value_terms = [
            'used', 'worn', 'old', 'damaged', 'broken', 'repair', 'vintage',
            'antique', 'scratched', 'faded'
        ]
        
        for term in high_value_terms:
            if term in title_lower:
                high_value_keywords.append(term)
        
        for term in low_value_terms:
            if term in title_lower:
                low_value_keywords.append(term)
        
        return {
            'high_value': high_value_keywords,
            'low_value': low_value_keywords
        }
    
    def _calculate_logistics_factor(self, distance_km: float, 
                                  item1: EnhancedItemData, item2: EnhancedItemData) -> float:
        """Calculate logistics factor based on item characteristics and distance"""
        if distance_km <= 5:
            return 1.0  # Easy local exchange
        
        if distance_km <= 25:
            return 0.9  # Regional exchange
        
        if distance_km <= 100:
            return 0.7  # Requires planning
        
        # For longer distances, consider item value and transportability
        avg_value = ((item1.base_item.estimated_value or 0) + 
                    (item2.base_item.estimated_value or 0)) / 2
        
        if avg_value > 500:
            return 0.6  # High value items worth the distance
        elif avg_value > 100:
            return 0.4  # Medium value items
        else:
            return 0.2  # Low value items not worth long distance
    
    async def _get_coordinates_from_zipcode_service(self, location: str) -> Optional[Tuple[float, float]]:
        """Get coordinates using zipcode service"""
        try:
            if self.zipcode_service:
                result = await self.zipcode_service.get_coordinates(location)
                if result:
                    return (result['latitude'], result['longitude'])
        except Exception as e:
            logger.warning(f"Zipcode service failed for {location}: {e}")
        return None
    
    async def _get_coordinates_from_geospatial_service(self, location: str) -> Optional[Tuple[float, float]]:
        """Get coordinates using geospatial service"""
        try:
            if self.geospatial_service:
                result = await self.geospatial_service.geocode(location)
                if result:
                    return (result['lat'], result['lon'])
        except Exception as e:
            logger.warning(f"Geospatial service failed for {location}: {e}")
        return None


# Export the service
__all__ = ['AIIntegrationService', 'EnhancedItemData']