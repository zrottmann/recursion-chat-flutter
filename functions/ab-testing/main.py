"""
A/B Testing Framework for AI Pricing Algorithms
Allows testing different pricing strategies and measuring their effectiveness
"""

import os
import json
import logging
import hashlib
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment configuration
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "trading_post_db")
AB_TESTS_COLLECTION_ID = "ab_tests"
AB_SESSIONS_COLLECTION_ID = "ab_sessions"
AB_RESULTS_COLLECTION_ID = "ab_results"

@dataclass
class ABTestConfig:
    test_id: str
    name: str
    description: str
    traffic_split: Dict[str, float]  # {"control": 0.5, "variant_a": 0.3, "variant_b": 0.2}
    algorithms: Dict[str, Dict]  # Algorithm configurations for each variant
    success_metrics: List[str]  # ["accuracy", "user_acceptance", "conversion_rate"]
    start_date: str
    end_date: str
    status: str  # "active", "paused", "completed"
    min_sample_size: int

@dataclass
class ABTestSession:
    session_id: str
    test_id: str
    user_id: str
    variant: str
    item_category: str
    timestamp: str
    pricing_data: Dict[str, Any]
    user_actions: List[Dict[str, Any]]

@dataclass
class ABTestResult:
    test_id: str
    variant: str
    metric: str
    value: float
    sample_size: int
    confidence_interval: tuple
    statistical_significance: bool

def get_user_variant(user_id: str, test_config: ABTestConfig) -> str:
    """
    Consistently assign users to test variants using hash-based assignment
    """
    # Create consistent hash for user
    hash_input = f"{test_config.test_id}:{user_id}"
    user_hash = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    
    # Convert to 0-1 range
    hash_ratio = (user_hash % 10000) / 10000.0
    
    # Assign to variant based on traffic split
    cumulative = 0.0
    for variant, split in test_config.traffic_split.items():
        cumulative += split
        if hash_ratio <= cumulative:
            return variant
    
    # Fallback to control
    return "control"

def apply_pricing_algorithm(variant: str, base_pricing_data: Dict, algorithm_configs: Dict) -> Dict:
    """
    Apply different pricing algorithms based on the test variant
    """
    if variant not in algorithm_configs:
        return base_pricing_data  # Return unchanged for unknown variants
    
    config = algorithm_configs[variant]
    algorithm_type = config.get("type", "base")
    
    if algorithm_type == "conservative":
        # Conservative pricing - reduce estimates by 5-10%
        reduction_factor = config.get("reduction_factor", 0.05)
        modified_data = base_pricing_data.copy()
        if "estimated_price" in modified_data:
            modified_data["estimated_price"] *= (1 - reduction_factor)
        if "price_range" in modified_data:
            modified_data["price_range"] = {
                "min": modified_data["price_range"]["min"] * (1 - reduction_factor),
                "max": modified_data["price_range"]["max"] * (1 - reduction_factor)
            }
        return modified_data
        
    elif algorithm_type == "aggressive":
        # Aggressive pricing - increase estimates by 5-10%
        boost_factor = config.get("boost_factor", 0.05)
        modified_data = base_pricing_data.copy()
        if "estimated_price" in modified_data:
            modified_data["estimated_price"] *= (1 + boost_factor)
        if "price_range" in modified_data:
            modified_data["price_range"] = {
                "min": modified_data["price_range"]["min"] * (1 + boost_factor),
                "max": modified_data["price_range"]["max"] * (1 + boost_factor)
            }
        return modified_data
        
    elif algorithm_type == "market_weighted":
        # Market weighted - emphasize recent market data
        market_weight = config.get("market_weight", 0.7)
        ai_weight = 1 - market_weight
        
        modified_data = base_pricing_data.copy()
        if "ai_estimated_price" in modified_data and "average_market_price" in modified_data:
            weighted_price = (
                modified_data["ai_estimated_price"] * ai_weight + 
                modified_data["average_market_price"] * market_weight
            )
            modified_data["estimated_price"] = weighted_price
            
        return modified_data
        
    elif algorithm_type == "confidence_adjusted":
        # Confidence adjusted - modify based on AI confidence
        confidence = base_pricing_data.get("confidence", 0.8)
        
        modified_data = base_pricing_data.copy()
        if confidence < 0.7:
            # Low confidence - be more conservative
            modified_data["estimated_price"] *= 0.95
        elif confidence > 0.9:
            # High confidence - be slightly more aggressive
            modified_data["estimated_price"] *= 1.03
            
        return modified_data
    
    return base_pricing_data  # Return unchanged for base algorithm

