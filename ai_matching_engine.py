"""
Comprehensive AI Matching Engine for Trading Post
Combines value-based matching, geographic proximity, category compatibility, and machine learning
"""

import asyncio
import json
import logging
import math
import os
import requests
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import numpy as np
from geopy.distance import geodesic
from geopy.geocoders import Nominatim

# Import database models
from ai_matching_schema import (
    MatchingSuggestion, 
    MatchingPreference, 
    MatchingHistory, 
    get_matching_db,
    init_user_matching_preferences
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment configuration
GROK_API_KEY = os.getenv("GROK_API_KEY", "local_test_key")
XAI_API_KEY = os.getenv("XAI_API_KEY", "local_test_key")
XAI_MODEL = os.getenv("XAI_MODEL", "grok-beta")
XAI_ENDPOINT = os.getenv("XAI_ENDPOINT", "https://api.x.ai/v1")
API_URL = os.getenv("API_URL", "https://api.x.ai/v1/chat/completions")
USE_MOCK_API = os.getenv("USE_MOCK_API", "true").lower() == "true"
ENABLE_GEOCODING = os.getenv("ENABLE_GEOCODING", "true").lower() == "true"

# Initialize geocoder
geocoder = Nominatim(user_agent="trading_post_ai_matching") if ENABLE_GEOCODING else None


@dataclass
class MatchingContext:
    """Context information for a matching session"""
    user_id: str
    item_id: Optional[str] = None
    max_matches: int = 20
    use_ai_enhancement: bool = True
    force_refresh: bool = False


@dataclass
class ItemData:
    """Structured item/listing data for matching"""
    id: str
    user_id: str
    title: str
    description: str
    category: str
    type: str  # 'offer' or 'want'
    estimated_value: Optional[float] = None
    location: Optional[str] = None
    coordinates: Optional[Tuple[float, float]] = None
    tags: List[str] = None
    created_at: Optional[datetime] = None


@dataclass
class UserProfile:
    """User profile data for matching"""
    id: str
    name: str
    location: Optional[str] = None
    coordinates: Optional[Tuple[float, float]] = None
    preferences: Optional[Dict] = None
    rating: float = 5.0
    successful_trades: int = 0
    items: List[ItemData] = None


class GeographicMatcher:
    """Handles geographic proximity calculations"""
    
    @staticmethod
    def get_coordinates(location: str) -> Optional[Tuple[float, float]]:
        """Get coordinates for a location string"""
        if not geocoder or not location:
            return None
        
        try:
            location_data = geocoder.geocode(location, timeout=5)
            if location_data:
                return (location_data.latitude, location_data.longitude)
        except Exception as e:
            logger.warning(f"Geocoding failed for {location}: {e}")
        
        return None
    
    @staticmethod
    def calculate_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate distance between two coordinates in kilometers"""
        try:
            return geodesic(coord1, coord2).kilometers
        except Exception as e:
            logger.warning(f"Distance calculation failed: {e}")
            return 999999.0  # Very large distance for errors
    
    @staticmethod
    def get_geographic_score(distance_km: float, max_distance: float = 50.0) -> float:
        """
        Calculate geographic compatibility score
        Returns 1.0 for same location, decreasing to 0.0 at max_distance
        """
        if distance_km <= 0.1:  # Same location (within 100m)
            return 1.0
        
        if distance_km >= max_distance:
            return 0.0
        
        # Exponential decay for better scoring
        return math.exp(-2 * distance_km / max_distance)


class ValueMatcher:
    """Handles value-based matching calculations"""
    
    @staticmethod
    def get_value_compatibility_score(value1: float, value2: float, 
                                    max_difference_percent: float = 20.0) -> float:
        """
        Calculate value compatibility score between two items
        Returns 1.0 for identical values, decreasing based on difference percentage
        """
        if not value1 or not value2 or value1 <= 0 or value2 <= 0:
            return 0.5  # Neutral score when values unknown
        
        # Calculate percentage difference
        avg_value = (value1 + value2) / 2
        difference_percent = abs(value1 - value2) / avg_value * 100
        
        if difference_percent <= max_difference_percent:
            # Linear scoring within acceptable range
            return 1.0 - (difference_percent / max_difference_percent) * 0.3
        else:
            # Exponential decay for values outside acceptable range
            excess_percent = difference_percent - max_difference_percent
            return 0.7 * math.exp(-excess_percent / 30.0)
    
    @staticmethod
    def estimate_item_value(item: ItemData) -> float:
        """
        Estimate item value using various signals
        This would integrate with the AI pricing system
        """
        # Placeholder implementation - would call AI pricing service
        base_value = 50.0  # Default base value
        
        # Adjust based on category
        category_multipliers = {
            "electronics": 1.5,
            "clothing": 0.8,
            "books": 0.6,
            "furniture": 1.2,
            "tools": 1.3,
            "vehicles": 3.0,
            "services": 1.0,
        }
        
        multiplier = category_multipliers.get(item.category.lower(), 1.0)
        
        # Adjust based on title keywords (simple heuristic)
        high_value_keywords = ["professional", "premium", "new", "unused", "brand"]
        low_value_keywords = ["used", "worn", "damaged", "old", "broken"]
        
        title_lower = item.title.lower()
        for keyword in high_value_keywords:
            if keyword in title_lower:
                multiplier *= 1.2
                break
        
        for keyword in low_value_keywords:
            if keyword in title_lower:
                multiplier *= 0.8
                break
        
        return base_value * multiplier


class CategoryMatcher:
    """Handles category compatibility and semantic matching"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.category_relationships = {
            "electronics": ["gadgets", "computers", "phones", "tech"],
            "clothing": ["fashion", "apparel", "accessories", "shoes"],
            "books": ["education", "entertainment", "literature"],
            "furniture": ["home", "decor", "appliances"],
            "tools": ["hardware", "equipment", "DIY", "construction"],
            "vehicles": ["transportation", "automotive", "bikes"],
            "services": ["professional", "personal", "consulting"],
        }
    
    def get_category_compatibility_score(self, category1: str, category2: str) -> float:
        """Calculate category compatibility score"""
        if category1.lower() == category2.lower():
            return 1.0
        
        # Check for related categories
        for main_cat, related in self.category_relationships.items():
            if category1.lower() in related and category2.lower() in related:
                return 0.7
            if category1.lower() == main_cat and category2.lower() in related:
                return 0.8
            if category2.lower() == main_cat and category1.lower() in related:
                return 0.8
        
        return 0.3  # Base compatibility for different categories
    
    def get_semantic_similarity_score(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between item descriptions"""
        try:
            if not text1.strip() or not text2.strip():
                return 0.0
            
            # Fit vectorizer and transform texts
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
        
        except Exception as e:
            logger.warning(f"Semantic similarity calculation failed: {e}")
            return 0.0


class MLEnhancedMatcher:
    """Machine learning enhanced matching using historical data"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_weights = {
            'value_score': 0.3,
            'geographic_score': 0.25,
            'category_score': 0.2,
            'semantic_score': 0.15,
            'user_preference_score': 0.1
        }
    
    def extract_features(self, item1: ItemData, item2: ItemData, 
                        user1: UserProfile, user2: UserProfile) -> Dict[str, float]:
        """Extract feature vector for machine learning"""
        geo_matcher = GeographicMatcher()
        value_matcher = ValueMatcher()
        category_matcher = CategoryMatcher()
        
        # Calculate base scores
        distance = 0.0
        if item1.coordinates and item2.coordinates:
            distance = geo_matcher.calculate_distance(item1.coordinates, item2.coordinates)
        
        features = {
            'value_score': value_matcher.get_value_compatibility_score(
                item1.estimated_value or 0, item2.estimated_value or 0
            ),
            'geographic_score': geo_matcher.get_geographic_score(distance),
            'category_score': category_matcher.get_category_compatibility_score(
                item1.category, item2.category
            ),
            'semantic_score': category_matcher.get_semantic_similarity_score(
                f"{item1.title} {item1.description}",
                f"{item2.title} {item2.description}"
            ),
            'user_preference_score': self._calculate_user_preference_alignment(
                user1, user2, item1, item2
            ),
            'user1_rating': user1.rating,
            'user2_rating': user2.rating,
            'user1_trades': min(user1.successful_trades, 100),  # Cap for normalization
            'user2_trades': min(user2.successful_trades, 100),
            'distance_km': min(distance, 1000),  # Cap for normalization
            'value_difference_ratio': self._calculate_value_difference_ratio(
                item1.estimated_value or 0, item2.estimated_value or 0
            ),
        }
        
        return features
    
    def _calculate_user_preference_alignment(self, user1: UserProfile, user2: UserProfile,
                                           item1: ItemData, item2: ItemData) -> float:
        """Calculate how well items align with user preferences"""
        score = 0.5  # Default neutral score
        
        if user1.preferences and user2.preferences:
            # Check category preferences
            user1_prefs = user1.preferences.get('preferred_categories', [])
            user2_prefs = user2.preferences.get('preferred_categories', [])
            
            if item2.category in user1_prefs:
                score += 0.3
            if item1.category in user2_prefs:
                score += 0.3
            
            # Check excluded categories
            user1_excluded = user1.preferences.get('excluded_categories', [])
            user2_excluded = user2.preferences.get('excluded_categories', [])
            
            if item2.category in user1_excluded or item1.category in user2_excluded:
                score -= 0.4
        
        return max(0.0, min(1.0, score))
    
    def _calculate_value_difference_ratio(self, value1: float, value2: float) -> float:
        """Calculate normalized value difference ratio"""
        if not value1 or not value2:
            return 0.5
        
        return abs(value1 - value2) / max(value1, value2)
    
    def calculate_enhanced_score(self, features: Dict[str, float], 
                               historical_data: Optional[List[Dict]] = None) -> float:
        """
        Calculate enhanced matching score using ML insights
        """
        base_score = sum(
            features[key] * self.feature_weights[key]
            for key in self.feature_weights.keys()
            if key in features
        )
        
        # Apply historical learning adjustments
        if historical_data:
            adjustment = self._apply_historical_learning(features, historical_data)
            base_score *= (1 + adjustment)
        
        return max(0.0, min(1.0, base_score))
    
    def _apply_historical_learning(self, current_features: Dict[str, float],
                                 historical_data: List[Dict]) -> float:
        """Apply learning from historical match outcomes"""
        if not historical_data:
            return 0.0
        
        # Simple similarity-based adjustment
        # In production, this would use a trained ML model
        similar_matches = [
            match for match in historical_data
            if self._is_similar_match(current_features, match.get('features', {}))
        ]
        
        if similar_matches:
            success_rate = sum(
                1 for match in similar_matches 
                if match.get('outcome') == 'accepted'
            ) / len(similar_matches)
            
            # Adjust score based on historical success rate
            return (success_rate - 0.5) * 0.2  # ±10% adjustment
        
        return 0.0
    
    def _is_similar_match(self, features1: Dict[str, float], 
                         features2: Dict[str, float], threshold: float = 0.8) -> bool:
        """Check if two feature sets are similar"""
        common_keys = set(features1.keys()) & set(features2.keys())
        if not common_keys:
            return False
        
        similarity = sum(
            1 - abs(features1[key] - features2[key])
            for key in common_keys
        ) / len(common_keys)
        
        return similarity >= threshold


