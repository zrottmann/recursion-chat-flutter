"""
Appwrite Function: User Authentication
Handles user authentication and authorization
"""

from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.users import Users
from appwrite.services.databases import Databases
import json
import os
from datetime import datetime


def main(context):
    """
    Main function for user authentication
    """
    
    # Initialize Appwrite client
    client = Client()
    client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
    client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
    client.set_key(os.environ.get('APPWRITE_API_KEY'))
    
    # Initialize services
    account = Account(client)
    users = Users(client)
    databases = Databases(client)
    
    try:
        # Parse request
        req = context.req
        method = req.method
        path = req.path
        payload = json.loads(req.body) if req.body else {}
        
        # Route authentication requests
        if path.endswith('/register'):
            return handle_registration(users, databases, payload, context)
        elif path.endswith('/login'):
            return handle_login(account, payload, context)
        elif path.endswith('/logout'):
            return handle_logout(account, context)
        elif path.endswith('/verify'):
            return handle_verification(users, payload, context)
        elif path.endswith('/profile'):
            return handle_profile(users, databases, method, payload, context)
        else:
            return context.res.json({
                'success': False,
                'error': 'Authentication route not found'
            }, 404)
            
    except Exception as e:
        context.log(f"Error in auth function: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_registration(users, databases, payload, context):
    """Handle user registration"""
    try:
        email = payload.get('email')
        password = payload.get('password')
        name = payload.get('name', '')
        
        if not email or not password:
            return context.res.json({
                'success': False,
                'error': 'Email and password are required'
            }, 400)
        
        # Create user account
        user = users.create(
            user_id='unique()',
            email=email,
            password=password,
            name=name
        )
        
        # Create user profile in database
        database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
        profile_data = {
            'user_id': user['$id'],
            'email': email,
            'name': name,
            'created_at': datetime.now().isoformat(),
            'profile_complete': False,
            'verification_status': 'pending'
        }
        
        databases.create_document(
            database_id=database_id,
            collection_id='users',
            document_id=user['$id'],
            data=profile_data
        )
        
        return context.res.json({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user['$id']
        })
        
    except Exception as e:
        context.log(f"Error in handle_registration: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_login(account, payload, context):
    """Handle user login"""
    try:
        email = payload.get('email')
        password = payload.get('password')
        
        if not email or not password:
            return context.res.json({
                'success': False,
                'error': 'Email and password are required'
            }, 400)
        
        # Create session
        session = account.create_email_password_session(email, password)
        
        return context.res.json({
            'success': True,
            'message': 'Login successful',
            'session': session
        })
        
    except Exception as e:
        context.log(f"Error in handle_login: {str(e)}")
        return context.res.json({
            'success': False,
            'error': 'Invalid credentials'
        }, 401)


def handle_logout(account, context):
    """Handle user logout"""
    try:
        # Delete current session
        account.delete_session('current')
        
        return context.res.json({
            'success': True,
            'message': 'Logout successful'
        })
        
    except Exception as e:
        context.log(f"Error in handle_logout: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_verification(users, payload, context):
    """Handle user verification"""
    try:
        user_id = payload.get('user_id')
        verification_token = payload.get('token')
        
        if not user_id or not verification_token:
            return context.res.json({
                'success': False,
                'error': 'User ID and token are required'
            }, 400)
        
        # Update user verification status
        users.update_email_verification(user_id, True)
        
        return context.res.json({
            'success': True,
            'message': 'User verified successfully'
        })
        
    except Exception as e:
        context.log(f"Error in handle_verification: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)


def handle_profile(users, databases, method, payload, context):
    """Handle user profile operations"""
    try:
        database_id = os.environ.get('APPWRITE_DATABASE_ID', 'trading_post_db')
        
        if method == 'GET':
            user_id = context.req.query.get('user_id')
            if not user_id:
                return context.res.json({
                    'success': False,
                    'error': 'User ID is required'
                }, 400)
            
            # Get user profile
            profile = databases.get_document(
                database_id=database_id,
                collection_id='users',
                document_id=user_id
            )
            
            return context.res.json({
                'success': True,
                'data': profile
            })
            
        elif method == 'PUT':
            user_id = payload.get('user_id')
            if not user_id:
                return context.res.json({
                    'success': False,
                    'error': 'User ID is required'
                }, 400)
            
            # Update user profile
            profile = databases.update_document(
                database_id=database_id,
                collection_id='users',
                document_id=user_id,
                data=payload
            )
            
            return context.res.json({
                'success': True,
                'data': profile
            })
            
    except Exception as e:
        context.log(f"Error in handle_profile: {str(e)}")
        return context.res.json({
            'success': False,
            'error': str(e)
        }, 500)