def create_ab_test(context):
    """Create a new A/B test configuration"""
    try:
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(os.environ.get('APPWRITE_API_KEY'))
        
        databases = Databases(client)
        
        # Parse request
        req = context.req
        if req.method != 'POST':
            return context.res.json({'error': 'Only POST method supported'}, 405)
        
        payload = json.loads(req.body) if req.body else {}
        
        # Validate required fields
        required_fields = ['name', 'description', 'traffic_split', 'algorithms', 'duration_days']
        for field in required_fields:
            if field not in payload:
                return context.res.json({'error': f'{field} is required'}, 400)
        
        # Generate test ID
        test_id = f"test_{int(datetime.utcnow().timestamp())}"
        
        # Calculate dates
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=int(payload['duration_days']))
        
        # Create test configuration
        test_config = {
            'test_id': test_id,
            'name': payload['name'],
            'description': payload['description'],
            'traffic_split': payload['traffic_split'],
            'algorithms': payload['algorithms'],
            'success_metrics': payload.get('success_metrics', ['accuracy', 'user_acceptance']),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'status': 'active',
            'min_sample_size': payload.get('min_sample_size', 100),
            'created_by': payload.get('user_id', 'system'),
            'created_at': start_date.isoformat()
        }
        
        # Validate traffic split sums to 1.0
        total_split = sum(test_config['traffic_split'].values())
        if not (0.99 <= total_split <= 1.01):  # Allow for small floating point errors
            return context.res.json({'error': 'Traffic split must sum to 1.0'}, 400)
        
        # Store test configuration
        test_doc = databases.create_document(
            DATABASE_ID,
            AB_TESTS_COLLECTION_ID,
            test_id,
            test_config
        )
        
        logger.info(f"Created A/B test: {test_id}")
        
        return context.res.json({
            'success': True,
            'test_id': test_id,
            'test_config': test_config
        })
        
    except Exception as e:
        logger.error(f"Error creating A/B test: {str(e)}")
        return context.res.json({'error': str(e)}, 500)

def get_pricing_with_ab_test(context):
    """Get pricing with A/B test variant applied"""
    try:
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(os.environ.get('APPWRITE_API_KEY'))
        
        databases = Databases(client)
        
        # Parse request
        req = context.req
        if req.method != 'POST':
            return context.res.json({'error': 'Only POST method supported'}, 405)
        
        payload = json.loads(req.body) if req.body else {}
        
        # Required fields
        user_id = payload.get('user_id')
        base_pricing_data = payload.get('pricing_data', {})
        
        if not user_id:
            return context.res.json({'error': 'user_id is required'}, 400)
        
        # Get active A/B tests
        active_tests_query = [
            Query.equal('status', 'active'),
            Query.less_than_equal('start_date', datetime.utcnow().isoformat()),
            Query.greater_than_equal('end_date', datetime.utcnow().isoformat())
        ]
        
        active_tests = databases.list_documents(
            DATABASE_ID,
            AB_TESTS_COLLECTION_ID,
            queries=active_tests_query
        )
        
        if not active_tests['documents']:
            # No active tests, return original pricing
            return context.res.json({
                'success': True,
                'pricing_data': base_pricing_data,
                'ab_test_applied': False
            })
        
        # For simplicity, use the first active test
        # In production, you might want more sophisticated test selection
        test_config_doc = active_tests['documents'][0]
        test_config = ABTestConfig(
            test_id=test_config_doc['test_id'],
            name=test_config_doc['name'],
            description=test_config_doc['description'],
            traffic_split=test_config_doc['traffic_split'],
            algorithms=test_config_doc['algorithms'],
            success_metrics=test_config_doc['success_metrics'],
            start_date=test_config_doc['start_date'],
            end_date=test_config_doc['end_date'],
            status=test_config_doc['status'],
            min_sample_size=test_config_doc['min_sample_size']
        )
        
        # Assign user to variant
        variant = get_user_variant(user_id, test_config)
        
        # Apply pricing algorithm for this variant
        modified_pricing_data = apply_pricing_algorithm(
            variant, 
            base_pricing_data, 
            test_config.algorithms
        )
        
        # Log test session
        session_data = {
            'session_id': f"{test_config.test_id}_{user_id}_{int(datetime.utcnow().timestamp())}",
            'test_id': test_config.test_id,
            'user_id': user_id,
            'variant': variant,
            'item_category': payload.get('category', 'unknown'),
            'timestamp': datetime.utcnow().isoformat(),
            'original_pricing': base_pricing_data,
            'modified_pricing': modified_pricing_data,
            'user_actions': []
        }
        
        databases.create_document(
            DATABASE_ID,
            AB_SESSIONS_COLLECTION_ID,
            'unique()',
            session_data
        )
        
        logger.info(f"Applied A/B test {test_config.test_id} variant {variant} for user {user_id}")
        
        return context.res.json({
            'success': True,
            'pricing_data': modified_pricing_data,
            'ab_test_applied': True,
            'test_id': test_config.test_id,
            'variant': variant,
            'session_id': session_data['session_id']
        })
        
    except Exception as e:
        logger.error(f"Error applying A/B test: {str(e)}")
        return context.res.json({'error': str(e)}, 500)