class AIMatchingEngine:
    """Main AI matching engine orchestrating all matching components"""
    
    def __init__(self):
        self.geo_matcher = GeographicMatcher()
        self.value_matcher = ValueMatcher()
        self.category_matcher = CategoryMatcher()
        self.ml_matcher = MLEnhancedMatcher()
    
    async def find_matches_for_item(self, context: MatchingContext, 
                                  db_session) -> List[Dict[str, Any]]:
        """
        Find AI-powered matches for a specific item
        """
        try:
            # Get user preferences
            user_prefs = db_session.query(MatchingPreference).filter(
                MatchingPreference.user_id == context.user_id
            ).first()
            
            if not user_prefs:
                user_prefs = init_user_matching_preferences(context.user_id, db_session)
            
            # Load user data and items (would integrate with Appwrite)
            user_data = await self._load_user_data(context.user_id)
            candidate_items = await self._load_candidate_items(
                context.user_id, user_prefs.max_distance_km
            )
            
            # Generate match suggestions
            matches = []
            target_item = next((item for item in user_data.items 
                              if item.id == context.item_id), None)
            
            if not target_item:
                logger.error(f"Target item {context.item_id} not found")
                return []
            
            for candidate in candidate_items:
                if candidate.user_id == context.user_id:
                    continue  # Skip user's own items
                
                candidate_user = await self._load_user_data(candidate.user_id)
                match_score = await self._calculate_match_score(
                    target_item, candidate, user_data, candidate_user, user_prefs
                )
                
                if match_score.get('overall_score', 0) >= 0.3:  # Minimum threshold
                    matches.append({
                        'target_item': target_item,
                        'candidate_item': candidate,
                        'candidate_user': candidate_user,
                        'scores': match_score,
                        'ai_reasoning': await self._generate_ai_reasoning(
                            target_item, candidate, match_score
                        )
                    })
            
            # Sort by overall score
            matches.sort(key=lambda x: x['scores']['overall_score'], reverse=True)
            
            # Store in database and return top matches
            stored_matches = []
            for match in matches[:context.max_matches]:
                stored_match = await self._store_match_suggestion(match, db_session)
                stored_matches.append(stored_match)
            
            return stored_matches
            
        except Exception as e:
            logger.error(f"Error finding matches: {e}")
            return []
    
    async def find_matches_for_user(self, context: MatchingContext,
                                  db_session) -> List[Dict[str, Any]]:
        """
        Find all matches for a user across all their items
        """
        try:
            user_data = await self._load_user_data(context.user_id)
            all_matches = []
            
            for item in user_data.items:
                item_context = MatchingContext(
                    user_id=context.user_id,
                    item_id=item.id,
                    max_matches=context.max_matches // len(user_data.items) + 1
                )
                
                item_matches = await self.find_matches_for_item(item_context, db_session)
                all_matches.extend(item_matches)
            
            # Remove duplicates and sort by score
            unique_matches = {match['id']: match for match in all_matches}
            sorted_matches = sorted(
                unique_matches.values(),
                key=lambda x: x['overall_score'],
                reverse=True
            )
            
            return sorted_matches[:context.max_matches]
            
        except Exception as e:
            logger.error(f"Error finding user matches: {e}")
            return []
    
    async def _calculate_match_score(self, item1: ItemData, item2: ItemData,
                                   user1: UserProfile, user2: UserProfile,
                                   user_prefs: MatchingPreference) -> Dict[str, float]:
        """Calculate comprehensive match score"""
        
        # Extract ML features
        features = self.ml_matcher.extract_features(item1, item2, user1, user2)
        
        # Calculate base scores
        value_score = self.value_matcher.get_value_compatibility_score(
            item1.estimated_value or 0,
            item2.estimated_value or 0,
            user_prefs.max_value_difference_percent
        )
        
        geographic_score = 0.5  # Default if no location data
        if item1.coordinates and item2.coordinates:
            distance = self.geo_matcher.calculate_distance(
                item1.coordinates, item2.coordinates
            )
            geographic_score = self.geo_matcher.get_geographic_score(
                distance, user_prefs.max_distance_km
            )
        
        category_score = self.category_matcher.get_category_compatibility_score(
            item1.category, item2.category
        )
        
        semantic_score = self.category_matcher.get_semantic_similarity_score(
            f"{item1.title} {item1.description}",
            f"{item2.title} {item2.description}"
        )
        
        # Get historical data for ML enhancement
        historical_data = await self._get_historical_match_data(user1.id, user2.id)
        
        # Calculate enhanced overall score
        overall_score = self.ml_matcher.calculate_enhanced_score(features, historical_data)
        
        return {
            'overall_score': overall_score,
            'value_score': value_score,
            'geographic_score': geographic_score,
            'category_score': category_score,
            'semantic_score': semantic_score,
            'confidence_level': self._calculate_confidence(features),
            'features': features
        }
    
    def _calculate_confidence(self, features: Dict[str, float]) -> float:
        """Calculate AI confidence in the match"""
        # Higher confidence when features are consistent
        feature_values = [v for k, v in features.items() 
                         if k in self.ml_matcher.feature_weights]
        
        if not feature_values:
            return 0.5
        
        mean_score = np.mean(feature_values)
        std_score = np.std(feature_values)
        
        # Higher confidence for higher means and lower standard deviations
        confidence = mean_score * (1 - std_score)
        return max(0.1, min(1.0, confidence))
    
    async def _generate_ai_reasoning(self, item1: ItemData, item2: ItemData,
                                   scores: Dict[str, float]) -> str:
        """Generate AI reasoning for the match"""
        
        reasoning_parts = []
        
        if scores['value_score'] > 0.7:
            reasoning_parts.append("Items have similar estimated values")
        
        if scores['geographic_score'] > 0.8:
            reasoning_parts.append("Users are located nearby")
        elif scores['geographic_score'] > 0.5:
            reasoning_parts.append("Users are in the same region")
        
        if scores['category_score'] > 0.8:
            reasoning_parts.append("Items are in the same category")
        elif scores['category_score'] > 0.5:
            reasoning_parts.append("Items are in related categories")
        
        if scores['semantic_score'] > 0.6:
            reasoning_parts.append("Item descriptions show good compatibility")
        
        if not reasoning_parts:
            reasoning_parts.append("General compatibility based on user preferences")
        
        base_reasoning = ", ".join(reasoning_parts)
        
        # Enhance with AI if available and enabled
        if not USE_MOCK_API and (XAI_API_KEY != "local_test_key" or GROK_API_KEY != "local_test_key"):
            try:
                enhanced_reasoning = await self._enhance_reasoning_with_ai(
                    item1, item2, scores, base_reasoning
                )
                return enhanced_reasoning
            except Exception as e:
                logger.warning(f"AI reasoning enhancement failed: {e}")
        
        return f"{base_reasoning}. Match confidence: {scores.get('confidence_level', 0.5):.1%}"
    
    async def _enhance_reasoning_with_ai(self, item1: ItemData, item2: ItemData,
                                       scores: Dict[str, float], base_reasoning: str) -> str:
        """Enhance reasoning using external AI service (xAI or GROK)"""
        
        prompt = f"""
        Analyze this trading match and provide a brief, engaging explanation:
        
        Item 1: {item1.title} - {item1.description[:100]}
        Item 2: {item2.title} - {item2.description[:100]}
        
        Scores: Value={scores['value_score']:.2f}, Location={scores['geographic_score']:.2f}, 
        Category={scores['category_score']:.2f}, Overall={scores['overall_score']:.2f}
        
        Base reasoning: {base_reasoning}
        
        Provide a 1-2 sentence explanation of why this is a good match for both users.
        """
        
        # Prioritize xAI if available, fallback to GROK
        api_key = XAI_API_KEY if XAI_API_KEY != "local_test_key" else GROK_API_KEY
        endpoint = f"{XAI_ENDPOINT}/chat/completions" if XAI_API_KEY != "local_test_key" else API_URL
        model = XAI_MODEL if XAI_API_KEY != "local_test_key" else "grok-beta"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 150,
        }
        
        response = requests.post(endpoint, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    
    async def _load_user_data(self, user_id: str) -> UserProfile:
        """Load user data from Appwrite (placeholder)"""
        # This would integrate with the actual Appwrite database
        return UserProfile(
            id=user_id,
            name=f"User {user_id}",
            location="Sample City",
            coordinates=(40.7128, -74.0060),  # NYC coordinates
            preferences={},
            items=[]
        )
    
    async def _load_candidate_items(self, exclude_user_id: str, 
                                  max_distance: float) -> List[ItemData]:
        """Load candidate items from database (placeholder)"""
        # This would query Appwrite for available items
        return []
    
    async def _get_historical_match_data(self, user1_id: str, user2_id: str) -> List[Dict]:
        """Get historical matching data for ML learning"""
        # This would query the matching_history table
        return []
    
    async def _store_match_suggestion(self, match_data: Dict, db_session) -> Dict[str, Any]:
        """Store match suggestion in database"""
        try:
            suggestion = MatchingSuggestion(
                user1_id=match_data['target_item'].user_id,
                user2_id=match_data['candidate_item'].user_id,
                item1_id=match_data['target_item'].id,
                item2_id=match_data['candidate_item'].id,
                overall_score=match_data['scores']['overall_score'],
                value_compatibility_score=match_data['scores']['value_score'],
                geographic_score=match_data['scores']['geographic_score'],
                category_score=match_data['scores']['category_score'],
                preference_score=match_data['scores'].get('preference_score', 0.5),
                ai_reasoning=match_data['ai_reasoning'],
                confidence_level=match_data['scores']['confidence_level'],
                item1_estimated_value=match_data['target_item'].estimated_value,
                item2_estimated_value=match_data['candidate_item'].estimated_value,
                ml_features=match_data['scores']['features'],
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            
            db_session.add(suggestion)
            db_session.commit()
            
            return {
                'id': suggestion.id,
                'user1_id': suggestion.user1_id,
                'user2_id': suggestion.user2_id,
                'item1_id': suggestion.item1_id,
                'item2_id': suggestion.item2_id,
                'overall_score': suggestion.overall_score,
                'ai_reasoning': suggestion.ai_reasoning,
                'confidence_level': suggestion.confidence_level,
                'created_at': suggestion.created_at
            }
            
        except Exception as e:
            logger.error(f"Failed to store match suggestion: {e}")
            db_session.rollback()
            return {}


# Export main class and functions
__all__ = [
    'AIMatchingEngine',
    'MatchingContext',
    'ItemData',
    'UserProfile',
    'GeographicMatcher',
    'ValueMatcher',
    'CategoryMatcher',
    'MLEnhancedMatcher'
]