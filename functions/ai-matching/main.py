"""
AI Matching Engine Function for Trading Post
Intelligent matching system combining ML algorithms with business logic
"""

import os
import json
import logging
import math
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment configuration
USE_MOCK_API = os.getenv("USE_MOCK_API", "true").lower() == "true"
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "trading_post_db")
GROK_API_KEY = os.getenv("GROK_API_KEY", "")
MAX_DISTANCE_KM = float(os.getenv("MAX_MATCHING_DISTANCE_KM", "50"))
MIN_MATCH_SCORE = float(os.getenv("MIN_MATCH_SCORE", "0.6"))

# Collection IDs
ITEMS_COLLECTION = "items"
USERS_COLLECTION = "users" 
WANTS_COLLECTION = "wants"
MATCHES_COLLECTION = "matches"

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points using Haversine formula
    """
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

def calculate_value_compatibility(item_price: float, want_budget: float) -> float:
    """
    Calculate value compatibility score between item price and wanted budget
    """
    if not item_price or not want_budget:
        return 0.5  # Neutral score when price info missing
    
    ratio = min(item_price, want_budget) / max(item_price, want_budget)
    return ratio

def calculate_category_similarity(item_category: str, want_category: str) -> float:
    """
    Calculate category similarity score
    """
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
    """
    Simple text similarity calculation
    """
    if not text1 or not text2:
        return 0.0
    
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0.0

def calculate_match_score(item: Dict, want: Dict, user_distance: float) -> float:
    """
    Calculate overall match score for an item-want pair
    """
    # Distance scoring (closer = better)
    if user_distance > MAX_DISTANCE_KM:
        return 0.0  # Too far
    
    distance_score = max(0, 1 - (user_distance / MAX_DISTANCE_KM))
    
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
        value_score * 0.20 +
        desc_score * 0.10 +
        title_score * 0.10
    )
    
    return min(1.0, final_score)

def find_matches_for_user(databases: Databases, user_id: str, user_data: Dict) -> List[Dict]:
    """
    Find matches for a specific user
    """
    matches = []
    
    try:
        # Get user's location
        user_lat = float(user_data.get('latitude', 0))
        user_lon = float(user_data.get('longitude', 0))
        
        if not user_lat or not user_lon:
            logger.warning(f"User {user_id} has no location data")
            return matches
        
        # Get user's wants
        wants_response = databases.list_documents(
            DATABASE_ID,
            WANTS_COLLECTION,
            [Query.equal('user_id', user_id)]
        )
        
        user_wants = wants_response['documents']
        
        if not user_wants:
            return matches
        
        # Get available items from other users
        items_response = databases.list_documents(
            DATABASE_ID,
            ITEMS_COLLECTION,
            [
                Query.not_equal('user_id', user_id),  # Not user's own items
                Query.equal('available', True)         # Available items only
            ]
        )
        
        available_items = items_response['documents']
        
        # Calculate matches
        for want in user_wants:
            for item in available_items:
                # Get item owner's location
                try:
                    owner_response = databases.get_document(
                        DATABASE_ID,
                        USERS_COLLECTION,
                        item['user_id']
                    )
                    
                    owner_lat = float(owner_response.get('latitude', 0))
                    owner_lon = float(owner_response.get('longitude', 0))
                    
                    if not owner_lat or not owner_lon:
                        continue
                    
                    # Calculate distance
                    distance = calculate_distance(user_lat, user_lon, owner_lat, owner_lon)
                    
                    # Calculate match score
                    score = calculate_match_score(item, want, distance)
                    
                    if score >= MIN_MATCH_SCORE:
                        matches.append({
                            'user_id': user_id,
                            'want_id': want['$id'],
                            'item_id': item['$id'],
                            'item_owner_id': item['user_id'],
                            'match_score': score,
                            'distance_km': round(distance, 2),
                            'category_match': calculate_category_similarity(
                                item.get('category', ''),
                                want.get('category', '')
                            ),
                            'value_match': calculate_value_compatibility(
                                float(item.get('price', 0)),
                                float(want.get('max_budget', 0))
                            ),
                            'created_at': datetime.utcnow().isoformat()
                        })
                
                except Exception as e:
                    logger.error(f"Error processing item {item['$id']}: {str(e)}")
                    continue
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        # Limit results
        return matches[:20]
        
    except Exception as e:
        logger.error(f"Error finding matches for user {user_id}: {str(e)}")
        return []

def save_matches_to_db(databases: Databases, matches: List[Dict]) -> int:
    """
    Save calculated matches to database
    """
    saved_count = 0
    
    for match in matches:
        try:
            # Check if match already exists
            existing = databases.list_documents(
                DATABASE_ID,
                MATCHES_COLLECTION,
                [
                    Query.equal('user_id', match['user_id']),
                    Query.equal('item_id', match['item_id']),
                    Query.equal('want_id', match['want_id'])
                ]
            )
            
            if existing['total'] == 0:
                # Create new match
                databases.create_document(
                    DATABASE_ID,
                    MATCHES_COLLECTION,
                    'unique()',
                    match
                )
                saved_count += 1
            else:
                # Update existing match score
                databases.update_document(
                    DATABASE_ID,
                    MATCHES_COLLECTION,
                    existing['documents'][0]['$id'],
                    {
                        'match_score': match['match_score'],
                        'updated_at': match['created_at']
                    }
                )
                saved_count += 1
                
        except Exception as e:
            logger.error(f"Error saving match: {str(e)}")
            continue
    
    return saved_count

def main(context):
    """
    Main AI Matching Function entry point
    """
    try:
        # Initialize Appwrite client
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(os.environ.get('APPWRITE_API_KEY'))
        
        databases = Databases(client)
        
        # Parse request
        req = context.req
        method = req.method
        payload = json.loads(req.body) if req.body else {}
        
        if method == 'POST' and 'user_id' in payload:
            # Find matches for specific user
            user_id = payload['user_id']
            
            try:
                user_response = databases.get_document(DATABASE_ID, USERS_COLLECTION, user_id)
                matches = find_matches_for_user(databases, user_id, user_response)
                saved_count = save_matches_to_db(databases, matches)
                
                return context.res.json({
                    'success': True,
                    'user_id': user_id,
                    'matches_found': len(matches),
                    'matches_saved': saved_count,
                    'matches': matches[:10]  # Return top 10 matches
                })
                
            except Exception as e:
                return context.res.json({
                    'success': False,
                    'error': f'Error finding matches for user: {str(e)}'
                }, 400)
                
        elif method == 'POST' and payload.get('action') == 'batch_matching':
            # Run batch matching for all users
            try:
                users_response = databases.list_documents(DATABASE_ID, USERS_COLLECTION)
                users = users_response['documents']
                
                total_matches = 0
                processed_users = 0
                
                for user in users:
                    try:
                        matches = find_matches_for_user(databases, user['$id'], user)
                        saved_count = save_matches_to_db(databases, matches)
                        total_matches += saved_count
                        processed_users += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing user {user['$id']}: {str(e)}")
                        continue
                
                return context.res.json({
                    'success': True,
                    'processed_users': processed_users,
                    'total_matches': total_matches,
                    'message': f'Batch matching completed for {processed_users} users'
                })
                
            except Exception as e:
                return context.res.json({
                    'success': False,
                    'error': f'Batch matching failed: {str(e)}'
                }, 500)
        
        else:
            return context.res.json({
                'success': False,
                'error': 'Invalid request. Provide user_id or action=batch_matching'
            }, 400)
        
    except Exception as e:
        logger.error(f"AI Matching Function error: {str(e)}")
        return context.res.json({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }, 500)