def record_user_action(context):
    """Record user action for A/B test analysis"""
    try:
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(os.environ.get('APPWRITE_API_KEY'))
        
        databases = Databases(client)
        
        # Parse request
        req = context.req
        if req.method != 'POST':
            return context.res.json({'error': 'Only POST method supported'}, 405)
        
        payload = json.loads(req.body) if req.body else {}
        
        session_id = payload.get('session_id')
        action_type = payload.get('action_type')  # 'accepted', 'rejected', 'modified', 'listed', 'sold'
        action_data = payload.get('action_data', {})
        
        if not session_id or not action_type:
            return context.res.json({'error': 'session_id and action_type are required'}, 400)
        
        # Find the session
        session_query = [Query.equal('session_id', session_id)]
        sessions = databases.list_documents(
            DATABASE_ID,
            AB_SESSIONS_COLLECTION_ID,
            queries=session_query
        )
        
        if not sessions['documents']:
            return context.res.json({'error': 'Session not found'}, 404)
        
        session_doc = sessions['documents'][0]
        
        # Add action to user actions
        action_record = {
            'action_type': action_type,
            'timestamp': datetime.utcnow().isoformat(),
            'data': action_data
        }
        
        current_actions = session_doc.get('user_actions', [])
        current_actions.append(action_record)
        
        # Update session
        databases.update_document(
            DATABASE_ID,
            AB_SESSIONS_COLLECTION_ID,
            session_doc['$id'],
            {'user_actions': current_actions}
        )
        
        logger.info(f"Recorded action {action_type} for session {session_id}")
        
        return context.res.json({
            'success': True,
            'message': 'Action recorded successfully'
        })
        
    except Exception as e:
        logger.error(f"Error recording user action: {str(e)}")
        return context.res.json({'error': str(e)}, 500)

def analyze_ab_test_results(context):
    """Analyze A/B test results and determine statistical significance"""
    try:
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(os.environ.get('APPWRITE_API_KEY'))
        
        databases = Databases(client)
        
        # Parse request
        req = context.req
        test_id = req.query.get('test_id')
        
        if not test_id:
            return context.res.json({'error': 'test_id parameter is required'}, 400)
        
        # Get test configuration
        test_doc = databases.get_document(DATABASE_ID, AB_TESTS_COLLECTION_ID, test_id)
        
        # Get all sessions for this test
        session_query = [Query.equal('test_id', test_id)]
        sessions = databases.list_documents(
            DATABASE_ID,
            AB_SESSIONS_COLLECTION_ID,
            queries=session_query,
            limit=10000
        )
        
        if not sessions['documents']:
            return context.res.json({
                'success': True,
                'message': 'No data available for analysis',
                'results': {}
            })
        
        # Analyze results by variant
        results = analyze_test_performance(sessions['documents'], test_doc)
        
        # Store results
        results_data = {
            'test_id': test_id,
            'analysis_date': datetime.utcnow().isoformat(),
            'total_sessions': len(sessions['documents']),
            'variant_results': results,
            'recommendations': generate_test_recommendations(results)
        }
        
        databases.create_document(
            DATABASE_ID,
            AB_RESULTS_COLLECTION_ID,
            'unique()',
            results_data
        )
        
        return context.res.json({
            'success': True,
            'results': results_data
        })
        
    except Exception as e:
        logger.error(f"Error analyzing A/B test results: {str(e)}")
        return context.res.json({'error': str(e)}, 500)

