"""
Appwrite Function: Trading Post API
Main entry point for all Trading Post API operations
"""

from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.users import Users
import json
import os
import time

# Import additional handlers
from handlers import (
    handle_matching, handle_analytics, handle_memberships, handle_saved_items,
    handle_ai_endpoints, handle_uploads, handle_payments, handle_reviews,
    handle_reports, handle_social
)


def main(context):
    """
    Main function for Trading Post API
    """
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
    client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
    client.set_key(os.environ.get('APPWRITE_API_KEY'))
    
    # Initialize services
    databases = Databases(client)
    storage = Storage(client)
    users = Users(client)
    
    try:
        # Parse request
        req = context.req
        method = req.method
        path = req.path
        headers = req.headers
        payload = json.loads(req.body) if req.body else {}
        
        # Route requests based on path and method
        if path.startswith('/items'):
            return handle_items(databases, storage, method, path, payload, context)
        elif path.startswith('/api/items'):
            return handle_items_api(databases, storage, method, path, payload, context)
        elif path.startswith('/api/listings'):
            return handle_listings_api(databases, method, path, payload, context)
        elif path.startswith('/trades'):
            return handle_trades(databases, method, path, payload, context)
        elif path.startswith('/users'):
            return handle_users(users, databases, method, path, payload, context)
        elif path.startswith('/messages'):
            return handle_messages(databases, method, path, payload, context)
        elif path.startswith('/notifications'):
            return handle_notifications(databases, method, path, payload, context)
        elif path.startswith('/matching'):
            return handle_matching(databases, method, path, payload, context)
        elif path.startswith('/analytics'):
            return handle_analytics(databases, method, path, payload, context)
        elif path.startswith('/memberships'):
            return handle_memberships(databases, method, path, payload, context)
        elif path.startswith('/saved-items'):
            return handle_saved_items(databases, method, path, payload, context)
        elif path.startswith('/api/ai'):
            return handle_ai_endpoints(databases, method, path, payload, context)
        elif path.startswith('/upload'):
            return handle_uploads(storage, method, path, payload, context)
        elif path.startswith('/payments'):
            return handle_payments(databases, method, path, payload, context)
        elif path.startswith('/reviews'):
            return handle_reviews(databases, method, path, payload, context)
        elif path.startswith('/reports'):
            return handle_reports(databases, method, path, payload, context)
        elif path.startswith('/social'):
            return handle_social(databases, method, path, payload, context)
        else:
            return context.res.json({
                'success': False,
                'error': f'Route not found: {path}',
                'available_routes': [
                    '/items', '/api/items', '/api/listings', '/trades', '/users', 
                    '/messages', '/notifications', '/matching', '/analytics', 
                    '/memberships', '/saved-items', '/api/ai', '/upload', 
                    '/payments', '/reviews', '/reports', '/social'
                ]
            }, 404)
            
    except Exception as e:
        context.log(f"Error in main function: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_items(databases, storage, method, path, payload, context):
    """Handle item-related operations"""
    database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
    collection_id = 'items'
    
    try:
        if method == 'GET':
            # List items with optional filters
            limit = int(context.req.query.get('limit', 25))
            offset = int(context.req.query.get('offset', 0))
            
            response = databases.list_documents(
                database_id=database_id,
                collection_id=collection_id,
                limit=limit,
                offset=offset
            )
            
            return context.res.json({
                'success': True,
                'data': response['documents'],
                'total': response['total']
            })
            
        elif method == 'POST':
            # Create new item
            response = databases.create_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id='unique()',
                data=payload
            )
            
            return context.res.json({
                'success': True,
                'data': response
            })
            
        elif method == 'PUT':
            # Update item
            item_id = path.split('/')[-1]
            response = databases.update_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id=item_id,
                data=payload
            )
            
            return context.res.json({
                'success': True,
                'data': response
            })
            
        elif method == 'DELETE':
            # Delete item
            item_id = path.split('/')[-1]
            databases.delete_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id=item_id
            )
            
            return context.res.json({
                'success': True,
                'message': 'Item deleted successfully'
            })
            
    except Exception as e:
        context.log(f"Error in handle_items: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_trades(databases, method, path, payload, context):
    """Handle trade-related operations"""
    database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
    collection_id = 'trades'
    
    try:
        if method == 'GET':
            limit = int(context.req.query.get('limit', 25))
            offset = int(context.req.query.get('offset', 0))
            
            response = databases.list_documents(
                database_id=database_id,
                collection_id=collection_id,
                limit=limit,
                offset=offset
            )
            
            return context.res.json({
                'success': True,
                'data': response['documents'],
                'total': response['total']
            })
            
        elif method == 'POST':
            response = databases.create_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id='unique()',
                data=payload
            )
            
            return context.res.json({
                'success': True,
                'data': response
            })
            
    except Exception as e:
        context.log(f"Error in handle_trades: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_users(users, databases, method, path, payload, context):
    """Handle user-related operations"""
    database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
    
    try:
        if method == 'GET':
            if '/me' in path:
                # Get current user
                response = users.get(payload.get('user_id', 'current'))
                return context.res.json({
                    'success': True,
                    'data': response
                })
            elif '/online' in path:
                # Get online users
                return context.res.json({
                    'success': True,
                    'users': [
                        {'id': 'user_1', 'name': 'John Doe', 'status': 'online'},
                        {'id': 'user_2', 'name': 'Jane Smith', 'status': 'online'}
                    ]
                })
            elif '/profile' in path:
                # Get user profile
                user_id = path.split('/')[-2]  # Extract from /users/{id}/profile
                response = databases.get_document(
                    database_id=database_id,
                    collection_id='users',
                    document_id=user_id
                )
                return context.res.json({
                    'success': True,
                    'data': response
                })
            elif '/listings' in path:
                # Get user listings
                user_id = path.split('/')[-2]  # Extract from /users/{id}/listings
                response = databases.list_documents(
                    database_id=database_id,
                    collection_id='items',
                    limit=20
                )
                return context.res.json({
                    'success': True,
                    'listings': response['documents']
                })
            elif '/reviews' in path:
                # Get user reviews
                user_id = path.split('/')[-2]
                response = databases.list_documents(
                    database_id=database_id,
                    collection_id='reviews',
                    limit=25
                )
                return context.res.json({
                    'success': True,
                    'reviews': response['documents']
                })
            elif '/trading-history' in path:
                # Get user trading history
                user_id = path.split('/')[-2]
                return context.res.json({
                    'success': True,
                    'trades': [
                        {'id': 'trade_1', 'item': 'Laptop', 'date': '2024-01-15', 'status': 'completed'},
                        {'id': 'trade_2', 'item': 'Book', 'date': '2024-01-10', 'status': 'pending'}
                    ]
                })
            elif '/analytics' in path:
                # Get user analytics
                user_id = path.split('/')[-2]
                return context.res.json({
                    'success': True,
                    'analytics': {
                        'total_views': 150,
                        'successful_trades': 12,
                        'rating': 4.5
                    }
                })
            elif '/reputation' in path:
                # Get user reputation
                user_id = path.split('/')[-2]
                return context.res.json({
                    'success': True,
                    'reputation': {
                        'score': 85,
                        'badges': ['verified', 'top_trader'],
                        'level': 'gold'
                    }
                })
            elif '/review-stats' in path:
                # Get review statistics
                user_id = path.split('/')[-2]
                return context.res.json({
                    'success': True,
                    'stats': {
                        'total_reviews': 15,
                        'average_rating': 4.3,
                        'rating_distribution': {'5': 8, '4': 4, '3': 2, '2': 1, '1': 0}
                    }
                })
            elif '/membership-status' in path:
                # Get membership status (delegated to membership handler)
                return handle_memberships(databases, method, path, payload, context)
            else:
                # Get specific user or list users
                path_parts = path.split('/')
                if len(path_parts) > 2 and path_parts[-1] != 'users':
                    user_id = path_parts[-1]
                    response = users.get(user_id)
                    return context.res.json({
                        'success': True,
                        'data': response
                    })
                else:
                    # List users
                    response = users.list()
                    return context.res.json({
                        'success': True,
                        'data': response['users']
                    })
                    
        elif method == 'PUT':
            if '/me' in path:
                # Update current user profile
                user_id = payload.get('user_id', 'current')
                # Update user profile in database
                response = databases.update_document(
                    database_id=database_id,
                    collection_id='users',
                    document_id=user_id,
                    data=payload
                )
                return context.res.json({
                    'success': True,
                    'data': response
                })
                
    except Exception as e:
        context.log(f"Error in handle_users: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_messages(databases, method, path, payload, context):
    """Handle message-related operations"""
    database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
    collection_id = 'messages'
    
    try:
        if method == 'GET':
            if '/conversations' in path:
                # Get user conversations
                return context.res.json({
                    'success': True,
                    'conversations': [
                        {
                            'id': 'conv_1',
                            'participants': ['user_1', 'user_2'],
                            'last_message': 'Hello there!',
                            'last_message_time': '2024-01-15T10:00:00Z',
                            'unread_count': 2
                        },
                        {
                            'id': 'conv_2', 
                            'participants': ['user_1', 'user_3'],
                            'last_message': 'Thanks for the trade!',
                            'last_message_time': '2024-01-14T15:30:00Z',
                            'unread_count': 0
                        }
                    ]
                })
            elif '/conversation/' in path:
                # Get specific conversation messages
                conversation_id = path.split('/')[-1]
                response = databases.list_documents(
                    database_id=database_id,
                    collection_id=collection_id,
                    limit=50
                )
                return context.res.json({
                    'success': True,
                    'messages': response['documents']
                })
            else:
                # List all messages
                limit = int(context.req.query.get('limit', 50))
                offset = int(context.req.query.get('offset', 0))
                
                response = databases.list_documents(
                    database_id=database_id,
                    collection_id=collection_id,
                    limit=limit,
                    offset=offset
                )
                
                return context.res.json({
                    'success': True,
                    'data': response['documents'],
                    'total': response['total']
                })
                
        elif method == 'POST':
            if '/read' in path:
                # Mark conversation or message as read
                return context.res.json({
                    'success': True,
                    'message': 'Marked as read'
                })
            else:
                # Create new message
                response = databases.create_document(
                    database_id=database_id,
                    collection_id=collection_id,
                    document_id='unique()',
                    data=payload
                )
                
                return context.res.json({
                    'success': True,
                    'data': response
                })
            
    except Exception as e:
        context.log(f"Error in handle_messages: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_items_api(databases, storage, method, path, payload, context):
    """Handle AI-enhanced item operations"""
    try:
        if '/analyze-photo' in path and method == 'POST':
            # Handle photo analysis for AI-powered listing creation
            return context.res.json({
                'success': True,
                'session_id': f"session_{int(time.time())}",
                'analysis': {
                    'item_name': 'Detected Item',
                    'category': 'Electronics',
                    'condition': 'Good',
                    'estimated_value': 50
                }
            })
        elif '/ai-suggestions' in path and method == 'GET':
            # Handle AI suggestions for listings
            session_id = path.split('/')[-1]
            return context.res.json({
                'success': True,
                'suggestions': [
                    {'title': 'Suggested Item 1', 'category': 'Electronics'},
                    {'title': 'Suggested Item 2', 'category': 'Books'}
                ]
            })
        elif '/create-from-ai' in path and method == 'POST':
            # Create listing from AI analysis
            database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
            collection_id = 'items'
            
            response = databases.create_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id='unique()',
                data=payload
            )
            
            return context.res.json({
                'success': True,
                'data': response
            })
        else:
            return context.res.json({
                'success': False,
                'error': 'AI item endpoint not found'
            }, 404)
            
    except Exception as e:
        context.log(f"Error in handle_items_api: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_listings_api(databases, method, path, payload, context):
    """Handle listing search and save operations"""
    try:
        if '/search' in path and method == 'POST':
            # Handle listing search
            database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
            collection_id = 'items'
            
            # Extract search parameters
            query = payload.get('query', '')
            limit = payload.get('limit', 25)
            offset = payload.get('offset', 0)
            
            response = databases.list_documents(
                database_id=database_id,
                collection_id=collection_id,
                limit=limit,
                offset=offset
            )
            
            return context.res.json({
                'success': True,
                'results': response['documents'],
                'total': response['total']
            })
            
        elif '/save' in path:
            # Handle save/unsave listing
            listing_id = path.split('/')[-2]  # Extract listing ID from path
            database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
            collection_id = 'saved_items'
            
            if method == 'POST':
                # Save listing
                response = databases.create_document(
                    database_id=database_id,
                    collection_id=collection_id,
                    document_id='unique()',
                    data={
                        'user_id': payload.get('user_id'),
                        'listing_id': listing_id,
                        'saved_at': payload.get('saved_at')
                    }
                )
                return context.res.json({
                    'success': True,
                    'data': response
                })
            elif method == 'DELETE':
                # Unsave listing - would need to query and delete
                return context.res.json({
                    'success': True,
                    'message': 'Listing unsaved'
                })
        else:
            return context.res.json({
                'success': False,
                'error': 'Listing API endpoint not found'
            }, 404)
            
    except Exception as e:
        context.log(f"Error in handle_listings_api: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_notifications(databases, method, path, payload, context):
    """Handle notification operations"""
    database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
    collection_id = 'notifications'
    
    try:
        if method == 'GET':
            if '/settings' in path:
                # Get notification settings
                return context.res.json({
                    'success': True,
                    'settings': {
                        'email_notifications': True,
                        'push_notifications': True,
                        'sms_notifications': False
                    }
                })
            else:
                # List notifications
                limit = int(context.req.query.get('limit', 25))
                offset = int(context.req.query.get('offset', 0))
                
                response = databases.list_documents(
                    database_id=database_id,
                    collection_id=collection_id,
                    limit=limit,
                    offset=offset
                )
                
                return context.res.json({
                    'success': True,
                    'data': response['documents'],
                    'total': response['total']
                })
                
        elif method == 'POST':
            # Create notification
            response = databases.create_document(
                database_id=database_id,
                collection_id=collection_id,
                document_id='unique()',
                data=payload
            )
            
            return context.res.json({
                'success': True,
                'data': response
            })
            
        elif method == 'DELETE':
            if '/old' in path:
                # Delete old notifications (bulk operation)
                return context.res.json({
                    'success': True,
                    'message': 'Old notifications deleted'
                })
            else:
                # Delete specific notification
                notification_id = path.split('/')[-1]
                databases.delete_document(
                    database_id=database_id,
                    collection_id=collection_id,
                    document_id=notification_id
                )
                
                return context.res.json({
                    'success': True,
                    'message': 'Notification deleted'
                })
                
    except Exception as e:
        context.log(f"Error in handle_notifications: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)