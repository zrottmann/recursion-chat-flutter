"""
Appwrite Function: Trading Logic
Handles complex trading operations and AI matching
"""

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
import json
import os
from datetime import datetime
import math


def main(context):
    """
    Main function for trading logic
    """
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
    client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
    client.set_key(os.environ.get('APPWRITE_API_KEY'))
    
    # Initialize services
    databases = Databases(client)
    
    try:
        # Parse request
        req = context.req
        method = req.method
        path = req.path
        payload = json.loads(req.body) if req.body else {}
        
        # Route trading logic requests
        if path.endswith('/match'):
            return handle_ai_matching(databases, payload, context)
        elif path.endswith('/suggest'):
            return handle_trade_suggestions(databases, payload, context)
        elif path.endswith('/calculate-value'):
            return handle_value_calculation(databases, payload, context)
        elif path.endswith('/nearby-items'):
            return handle_nearby_search(databases, payload, context)
        else:
            return context.res.json({
                'success': False,
                'error': 'Trading logic route not found'
            }, 404)
            
    except Exception as e:
        context.log(f"Error in trading function: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_ai_matching(databases, payload, context):
    """Handle AI-powered item matching"""
    try:
        user_id = payload.get('user_id')
        item_category = payload.get('category', '')
        max_distance = payload.get('max_distance', 10)  # km
        user_lat = payload.get('latitude')
        user_lng = payload.get('longitude')
        
        if not user_id:
            return context.res.json({
                'success': False,
                'error': 'User ID is required'
            }, 400)
        
        database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
        
        # Get user's wants
        wants_response = databases.list_documents(
            database_id=database_id,
            collection_id='wants',
            queries=[Query.equal('user_id', user_id)]
        )
        
        user_wants = [want['item_category'] for want in wants_response['documents']]
        
        # Find matching items
        items_response = databases.list_documents(
            database_id=database_id,
            collection_id='items',
            queries=[
                Query.not_equal('user_id', user_id),  # Not user's own items
                Query.equal('status', 'available')
            ],
            limit=100
        )
        
        matches = []
        for item in items_response['documents']:
            # Check if item category matches user wants
            if item.get('category') in user_wants:
                # Calculate distance if coordinates provided
                distance = None
                if user_lat and user_lng and item.get('latitude') and item.get('longitude'):
                    distance = calculate_distance(
                        user_lat, user_lng,
                        item['latitude'], item['longitude']
                    )
                    
                    # Skip if too far
                    if distance > max_distance:
                        continue
                
                # Calculate match score
                match_score = calculate_match_score(item, user_wants, distance)
                
                matches.append({
                    'item': item,
                    'distance': distance,
                    'match_score': match_score
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return context.res.json({
            'success': True,
            'data': matches[:20]  # Return top 20 matches
        })
        
    except Exception as e:
        context.log(f"Error in handle_ai_matching: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_trade_suggestions(databases, payload, context):
    """Handle trade suggestions based on user history"""
    try:
        user_id = payload.get('user_id')
        
        if not user_id:
            return context.res.json({
                'success': False,
                'error': 'User ID is required'
            }, 400)
        
        database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
        
        # Get user's trading history
        trades_response = databases.list_documents(
            database_id=database_id,
            collection_id='trades',
            queries=[
                Query.equal('requester_id', user_id),
                Query.equal('status', 'completed')
            ],
            limit=50
        )
        
        # Analyze patterns and suggest similar items
        suggested_categories = analyze_trading_patterns(trades_response['documents'])
        
        # Find items in suggested categories
        suggestions = []
        for category in suggested_categories:
            items_response = databases.list_documents(
                database_id=database_id,
                collection_id='items',
                queries=[
                    Query.equal('category', category),
                    Query.not_equal('user_id', user_id),
                    Query.equal('status', 'available')
                ],
                limit=5
            )
            
            suggestions.extend(items_response['documents'])
        
        return context.res.json({
            'success': True,
            'data': suggestions
        })
        
    except Exception as e:
        context.log(f"Error in handle_trade_suggestions: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_value_calculation(databases, payload, context):
    """Handle item value calculation"""
    try:
        item_id = payload.get('item_id')
        
        if not item_id:
            return context.res.json({
                'success': False,
                'error': 'Item ID is required'
            }, 400)
        
        database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
        
        # Get item details
        item = databases.get_document(
            database_id=database_id,
            collection_id='items',
            document_id=item_id
        )
        
        # Calculate estimated value based on category, condition, etc.
        estimated_value = calculate_item_value(item)
        
        return context.res.json({
            'success': True,
            'data': {
                'estimated_value': estimated_value,
                'confidence': 0.75,  # Placeholder confidence score
                'factors': {
                    'category': item.get('category'),
                    'condition': item.get('condition'),
                    'age': item.get('age', 'unknown')
                }
            }
        })
        
    except Exception as e:
        context.log(f"Error in handle_value_calculation: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_nearby_search(databases, payload, context):
    """Handle nearby items search"""
    try:
        latitude = payload.get('latitude')
        longitude = payload.get('longitude')
        radius = payload.get('radius', 10)  # km
        category = payload.get('category', '')
        
        if not latitude or not longitude:
            return context.res.json({
                'success': False,
                'error': 'Latitude and longitude are required'
            }, 400)
        
        database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
        
        # Get all available items
        queries = [Query.equal('status', 'available')]
        if category:
            queries.append(Query.equal('category', category))
        
        items_response = databases.list_documents(
            database_id=database_id,
            collection_id='items',
            queries=queries,
            limit=200
        )
        
        # Filter by distance
        nearby_items = []
        for item in items_response['documents']:
            if item.get('latitude') and item.get('longitude'):
                distance = calculate_distance(
                    latitude, longitude,
                    item['latitude'], item['longitude']
                )
                
                if distance <= radius:
                    nearby_items.append({
                        'item': item,
                        'distance': distance
                    })
        
        # Sort by distance
        nearby_items.sort(key=lambda x: x['distance'])
        
        return context.res.json({
            'success': True,
            'data': nearby_items
        })
        
    except Exception as e:
        context.log(f"Error in handle_nearby_search: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two coordinates in kilometers"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def calculate_match_score(item, user_wants, distance):
    """Calculate match score for an item"""
    score = 0
    
    # Category match (highest priority)
    if item.get('category') in user_wants:
        score += 50
    
    # Condition bonus
    condition_scores = {'excellent': 20, 'good': 15, 'fair': 10, 'poor': 5}
    score += condition_scores.get(item.get('condition', '').lower(), 0)
    
    # Distance penalty (closer is better)
    if distance is not None:
        if distance <= 1:
            score += 20
        elif distance <= 5:
            score += 10
        elif distance <= 10:
            score += 5
        else:
            score -= (distance - 10) * 2  # Penalty for far items
    
    # Recency bonus
    created_at = item.get('created_at', '')
    if created_at:
        try:
            item_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            days_old = (datetime.now() - item_date.replace(tzinfo=None)).days
            if days_old <= 7:
                score += 10
            elif days_old <= 30:
                score += 5
        except:
            pass
    
    return max(0, score)


def calculate_item_value(item):
    """Calculate estimated item value"""
    base_values = {
        'electronics': 200,
        'furniture': 150,
        'clothing': 50,
        'books': 20,
        'tools': 100,
        'sports': 75,
        'toys': 30,
        'jewelry': 300,
        'art': 250,
        'other': 50
    }
    
    condition_multipliers = {
        'excellent': 1.0,
        'good': 0.8,
        'fair': 0.6,
        'poor': 0.4
    }
    
    base_value = base_values.get(item.get('category', '').lower(), 50)
    condition_multiplier = condition_multipliers.get(item.get('condition', '').lower(), 0.7)
    
    return int(base_value * condition_multiplier)


def analyze_trading_patterns(trades):
    """Analyze trading patterns to suggest categories"""
    category_counts = {}
    
    for trade in trades:
        category = trade.get('item_category', '')
        if category:
            category_counts[category] = category_counts.get(category, 0) + 1
    
    # Return categories sorted by frequency
    sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    return [category for category, count in sorted_categories[:5]]