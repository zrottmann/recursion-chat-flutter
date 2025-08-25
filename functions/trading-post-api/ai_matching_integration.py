"""
AI Matching Integration for Trading Post API
Simplified version of the AI matching engine for direct integration
"""

import math
import json
from typing import List, Dict, Any, Optional, Tuple


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf')
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def calculate_category_similarity(item_category: str, want_category: str) -> float:
    """Calculate category similarity score"""
    if not item_category or not want_category:
        return 0.3
    
    item_cat = item_category.lower().strip()
    want_cat = want_category.lower().strip()
    
    if item_cat == want_cat:
        return 1.0
    
    # Check for partial matches
    category_groups = {
        'electronics': ['phone', 'computer', 'laptop', 'tablet', 'gaming', 'tech'],
        'clothing': ['shirt', 'pants', 'dress', 'shoes', 'accessories'],
        'home': ['furniture', 'decor', 'kitchen', 'appliance'],
        'sports': ['fitness', 'outdoor', 'equipment', 'gear'],
        'books': ['education', 'literature', 'textbook'],
        'toys': ['games', 'children', 'kids']
    }
    
    for group, keywords in category_groups.items():
        item_in_group = any(keyword in item_cat for keyword in keywords)
        want_in_group = any(keyword in want_cat for keyword in keywords)
        if item_in_group and want_in_group:
            return 0.8
    
    return 0.3


def calculate_text_similarity(text1: str, text2: str) -> float:
    """Simple text similarity calculation"""
    if not text1 or not text2:
        return 0.0
    
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0.0


def calculate_value_compatibility(item_price: float, want_budget: float) -> float:
    """Calculate value compatibility score between item price and wanted budget"""
    if not item_price or not want_budget:
        return 0.5  # Neutral score when price info missing
    
    ratio = min(item_price, want_budget) / max(item_price, want_budget)
    return ratio


def calculate_match_score(item: Dict, want: Dict, user_distance: float, max_distance: float = 50.0) -> float:
    """Calculate overall match score for an item-want pair"""
    # Distance scoring (closer = better)
    if user_distance > max_distance:
        return 0.0  # Too far
    
    distance_score = max(0, 1 - (user_distance / max_distance))
    
    # Category compatibility
    category_score = calculate_category_similarity(
        item.get('category', ''),
        want.get('category', '')
    )
    
    # Value compatibility
    value_score = calculate_value_compatibility(
        float(item.get('price', 0)),
        float(want.get('max_budget', 0))
    )
    
    # Description similarity
    desc_score = calculate_text_similarity(
        item.get('description', ''),
        want.get('description', '')
    )
    
    # Title similarity
    title_score = calculate_text_similarity(
        item.get('title', ''),
        want.get('title', '')
    )
    
    # Weighted final score
    final_score = (
        distance_score * 0.25 +
        category_score * 0.35 +
        value_score * 0.15 +
        desc_score * 0.15 +
        title_score * 0.10
    )
    
    return min(1.0, max(0.0, final_score))


def find_user_matches(databases, user_id: str, database_id: str = 'trading_post_db') -> List[Dict]:
    """Find matches for a specific user"""
    try:
        # Get user's wants
        wants_response = databases.list_documents(
            database_id=database_id,
            collection_id='wants',
            limit=100
        )
        user_wants = [want for want in wants_response['documents'] if want.get('user_id') == user_id]
        
        # Get available items (excluding user's own items)
        items_response = databases.list_documents(
            database_id=database_id,
            collection_id='items',
            limit=200
        )
        available_items = [item for item in items_response['documents'] if item.get('owner_id') != user_id]
        
        # Get user profile for location
        try:
            user_profile = databases.get_document(
                database_id=database_id,
                collection_id='users',
                document_id=user_id
            )
            user_lat = float(user_profile.get('latitude', 0))
            user_lon = float(user_profile.get('longitude', 0))
        except:
            user_lat, user_lon = 0, 0  # Default location if not available
        
        matches = []
        
        # Find matches for each want
        for want in user_wants:
            for item in available_items:
                # Calculate distance to item owner
                try:
                    item_owner_profile = databases.get_document(
                        database_id=database_id,
                        collection_id='users',
                        document_id=item.get('owner_id', '')
                    )
                    item_lat = float(item_owner_profile.get('latitude', 0))
                    item_lon = float(item_owner_profile.get('longitude', 0))
                    distance = calculate_distance(user_lat, user_lon, item_lat, item_lon)
                except:
                    distance = 25  # Default reasonable distance
                
                # Calculate match score
                score = calculate_match_score(item, want, distance)
                
                if score >= 0.6:  # Minimum match threshold
                    matches.append({
                        'id': f"match_{want['$id']}_{item['$id']}",
                        'want_id': want['$id'],
                        'item_id': item['$id'],
                        'item': {
                            'title': item.get('title', ''),
                            'category': item.get('category', ''),
                            'price': item.get('price', 0),
                            'description': item.get('description', ''),
                            'owner_id': item.get('owner_id', '')
                        },
                        'want': {
                            'title': want.get('title', ''),
                            'category': want.get('category', ''),
                            'max_budget': want.get('max_budget', 0),
                            'description': want.get('description', '')
                        },
                        'match_score': round(score, 3),
                        'distance_km': round(distance, 1),
                        'reason': get_match_reason(score, distance),
                        'created_at': '2024-01-15T10:00:00Z'
                    })
        
        # Sort by match score (highest first)
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return matches[:20]  # Return top 20 matches
        
    except Exception as e:
        print(f"Error finding matches: {str(e)}")
        return []


def get_match_reason(score: float, distance: float) -> str:
    """Generate human-readable reason for the match"""
    reasons = []
    
    if score >= 0.9:
        reasons.append("Excellent match")
    elif score >= 0.8:
        reasons.append("Very good match")
    elif score >= 0.7:
        reasons.append("Good match")
    else:
        reasons.append("Potential match")
    
    if distance <= 5:
        reasons.append("very close location")
    elif distance <= 15:
        reasons.append("nearby location")
    elif distance <= 30:
        reasons.append("reasonable distance")
    
    return " - " + ", ".join(reasons)


def generate_ai_suggestions(user_behavior: Dict) -> List[Dict]:
    """Generate AI-powered suggestions based on user behavior"""
    suggestions = []
    
    # Mock AI suggestions based on user behavior patterns
    preferred_categories = user_behavior.get('preferred_categories', ['Electronics'])
    
    for category in preferred_categories:
        suggestions.append({
            'type': 'category_trend',
            'title': f'Trending items in {category}',
            'description': f'Based on your interest in {category}, these items might interest you',
            'category': category,
            'confidence': 0.85
        })
    
    # Price-based suggestions
    avg_budget = user_behavior.get('average_budget', 100)
    suggestions.append({
        'type': 'price_optimization',
        'title': 'Price-optimized matches',
        'description': f'Items within your typical budget range of ${avg_budget}',
        'budget_range': avg_budget,
        'confidence': 0.75
    })
    
    return suggestions[:5]  # Return top 5 suggestions