def analyze_test_performance(sessions: List[Dict], test_config: Dict) -> Dict:
    """Analyze performance metrics for each test variant"""
    variant_data = {}
    
    # Group sessions by variant
    for session in sessions:
        variant = session['variant']
        if variant not in variant_data:
            variant_data[variant] = {
                'sessions': [],
                'metrics': {}
            }
        variant_data[variant]['sessions'].append(session)
    
    # Calculate metrics for each variant
    for variant, data in variant_data.items():
        sessions_list = data['sessions']
        total_sessions = len(sessions_list)
        
        # Calculate acceptance rate
        accepted_count = sum(1 for session in sessions_list 
                           if any(action['action_type'] == 'accepted' 
                                 for action in session.get('user_actions', [])))
        acceptance_rate = accepted_count / total_sessions if total_sessions > 0 else 0
        
        # Calculate modification rate
        modified_count = sum(1 for session in sessions_list 
                           if any(action['action_type'] == 'modified' 
                                 for action in session.get('user_actions', [])))
        modification_rate = modified_count / total_sessions if total_sessions > 0 else 0
        
        # Calculate listing rate
        listed_count = sum(1 for session in sessions_list 
                         if any(action['action_type'] == 'listed' 
                               for action in session.get('user_actions', [])))
        listing_rate = listed_count / total_sessions if total_sessions > 0 else 0
        
        # Calculate average price difference (if users modified)
        price_differences = []
        for session in sessions_list:
            for action in session.get('user_actions', []):
                if action['action_type'] == 'modified' and 'new_price' in action.get('data', {}):
                    original_price = session.get('modified_pricing', {}).get('estimated_price', 0)
                    new_price = action['data']['new_price']
                    if original_price > 0:
                        diff_pct = ((new_price - original_price) / original_price) * 100
                        price_differences.append(diff_pct)
        
        avg_price_diff = sum(price_differences) / len(price_differences) if price_differences else 0
        
        variant_data[variant]['metrics'] = {
            'total_sessions': total_sessions,
            'acceptance_rate': acceptance_rate,
            'modification_rate': modification_rate,
            'listing_rate': listing_rate,
            'avg_price_modification_pct': avg_price_diff,
            'sample_sufficient': total_sessions >= test_config.get('min_sample_size', 100)
        }
    
    return variant_data

def generate_test_recommendations(results: Dict) -> List[str]:
    """Generate recommendations based on A/B test results"""
    recommendations = []
    
    if not results:
        return ["Insufficient data for recommendations"]
    
    # Find best performing variant by acceptance rate
    best_variant = None
    best_acceptance = 0
    
    for variant, data in results.items():
        metrics = data['metrics']
        if metrics['acceptance_rate'] > best_acceptance and metrics['sample_sufficient']:
            best_acceptance = metrics['acceptance_rate']
            best_variant = variant
    
    if best_variant:
        recommendations.append(f"Variant '{best_variant}' shows highest acceptance rate ({best_acceptance:.1%})")
        
        # Check if difference is significant (simplified)
        control_acceptance = results.get('control', {}).get('metrics', {}).get('acceptance_rate', 0)
        if best_acceptance > control_acceptance * 1.05:  # 5% improvement threshold
            recommendations.append(f"Consider adopting '{best_variant}' algorithm - shows {((best_acceptance/control_acceptance - 1) * 100):.1f}% improvement")
        else:
            recommendations.append("No significant improvement detected - continue testing")
    
    # Analyze modification patterns
    high_modification_variants = [
        variant for variant, data in results.items()
        if data['metrics']['modification_rate'] > 0.3  # >30% modification rate
    ]
    
    if high_modification_variants:
        recommendations.append(f"Variants {high_modification_variants} show high modification rates - consider algorithm adjustment")
    
    return recommendations

def main(context):
    """Main entry point for A/B Testing function"""
    try:
        req = context.req
        path = req.path
        
        if path.endswith('/create-test'):
            return create_ab_test(context)
        elif path.endswith('/get-pricing'):
            return get_pricing_with_ab_test(context)
        elif path.endswith('/record-action'):
            return record_user_action(context)
        elif path.endswith('/analyze-results'):
            return analyze_ab_test_results(context)
        else:
            return context.res.json({'error': 'Invalid endpoint'}, 404)
            
    except Exception as e:
        logger.error(f"A/B Testing function error: {str(e)}")
        return context.res.json({'error': str(e)}, 500)