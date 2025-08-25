"""
Machine Learning System for AI Matching Enhancement
Learns from user interactions to improve matching accuracy over time
"""

import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os

# Database imports
from sqlalchemy.orm import Session
from ai_matching_schema import (
    MatchingSuggestion, 
    MatchingHistory, 
    MatchingPreference,
    MatchingAnalytics
)

logger = logging.getLogger(__name__)


@dataclass
class MLModelMetrics:
    """Metrics for ML model performance"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    training_samples: int
    feature_importance: Dict[str, float]


@dataclass
class UserBehaviorProfile:
    """Profile of user behavior patterns"""
    user_id: str
    acceptance_rate: float
    avg_accepted_score: float
    preferred_categories: List[str]
    preferred_distance_range: Tuple[float, float]
    preferred_value_range: Tuple[float, float]
    decline_reasons: Dict[str, int]
    interaction_patterns: Dict[str, Any]


class MatchingMLSystem:
    """
    Machine Learning system for improving AI matching accuracy
    """
    
    def __init__(self, model_storage_path: str = "models/"):
        self.model_storage_path = model_storage_path
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.feature_columns = []
        
        # Ensure model directory exists
        os.makedirs(model_storage_path, exist_ok=True)
        
        # Load existing models if available
        self.load_models()
    
    def extract_features_from_match(self, match: MatchingSuggestion, 
                                  user_context: Dict = None) -> Dict[str, float]:
        """
        Extract feature vector from a match suggestion
        """
        features = {
            # Basic match scores
            'overall_score': match.overall_score,
            'value_compatibility_score': match.value_compatibility_score,
            'geographic_score': match.geographic_score,
            'category_score': match.category_score,
            'preference_score': match.preference_score,
            'confidence_level': match.confidence_level,
            
            # Value features
            'item1_value': match.item1_estimated_value or 0,
            'item2_value': match.item2_estimated_value or 0,
            'value_ratio': self._safe_divide(
                match.item1_estimated_value or 0, 
                match.item2_estimated_value or 0
            ),
            'value_difference_pct': match.value_difference_percentage or 0,
            
            # Geographic features
            'distance_km': match.distance_km or 999,
            'is_same_city': 1.0 if (match.distance_km or 999) < 25 else 0.0,
            'is_local': 1.0 if (match.distance_km or 999) < 50 else 0.0,
            
            # Temporal features
            'match_age_hours': (datetime.utcnow() - match.created_at).total_seconds() / 3600,
            'hour_of_day': match.created_at.hour,
            'day_of_week': match.created_at.weekday(),
            
            # ML features if available
            'ml_feature_count': len(match.ml_features or {})
        }
        
        # Add ML features if available
        if match.ml_features:
            ml_features = match.ml_features
            for key, value in ml_features.items():
                if isinstance(value, (int, float)):
                    features[f'ml_{key}'] = value
        
        # Add user context features if available
        if user_context:
            features.update({
                'user_total_matches': user_context.get('total_matches', 0),
                'user_acceptance_rate': user_context.get('acceptance_rate', 0.5),
                'user_avg_accepted_score': user_context.get('avg_accepted_score', 0.5),
                'user_items_count': user_context.get('items_count', 0)
            })
        
        return features
    
    def prepare_training_data(self, db_session: Session, 
                            lookback_days: int = 90) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare training data from match history
        """
        try:
            # Query match history with outcomes
            cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
            
            history_records = db_session.query(MatchingHistory).join(
                MatchingSuggestion,
                MatchingHistory.match_suggestion_id == MatchingSuggestion.id
            ).filter(
                MatchingHistory.created_at >= cutoff_date,
                MatchingHistory.action.in_(['accepted', 'declined'])
            ).all()
            
            if len(history_records) < 50:
                logger.warning(f"Insufficient training data: {len(history_records)} records")
                return None, None
            
            # Extract features and labels
            features_list = []
            labels = []
            
            for history in history_records:
                try:
                    match = history.match_suggestion
                    if not match:
                        continue
                    
                    # Get user context
                    user_context = self._get_user_context(history.user_id, db_session)
                    
                    # Extract features
                    features = self.extract_features_from_match(match, user_context)
                    
                    # Add interaction-specific features
                    features.update({
                        'feedback_rating': history.feedback_rating or 3,
                        'has_feedback_text': 1.0 if history.feedback_text else 0.0,
                        'decline_reason_encoded': self._encode_decline_reason(
                            history.decline_reason
                        )
                    })
                    
                    features_list.append(features)
                    labels.append(1 if history.action == 'accepted' else 0)
                    
                except Exception as e:
                    logger.error(f"Error processing history record {history.id}: {e}")
                    continue
            
            if not features_list:
                logger.error("No valid features extracted from training data")
                return None, None
            
            # Convert to DataFrame
            features_df = pd.DataFrame(features_list)
            labels_series = pd.Series(labels)
            
            # Store feature columns for consistency
            self.feature_columns = features_df.columns.tolist()
            
            # Handle missing values
            features_df = features_df.fillna(0)
            
            logger.info(f"Prepared training data: {len(features_df)} samples, {len(features_df.columns)} features")
            
            return features_df, labels_series
            
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            return None, None
    
    def train_models(self, db_session: Session, lookback_days: int = 90) -> Dict[str, MLModelMetrics]:
        """
        Train ML models on historical interaction data
        """
        try:
            logger.info("Starting ML model training...")
            
            # Prepare training data
            features_df, labels = self.prepare_training_data(db_session, lookback_days)
            
            if features_df is None or labels is None:
                logger.error("Failed to prepare training data")
                return {}
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features_df, labels, test_size=0.2, random_state=42, stratify=labels
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Store scaler
            self.scalers['main'] = scaler
            
            # Train models
            models_to_train = {
                'random_forest': RandomForestClassifier(
                    n_estimators=100, 
                    max_depth=10, 
                    random_state=42,
                    class_weight='balanced'
                ),
                'gradient_boost': GradientBoostingClassifier(
                    n_estimators=100,
                    max_depth=6,
                    random_state=42
                )
            }
            
            model_metrics = {}
            
            for model_name, model in models_to_train.items():
                try:
                    # Train model
                    model.fit(X_train_scaled, y_train)
                    
                    # Predict on test set
                    y_pred = model.predict(X_test_scaled)
                    
                    # Calculate metrics
                    metrics = MLModelMetrics(
                        accuracy=accuracy_score(y_test, y_pred),
                        precision=precision_score(y_test, y_pred, zero_division=0),
                        recall=recall_score(y_test, y_pred, zero_division=0),
                        f1_score=f1_score(y_test, y_pred, zero_division=0),
                        training_samples=len(X_train),
                        feature_importance=dict(zip(
                            self.feature_columns,
                            getattr(model, 'feature_importances_', [0] * len(self.feature_columns))
                        ))
                    )
                    
                    # Store model
                    self.models[model_name] = model
                    model_metrics[model_name] = metrics
                    
                    logger.info(f"Trained {model_name}: Accuracy={metrics.accuracy:.3f}, "
                              f"F1={metrics.f1_score:.3f}")
                    
                except Exception as e:
                    logger.error(f"Error training {model_name}: {e}")
                    continue
            
            # Save models
            self.save_models()
            
            # Update analytics
            self._update_ml_analytics(db_session, model_metrics)
            
            return model_metrics
            
        except Exception as e:
            logger.error(f"Error in model training: {e}")
            return {}
    
    def predict_match_acceptance(self, match: MatchingSuggestion, 
                               user_context: Dict = None) -> Dict[str, float]:
        """
        Predict likelihood of match acceptance using trained models
        """
        try:
            if not self.models:
                logger.warning("No trained models available")
                return {'probability': 0.5, 'confidence': 0.0}
            
            # Extract features
            features = self.extract_features_from_match(match, user_context)
            
            # Ensure all required features are present
            feature_vector = []
            for col in self.feature_columns:
                feature_vector.append(features.get(col, 0))
            
            # Convert to numpy array and reshape
            X = np.array(feature_vector).reshape(1, -1)
            
            # Scale features
            if 'main' in self.scalers:
                X_scaled = self.scalers['main'].transform(X)
            else:
                X_scaled = X
            
            # Get predictions from all models
            predictions = {}
            probabilities = []
            
            for model_name, model in self.models.items():
                try:
                    # Get probability of acceptance (class 1)
                    if hasattr(model, 'predict_proba'):
                        prob = model.predict_proba(X_scaled)[0][1]
                    else:
                        # Fallback for models without probability prediction
                        prob = float(model.predict(X_scaled)[0])
                    
                    predictions[model_name] = prob
                    probabilities.append(prob)
                    
                except Exception as e:
                    logger.error(f"Error getting prediction from {model_name}: {e}")
                    continue
            
            if not probabilities:
                return {'probability': 0.5, 'confidence': 0.0}
            
            # Ensemble prediction (average)
            avg_probability = np.mean(probabilities)
            confidence = 1.0 - np.std(probabilities)  # Lower std = higher confidence
            
            return {
                'probability': avg_probability,
                'confidence': max(0.0, min(1.0, confidence)),
                'model_predictions': predictions
            }
            
        except Exception as e:
            logger.error(f"Error in match prediction: {e}")
            return {'probability': 0.5, 'confidence': 0.0}
    
    def update_user_behavior_profile(self, user_id: str, 
                                   db_session: Session) -> UserBehaviorProfile:
        """
        Update and return user behavior profile based on interaction history
        """
        try:
            # Query user's match history
            history = db_session.query(MatchingHistory).filter(
                MatchingHistory.user_id == user_id,
                MatchingHistory.created_at >= datetime.utcnow() - timedelta(days=180)
            ).all()
            
            if not history:
                return UserBehaviorProfile(
                    user_id=user_id,
                    acceptance_rate=0.5,
                    avg_accepted_score=0.5,
                    preferred_categories=[],
                    preferred_distance_range=(0, 50),
                    preferred_value_range=(0, 1000),
                    decline_reasons={},
                    interaction_patterns={}
                )
            
            # Calculate acceptance rate
            total_decisions = len([h for h in history if h.action in ['accepted', 'declined']])
            accepted_count = len([h for h in history if h.action == 'accepted'])
            acceptance_rate = accepted_count / total_decisions if total_decisions > 0 else 0.5
            
            # Calculate average accepted match score
            accepted_matches = [
                h for h in history 
                if h.action == 'accepted' and h.match_suggestion
            ]
            avg_accepted_score = np.mean([
                h.match_suggestion.overall_score 
                for h in accepted_matches
            ]) if accepted_matches else 0.5
            
            # Analyze decline reasons
            decline_reasons = {}
            for h in history:
                if h.action == 'declined' and h.decline_reason:
                    decline_reasons[h.decline_reason] = decline_reasons.get(h.decline_reason, 0) + 1
            
            # Analyze interaction patterns
            interaction_patterns = {
                'total_interactions': len(history),
                'avg_time_to_decision': self._calculate_avg_decision_time(history),
                'feedback_frequency': len([h for h in history if h.feedback_text]) / len(history) if history else 0
            }
            
            profile = UserBehaviorProfile(
                user_id=user_id,
                acceptance_rate=acceptance_rate,
                avg_accepted_score=avg_accepted_score,
                preferred_categories=self._extract_preferred_categories(accepted_matches),
                preferred_distance_range=self._extract_preferred_distance_range(accepted_matches),
                preferred_value_range=self._extract_preferred_value_range(accepted_matches),
                decline_reasons=decline_reasons,
                interaction_patterns=interaction_patterns
            )
            
            return profile
            
        except Exception as e:
            logger.error(f"Error updating user behavior profile: {e}")
            return UserBehaviorProfile(user_id=user_id, acceptance_rate=0.5, avg_accepted_score=0.5, 
                                     preferred_categories=[], preferred_distance_range=(0, 50),
                                     preferred_value_range=(0, 1000), decline_reasons={}, 
                                     interaction_patterns={})
    
    def get_personalized_match_adjustments(self, user_id: str, 
                                         db_session: Session) -> Dict[str, float]:
        """
        Get personalized adjustments for match scoring based on user profile
        """
        try:
            profile = self.update_user_behavior_profile(user_id, db_session)
            
            adjustments = {
                'score_threshold': 0.5,  # Default threshold
                'distance_weight': 1.0,
                'value_weight': 1.0,
                'category_weight': 1.0,
                'confidence_boost': 0.0
            }
            
            # Adjust based on user acceptance patterns
            if profile.acceptance_rate > 0.8:
                # User accepts most matches - can be more lenient
                adjustments['score_threshold'] = 0.4
                adjustments['confidence_boost'] = 0.1
            elif profile.acceptance_rate < 0.3:
                # User is picky - be more strict
                adjustments['score_threshold'] = 0.6
                adjustments['confidence_boost'] = -0.1
            
            # Adjust weights based on decline reasons
            if profile.decline_reasons.get('location', 0) > profile.decline_reasons.get('value', 0):
                adjustments['distance_weight'] = 1.2
            elif profile.decline_reasons.get('value', 0) > profile.decline_reasons.get('location', 0):
                adjustments['value_weight'] = 1.2
            
            return adjustments
            
        except Exception as e:
            logger.error(f"Error getting personalized adjustments: {e}")
            return {'score_threshold': 0.5, 'distance_weight': 1.0, 
                   'value_weight': 1.0, 'category_weight': 1.0, 'confidence_boost': 0.0}
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            for model_name, model in self.models.items():
                model_path = os.path.join(self.model_storage_path, f"{model_name}.pkl")
                joblib.dump(model, model_path)
            
            # Save scalers and encoders
            if self.scalers:
                scalers_path = os.path.join(self.model_storage_path, "scalers.pkl")
                joblib.dump(self.scalers, scalers_path)
            
            # Save feature columns
            if self.feature_columns:
                features_path = os.path.join(self.model_storage_path, "feature_columns.json")
                with open(features_path, 'w') as f:
                    json.dump(self.feature_columns, f)
            
            logger.info(f"Saved {len(self.models)} models to {self.model_storage_path}")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            # Load feature columns
            features_path = os.path.join(self.model_storage_path, "feature_columns.json")
            if os.path.exists(features_path):
                with open(features_path, 'r') as f:
                    self.feature_columns = json.load(f)
            
            # Load scalers
            scalers_path = os.path.join(self.model_storage_path, "scalers.pkl")
            if os.path.exists(scalers_path):
                self.scalers = joblib.load(scalers_path)
            
            # Load models
            model_files = ['random_forest.pkl', 'gradient_boost.pkl']
            for model_file in model_files:
                model_path = os.path.join(self.model_storage_path, model_file)
                if os.path.exists(model_path):
                    model_name = model_file.replace('.pkl', '')
                    self.models[model_name] = joblib.load(model_path)
            
            logger.info(f"Loaded {len(self.models)} models from {self.model_storage_path}")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    # Helper methods
    def _safe_divide(self, a: float, b: float) -> float:
        """Safe division with fallback"""
        if b == 0:
            return 1.0 if a == 0 else 10.0
        return a / b
    
    def _encode_decline_reason(self, reason: Optional[str]) -> float:
        """Encode decline reason as numeric value"""
        reason_encoding = {
            'location': 1.0,
            'value': 2.0,
            'category': 3.0,
            'quality': 4.0,
            'other': 5.0
        }
        return reason_encoding.get(reason, 0.0)
    
    def _get_user_context(self, user_id: str, db_session: Session) -> Dict[str, Any]:
        """Get user context for feature extraction"""
        try:
            # This would integrate with Appwrite to get user data
            # For now, return basic context
            return {
                'total_matches': 10,
                'acceptance_rate': 0.5,
                'avg_accepted_score': 0.6,
                'items_count': 5
            }
        except Exception:
            return {}
    
    def _update_ml_analytics(self, db_session: Session, metrics: Dict[str, MLModelMetrics]):
        """Update ML analytics in database"""
        try:
            for model_name, metric in metrics.items():
                analytics = MatchingAnalytics(
                    period_start=datetime.utcnow(),
                    period_end=datetime.utcnow(),
                    period_type='model_training',
                    ai_accuracy=metric.accuracy,
                    calculated_at=datetime.utcnow()
                )
                db_session.add(analytics)
            
            db_session.commit()
            
        except Exception as e:
            logger.error(f"Error updating ML analytics: {e}")
    
    def _calculate_avg_decision_time(self, history: List[MatchingHistory]) -> float:
        """Calculate average time to decision"""
        # Simplified - would need match suggestion timestamps
        return 3600.0  # Default 1 hour
    
    def _extract_preferred_categories(self, accepted_matches: List[MatchingHistory]) -> List[str]:
        """Extract preferred categories from accepted matches"""
        # Simplified implementation
        return ['electronics', 'books']
    
    def _extract_preferred_distance_range(self, accepted_matches: List[MatchingHistory]) -> Tuple[float, float]:
        """Extract preferred distance range"""
        distances = []
        for match in accepted_matches:
            if match.match_suggestion and match.match_suggestion.distance_km:
                distances.append(match.match_suggestion.distance_km)
        
        if distances:
            return (min(distances), max(distances))
        return (0.0, 50.0)
    
    def _extract_preferred_value_range(self, accepted_matches: List[MatchingHistory]) -> Tuple[float, float]:
        """Extract preferred value range"""
        values = []
        for match in accepted_matches:
            if match.match_suggestion:
                if match.match_suggestion.item1_estimated_value:
                    values.append(match.match_suggestion.item1_estimated_value)
                if match.match_suggestion.item2_estimated_value:
                    values.append(match.match_suggestion.item2_estimated_value)
        
        if values:
            return (min(values), max(values))
        return (0.0, 1000.0)


# Export main class
__all__ = ['MatchingMLSystem', 'MLModelMetrics', 'UserBehaviorProfile']