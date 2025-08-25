"""
AI Learning and Feedback System for Trading Post
Collects user feedback and actual selling prices to improve pricing accuracy
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.query import Query
import numpy as np
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment configuration
DATABASE_ID = os.getenv("APPWRITE_DATABASE_ID", "trading_post_db")
FEEDBACK_COLLECTION_ID = "ai_feedback"
PRICING_ANALYTICS_COLLECTION_ID = "pricing_analytics"
ITEMS_COLLECTION_ID = "items"

@dataclass
class PricingAccuracy:
    predicted_price: float
    actual_price: float
    accuracy_percentage: float
    category: str
    condition: str
    item_features: List[str]
    confidence_score: float
    user_accepted: bool
    timestamp: str

@dataclass
class LearningMetrics:
    overall_accuracy: float
    category_accuracy: Dict[str, float]
    condition_accuracy: Dict[str, float]
    confidence_correlation: float
    improvement_trend: float
    total_samples: int

def calculate_pricing_accuracy(predicted: float, actual: float) -> float:
    """Calculate pricing accuracy as percentage"""
    if actual == 0:
        return 0.0
    
    difference = abs(predicted - actual)
    accuracy = max(0, 100 - (difference / actual * 100))
    return min(100, accuracy)

def collect_user_feedback(context):
    """Collect and store user feedback on AI pricing accuracy"""
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
        required_fields = ['item_id', 'ai_price', 'feedback_type']
        for field in required_fields:
            if field not in payload:
                return context.res.json({'error': f'{field} is required'}, 400)
        
        item_id = payload['item_id']
        ai_price = float(payload['ai_price'])
        feedback_type = payload['feedback_type']  # 'accepted', 'rejected', 'modified', 'sold'
        
        # Optional fields
        user_price = payload.get('user_price', ai_price)
        actual_sold_price = payload.get('sold_price')
        user_rating = payload.get('rating', 5)  # 1-5 stars
        confidence_score = payload.get('confidence', 0.8)
        
        # Get item details
        try:
            item = databases.get_document(DATABASE_ID, ITEMS_COLLECTION_ID, item_id)
            category = item.get('category', 'unknown')
            condition = item.get('condition', 'unknown')
            ai_features = item.get('ai_tags', [])
        except Exception as e:
            logger.error(f"Failed to get item details: {str(e)}")
            category = condition = 'unknown'
            ai_features = []
        
        # Create feedback record
        feedback_data = {
            'item_id': item_id,
            'ai_predicted_price': ai_price,
            'user_adjusted_price': float(user_price) if user_price else ai_price,
            'actual_sold_price': float(actual_sold_price) if actual_sold_price else None,
            'feedback_type': feedback_type,
            'user_rating': int(user_rating),
            'confidence_score': float(confidence_score),
            'category': category,
            'condition': condition,
            'ai_features': ai_features,
            'timestamp': datetime.utcnow().isoformat(),
            'accuracy_score': None  # Will be calculated later when item sells
        }
        
        # Calculate accuracy if we have actual sold price
        if actual_sold_price:
            accuracy = calculate_pricing_accuracy(ai_price, float(actual_sold_price))
            feedback_data['accuracy_score'] = accuracy
        
        # Store feedback
        feedback_doc = databases.create_document(
            DATABASE_ID,
            FEEDBACK_COLLECTION_ID,
            'unique()',
            feedback_data
        )
        
        logger.info(f"Feedback collected for item {item_id}: {feedback_type}")
        
        return context.res.json({
            'success': True,
            'feedback_id': feedback_doc['$id'],
            'message': 'Feedback recorded successfully'
        })
        
    except Exception as e:
        logger.error(f"Error collecting feedback: {str(e)}")
        return context.res.json({'error': str(e)}, 500)

def analyze_pricing_performance(context):
    """Analyze AI pricing performance and generate improvement insights"""
    try:
        client = Client()
        client.set_endpoint(os.environ.get('APPWRITE_FUNCTION_ENDPOINT', 'https://cloud.appwrite.io/v1'))
        client.set_project(os.environ.get('APPWRITE_FUNCTION_PROJECT_ID'))
        client.set_key(os.environ.get('APPWRITE_API_KEY'))
        
        databases = Databases(client)
        
        # Get recent feedback data
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        
        feedback_query = [
            Query.greater_than('timestamp', thirty_days_ago),
            Query.is_not_null('accuracy_score')
        ]
        
        feedback_data = databases.list_documents(
            DATABASE_ID,
            FEEDBACK_COLLECTION_ID,
            queries=feedback_query,
            limit=1000
        )
        
        if not feedback_data['documents']:
            return context.res.json({
                'success': True,
                'message': 'Insufficient data for analysis',
                'metrics': None
            })
        
        # Analyze performance
        metrics = calculate_learning_metrics(feedback_data['documents'])
        insights = generate_improvement_insights(feedback_data['documents'])
        
        # Store analytics
        analytics_data = {
            'analysis_date': datetime.utcnow().isoformat(),
            'period_days': 30,
            'sample_size': len(feedback_data['documents']),
            'overall_accuracy': metrics.overall_accuracy,
            'category_accuracy': metrics.category_accuracy,
            'condition_accuracy': metrics.condition_accuracy,
            'confidence_correlation': metrics.confidence_correlation,
            'improvement_trend': metrics.improvement_trend,
            'insights': insights,
            'recommendations': generate_recommendations(metrics, insights)
        }
        
        analytics_doc = databases.create_document(
            DATABASE_ID,
            PRICING_ANALYTICS_COLLECTION_ID,
            'unique()',
            analytics_data
        )
        
        return context.res.json({
            'success': True,
            'analytics_id': analytics_doc['$id'],
            'metrics': {
                'overall_accuracy': metrics.overall_accuracy,
                'total_samples': metrics.total_samples,
                'confidence_correlation': metrics.confidence_correlation,
                'improvement_trend': metrics.improvement_trend
            },
            'insights': insights[:5],  # Top 5 insights
            'recommendations': analytics_data['recommendations'][:3]  # Top 3 recommendations
        })
        
    except Exception as e:
        logger.error(f"Error analyzing performance: {str(e)}")
        return context.res.json({'error': str(e)}, 500)

def calculate_learning_metrics(feedback_documents: List[Dict]) -> LearningMetrics:
    """Calculate comprehensive learning metrics from feedback data"""
    if not feedback_documents:
        return LearningMetrics(0, {}, {}, 0, 0, 0)
    
    # Extract data
    accuracies = [doc['accuracy_score'] for doc in feedback_documents if doc.get('accuracy_score') is not None]
    categories = [doc['category'] for doc in feedback_documents]
    conditions = [doc['condition'] for doc in feedback_documents]
    confidences = [doc['confidence_score'] for doc in feedback_documents]
    timestamps = [datetime.fromisoformat(doc['timestamp'].replace('Z', '+00:00')) for doc in feedback_documents]
    
    # Overall accuracy
    overall_accuracy = np.mean(accuracies) if accuracies else 0
    
    # Category-wise accuracy
    category_accuracy = {}
    for category in set(categories):
        cat_accuracies = [doc['accuracy_score'] for doc in feedback_documents 
                         if doc['category'] == category and doc.get('accuracy_score') is not None]
        if cat_accuracies:
            category_accuracy[category] = np.mean(cat_accuracies)
    
    # Condition-wise accuracy
    condition_accuracy = {}
    for condition in set(conditions):
        cond_accuracies = [doc['accuracy_score'] for doc in feedback_documents 
                          if doc['condition'] == condition and doc.get('accuracy_score') is not None]
        if cond_accuracies:
            condition_accuracy[condition] = np.mean(cond_accuracies)
    
    # Confidence correlation
    if len(accuracies) == len(confidences) and len(accuracies) > 1:
        confidence_correlation = np.corrcoef(accuracies, confidences)[0, 1]
        if np.isnan(confidence_correlation):
            confidence_correlation = 0
    else:
        confidence_correlation = 0
    
    # Improvement trend (simple linear regression on accuracy over time)
    if len(accuracies) > 5:
        # Sort by timestamp
        sorted_data = sorted(zip(timestamps, accuracies))
        time_deltas = [(ts - sorted_data[0][0]).days for ts, _ in sorted_data]
        accuracies_sorted = [acc for _, acc in sorted_data]
        
        if len(set(time_deltas)) > 1:  # Need variation in time
            improvement_trend = np.corrcoef(time_deltas, accuracies_sorted)[0, 1]
            if np.isnan(improvement_trend):
                improvement_trend = 0
        else:
            improvement_trend = 0
    else:
        improvement_trend = 0
    
    return LearningMetrics(
        overall_accuracy=overall_accuracy,
        category_accuracy=category_accuracy,
        condition_accuracy=condition_accuracy,
        confidence_correlation=confidence_correlation,
        improvement_trend=improvement_trend,
        total_samples=len(feedback_documents)
    )

def generate_improvement_insights(feedback_documents: List[Dict]) -> List[str]:
    """Generate actionable insights for improving AI pricing"""
    insights = []
    
    # Analyze patterns in feedback
    rejected_items = [doc for doc in feedback_documents if doc['feedback_type'] == 'rejected']
    modified_items = [doc for doc in feedback_documents if doc['feedback_type'] == 'modified']
    
    # Category performance insights
    category_performance = {}
    for doc in feedback_documents:
        category = doc['category']
        if category not in category_performance:
            category_performance[category] = {'total': 0, 'accurate': 0}
        category_performance[category]['total'] += 1
        if doc.get('accuracy_score', 0) > 80:
            category_performance[category]['accurate'] += 1
    
    # Find problematic categories
    for category, stats in category_performance.items():
        if stats['total'] >= 5:  # Minimum sample size
            accuracy_rate = stats['accurate'] / stats['total']
            if accuracy_rate < 0.7:
                insights.append(f"AI pricing accuracy for {category} items is below 70% - needs improvement")
    
    # Confidence vs accuracy insights
    high_conf_low_acc = [doc for doc in feedback_documents 
                        if doc['confidence_score'] > 0.8 and doc.get('accuracy_score', 0) < 60]
    if len(high_conf_low_acc) > 5:
        insights.append("AI is overconfident in pricing - high confidence scores with low accuracy detected")
    
    # User modification patterns
    if len(modified_items) > 0:
        avg_modification = np.mean([
            abs(doc['user_adjusted_price'] - doc['ai_predicted_price']) / doc['ai_predicted_price'] * 100
            for doc in modified_items if doc['ai_predicted_price'] > 0
        ])
        if avg_modification > 20:
            insights.append(f"Users modify AI prices by average of {avg_modification:.1f}% - significant gap detected")
    
    # Seasonal patterns (if data spans multiple months)
    timestamps = [datetime.fromisoformat(doc['timestamp'].replace('Z', '+00:00')) for doc in feedback_documents]
    if len(set(ts.month for ts in timestamps)) > 1:
        insights.append("Seasonal pricing patterns detected - consider implementing seasonal adjustments")
    
    return insights

def generate_recommendations(metrics: LearningMetrics, insights: List[str]) -> List[str]:
    """Generate recommendations for improving AI pricing system"""
    recommendations = []
    
    # Overall accuracy recommendations
    if metrics.overall_accuracy < 70:
        recommendations.append("Overall pricing accuracy is below 70% - consider retraining the model with recent market data")
    elif metrics.overall_accuracy < 85:
        recommendations.append("Pricing accuracy is moderate - implement category-specific pricing adjustments")
    
    # Category-specific recommendations
    worst_categories = sorted(metrics.category_accuracy.items(), key=lambda x: x[1])[:2]
    for category, accuracy in worst_categories:
        if accuracy < 75:
            recommendations.append(f"Improve {category} pricing model - current accuracy: {accuracy:.1f}%")
    
    # Confidence correlation recommendations
    if metrics.confidence_correlation < 0.3:
        recommendations.append("Confidence scores don't correlate with accuracy - recalibrate confidence estimation")
    
    # Improvement trend recommendations
    if metrics.improvement_trend < -0.1:
        recommendations.append("Pricing accuracy is declining over time - urgent model retraining needed")
    elif metrics.improvement_trend < 0.1:
        recommendations.append("Implement continuous learning pipeline to maintain pricing accuracy")
    
    # Data collection recommendations
    if metrics.total_samples < 100:
        recommendations.append("Increase feedback collection - more data needed for reliable analysis")
    
    return recommendations

def main(context):
    """Main entry point for AI Learning function"""
    try:
        req = context.req
        path = req.path
        
        if path.endswith('/collect-feedback'):
            return collect_user_feedback(context)
        elif path.endswith('/analyze-performance'):
            return analyze_pricing_performance(context)
        else:
            return context.res.json({'error': 'Invalid endpoint'}, 404)
            
    except Exception as e:
        logger.error(f"AI Learning function error: {str(e)}")
        return context.res.json({'error': str(e)}, 500)