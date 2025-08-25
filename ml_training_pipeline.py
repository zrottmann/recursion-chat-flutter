#!/usr/bin/env python3
"""
Machine Learning Training Pipeline for Trading Post
Continuously improves AI models based on user feedback and trade outcomes
"""

import asyncio
import json
import logging
import math
import os
import pickle
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelType(Enum):
    """Types of ML models"""
    PRICE_ESTIMATION = "price_estimation"
    WEAR_DETECTION = "wear_detection"
    MATCH_QUALITY = "match_quality"
    VALUE_ADJUSTMENT = "value_adjustment"
    CONDITION_ASSESSMENT = "condition_assessment"


class TrainingDataQuality(Enum):
    """Quality levels for training data"""
    HIGH = "high"           # User confirmed, successful trade
    MEDIUM = "medium"       # User interaction, positive feedback
    LOW = "low"            # System generated, no feedback
    NEGATIVE = "negative"   # User disagreed, failed trade


@dataclass
class TrainingExample:
    """Single training example for ML models"""
    example_id: str
    model_type: ModelType
    
    # Input features
    features: Dict[str, Any]
    
    # Target/ground truth
    target_value: Union[float, int, str]
    
    # Quality and metadata
    quality: TrainingDataQuality
    confidence_score: float
    source: str  # 'user_feedback', 'trade_outcome', 'expert_validation'
    
    # Timestamps
    created_at: datetime
    validated_at: Optional[datetime] = None
    
    # Performance tracking
    prediction_accuracy: Optional[float] = None
    model_version: Optional[str] = None


@dataclass
class ModelPerformance:
    """Model performance metrics"""
    model_id: str
    model_type: ModelType
    version: str
    
    # Accuracy metrics
    mae: float              # Mean Absolute Error
    rmse: float             # Root Mean Square Error
    r2_score: float         # R-squared
    
    # Business metrics
    user_satisfaction: float
    trade_success_rate: float
    feedback_score: float
    
    # Training info
    training_size: int
    validation_size: int
    training_time: float
    
    # Deployment info
    deployed_at: datetime
    performance_period: str  # 'daily', 'weekly', 'monthly'


@dataclass
class ModelConfiguration:
    """ML model configuration"""
    model_type: ModelType
    algorithm: str          # 'random_forest', 'gradient_boost', 'neural_network'
    hyperparameters: Dict[str, Any]
    feature_columns: List[str]
    target_column: str
    preprocessing_steps: List[str]
    
    # Training settings
    min_training_samples: int
    retrain_frequency_hours: int
    validation_split: float
    
    # Performance thresholds
    min_accuracy_threshold: float
    min_improvement_threshold: float


class MLTrainingPipeline:
    """
    Machine Learning training pipeline for continuous model improvement
    """
    
    def __init__(self):
        self.db_path = "trading_post.db"
        self.models_dir = Path("ml_models")
        self.models_dir.mkdir(exist_ok=True)
        
        # Initialize database
        self._initialize_database()
        
        # Model configurations
        self.model_configs = self._initialize_model_configs()
        
        # Currently loaded models
        self.loaded_models = {}
        self.model_scalers = {}
        self.label_encoders = {}
        
        # Training settings
        self.auto_retrain_enabled = True
        self.retrain_queue = asyncio.Queue()
        
        logger.info("ML Training Pipeline initialized")
    
    def _initialize_database(self):
        """Initialize training pipeline database tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Training examples table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS training_examples (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    example_id TEXT UNIQUE NOT NULL,
                    model_type TEXT NOT NULL,
                    features TEXT NOT NULL,
                    target_value TEXT NOT NULL,
                    quality TEXT NOT NULL,
                    confidence_score REAL NOT NULL,
                    source TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    validated_at TIMESTAMP,
                    prediction_accuracy REAL,
                    model_version TEXT
                )
            """)
            
            # Model performance table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS model_performance (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    model_type TEXT NOT NULL,
                    version TEXT NOT NULL,
                    mae REAL NOT NULL,
                    rmse REAL NOT NULL,
                    r2_score REAL NOT NULL,
                    user_satisfaction REAL DEFAULT 0.0,
                    trade_success_rate REAL DEFAULT 0.0,
                    feedback_score REAL DEFAULT 0.0,
                    training_size INTEGER NOT NULL,
                    validation_size INTEGER NOT NULL,
                    training_time REAL NOT NULL,
                    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    performance_period TEXT DEFAULT 'daily'
                )
            """)
            
            # Model versions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS model_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_type TEXT NOT NULL,
                    version TEXT NOT NULL,
                    algorithm TEXT NOT NULL,
                    hyperparameters TEXT NOT NULL,
                    feature_columns TEXT NOT NULL,
                    model_path TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    performance_score REAL DEFAULT 0.0
                )
            """)
            
            # User feedback table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    user_id INTEGER NOT NULL,
                    feedback_type TEXT NOT NULL,
                    rating INTEGER NOT NULL,
                    comments TEXT,
                    ai_prediction REAL,
                    user_correction REAL,
                    trade_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Training jobs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS training_jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT UNIQUE NOT NULL,
                    model_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    training_samples INTEGER,
                    improvement_score REAL,
                    error_message TEXT
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("ML training database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    def _initialize_model_configs(self) -> Dict[ModelType, ModelConfiguration]:
        """Initialize model configurations"""
        configs = {}
        
        # Price estimation model
        configs[ModelType.PRICE_ESTIMATION] = ModelConfiguration(
            model_type=ModelType.PRICE_ESTIMATION,
            algorithm="gradient_boost",
            hyperparameters={
                'n_estimators': 200,
                'max_depth': 8,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'random_state': 42
            },
            feature_columns=[
                'item_category', 'brand', 'age_months', 'condition_score',
                'wear_indicators_count', 'market_avg_price', 'market_volatility',
                'seasonal_factor', 'demand_score', 'rarity_score'
            ],
            target_column='actual_price',
            preprocessing_steps=['standardize', 'encode_categorical'],
            min_training_samples=100,
            retrain_frequency_hours=24,
            validation_split=0.2,
            min_accuracy_threshold=0.8,
            min_improvement_threshold=0.05
        )
        
        # Wear detection model
        configs[ModelType.WEAR_DETECTION] = ModelConfiguration(
            model_type=ModelType.WEAR_DETECTION,
            algorithm="random_forest",
            hyperparameters={
                'n_estimators': 150,
                'max_depth': 10,
                'min_samples_split': 5,
                'min_samples_leaf': 2,
                'random_state': 42
            },
            feature_columns=[
                'image_sharpness', 'color_variance', 'edge_density',
                'texture_roughness', 'brightness_std', 'contrast_ratio',
                'scratch_density', 'discoloration_area', 'surface_defects'
            ],
            target_column='wear_severity',
            preprocessing_steps=['standardize'],
            min_training_samples=50,
            retrain_frequency_hours=48,
            validation_split=0.25,
            min_accuracy_threshold=0.75,
            min_improvement_threshold=0.03
        )
        
        # Match quality model
        configs[ModelType.MATCH_QUALITY] = ModelConfiguration(
            model_type=ModelType.MATCH_QUALITY,
            algorithm="neural_network",
            hyperparameters={
                'hidden_layer_sizes': (100, 50, 25),
                'activation': 'relu',
                'solver': 'adam',
                'alpha': 0.001,
                'learning_rate': 'adaptive',
                'max_iter': 1000,
                'random_state': 42
            },
            feature_columns=[
                'value_difference_percent', 'category_similarity',
                'condition_compatibility', 'user_preference_alignment',
                'geographic_distance', 'user_rating_similarity',
                'trade_history_compatibility', 'timing_factor'
            ],
            target_column='match_quality_score',
            preprocessing_steps=['standardize', 'feature_selection'],
            min_training_samples=75,
            retrain_frequency_hours=12,
            validation_split=0.2,
            min_accuracy_threshold=0.85,
            min_improvement_threshold=0.02
        )
        
        return configs
    
    async def add_training_example(self, example: TrainingExample):
        """Add new training example to the dataset"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO training_examples 
                (example_id, model_type, features, target_value, quality, 
                 confidence_score, source, validated_at, prediction_accuracy, model_version)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                example.example_id,
                example.model_type.value,
                json.dumps(example.features),
                str(example.target_value),
                example.quality.value,
                example.confidence_score,
                example.source,
                example.validated_at.isoformat() if example.validated_at else None,
                example.prediction_accuracy,
                example.model_version
            ))
            
            conn.commit()
            conn.close()
            
            # Check if model needs retraining
            if self.auto_retrain_enabled:
                await self._check_retrain_trigger(example.model_type)
            
            logger.info(f"Added training example {example.example_id} for {example.model_type.value}")
            
        except Exception as e:
            logger.error(f"Error adding training example: {e}")
    
    async def collect_user_feedback(self, session_id: str, user_id: int,
                                  feedback_type: str, rating: int,
                                  ai_prediction: float, user_correction: Optional[float] = None,
                                  comments: Optional[str] = None,
                                  trade_completed: bool = False):
        """Collect user feedback for model improvement"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO user_feedback 
                (session_id, user_id, feedback_type, rating, comments,
                 ai_prediction, user_correction, trade_completed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id, user_id, feedback_type, rating, comments,
                ai_prediction, user_correction, trade_completed
            ))
            
            conn.commit()
            conn.close()
            
            # Convert feedback to training examples
            await self._process_feedback_to_training_data(
                session_id, feedback_type, rating, ai_prediction, user_correction, trade_completed
            )
            
            logger.info(f"Collected user feedback for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error collecting user feedback: {e}")
    
    async def _process_feedback_to_training_data(self, session_id: str, feedback_type: str,
                                               rating: int, ai_prediction: float,
                                               user_correction: Optional[float],
                                               trade_completed: bool):
        """Convert user feedback into training examples"""
        try:
            # Determine quality based on feedback
            if trade_completed and rating >= 4:
                quality = TrainingDataQuality.HIGH
            elif rating >= 3:
                quality = TrainingDataQuality.MEDIUM
            elif rating <= 2:
                quality = TrainingDataQuality.NEGATIVE
            else:
                quality = TrainingDataQuality.LOW
            
            # Create training example for price estimation if user provided correction
            if user_correction is not None and feedback_type == "price_estimate":
                # TODO: Retrieve original features from session
                features = await self._get_session_features(session_id)
                
                if features:
                    example = TrainingExample(
                        example_id=f"feedback_{session_id}_{int(time.time())}",
                        model_type=ModelType.PRICE_ESTIMATION,
                        features=features,
                        target_value=user_correction,
                        quality=quality,
                        confidence_score=0.9 if trade_completed else 0.7,
                        source="user_feedback",
                        created_at=datetime.utcnow(),
                        validated_at=datetime.utcnow(),
                        prediction_accuracy=1.0 - abs(ai_prediction - user_correction) / max(ai_prediction, user_correction)
                    )
                    
                    await self.add_training_example(example)
            
            # Create training example for match quality if trade completed
            if trade_completed and feedback_type == "trade_match":
                # TODO: Retrieve match features from session
                match_features = await self._get_match_features(session_id)
                
                if match_features:
                    # Rating maps to match quality score
                    quality_score = rating / 5.0  # Convert 1-5 rating to 0-1 score
                    
                    example = TrainingExample(
                        example_id=f"match_feedback_{session_id}_{int(time.time())}",
                        model_type=ModelType.MATCH_QUALITY,
                        features=match_features,
                        target_value=quality_score,
                        quality=TrainingDataQuality.HIGH,
                        confidence_score=0.95,
                        source="trade_outcome",
                        created_at=datetime.utcnow(),
                        validated_at=datetime.utcnow()
                    )
                    
                    await self.add_training_example(example)
            
        except Exception as e:
            logger.error(f"Error processing feedback to training data: {e}")
    
    async def _get_session_features(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve original features from analysis session"""
        try:
            # TODO: Implement session feature retrieval
            # This would query the photo_analysis_sessions table or similar
            # to get the original item features used for prediction
            return {}
        except Exception as e:
            logger.error(f"Error retrieving session features: {e}")
            return None
    
    async def _get_match_features(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve match features from trading session"""
        try:
            # TODO: Implement match feature retrieval
            # This would get features used in the matching algorithm
            return {}
        except Exception as e:
            logger.error(f"Error retrieving match features: {e}")
            return None
    
    async def _check_retrain_trigger(self, model_type: ModelType):
        """Check if model needs retraining based on new data"""
        try:
            config = self.model_configs[model_type]
            
            # Check time since last training
            last_train_time = await self._get_last_training_time(model_type)
            hours_since_training = (datetime.utcnow() - last_train_time).total_seconds() / 3600
            
            # Check number of new examples
            new_examples_count = await self._count_new_training_examples(model_type)
            
            # Check performance degradation
            performance_degradation = await self._check_performance_degradation(model_type)
            
            should_retrain = (
                hours_since_training >= config.retrain_frequency_hours or
                new_examples_count >= config.min_training_samples * 0.2 or
                performance_degradation > 0.1
            )
            
            if should_retrain:
                await self.retrain_queue.put(model_type)
                logger.info(f"Queued {model_type.value} for retraining")
            
        except Exception as e:
            logger.error(f"Error checking retrain trigger: {e}")
    
    async def _get_last_training_time(self, model_type: ModelType) -> datetime:
        """Get the last training time for a model"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT MAX(completed_at) FROM training_jobs 
                WHERE model_type = ? AND status = 'completed'
            """, (model_type.value,))
            
            result = cursor.fetchone()[0]
            conn.close()
            
            if result:
                return datetime.fromisoformat(result)
            else:
                return datetime.utcnow() - timedelta(days=30)  # Default to 30 days ago
                
        except Exception as e:
            logger.error(f"Error getting last training time: {e}")
            return datetime.utcnow() - timedelta(days=30)
    
    async def _count_new_training_examples(self, model_type: ModelType) -> int:
        """Count new training examples since last training"""
        try:
            last_train_time = await self._get_last_training_time(model_type)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) FROM training_examples 
                WHERE model_type = ? AND created_at > ?
            """, (model_type.value, last_train_time.isoformat()))
            
            count = cursor.fetchone()[0]
            conn.close()
            
            return count
            
        except Exception as e:
            logger.error(f"Error counting new training examples: {e}")
            return 0
    
    async def _check_performance_degradation(self, model_type: ModelType) -> float:
        """Check if model performance has degraded"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get recent performance metrics
            cursor.execute("""
                SELECT r2_score, user_satisfaction, feedback_score 
                FROM model_performance 
                WHERE model_type = ? 
                ORDER BY deployed_at DESC 
                LIMIT 2
            """, (model_type.value,))
            
            results = cursor.fetchall()
            conn.close()
            
            if len(results) >= 2:
                current_score = (results[0][0] + results[0][1] + results[0][2]) / 3
                previous_score = (results[1][0] + results[1][1] + results[1][2]) / 3
                degradation = previous_score - current_score
                return max(0, degradation)
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error checking performance degradation: {e}")
            return 0.0
    
    async def train_model(self, model_type: ModelType, force_retrain: bool = False) -> bool:
        """Train or retrain a specific model"""
        try:
            job_id = f"{model_type.value}_train_{int(time.time())}"
            
            # Record training job start
            await self._record_training_job_start(job_id, model_type)
            
            logger.info(f"Starting training for {model_type.value} model (job: {job_id})")
            
            # Load training data
            training_data = await self._load_training_data(model_type)
            
            if len(training_data) < self.model_configs[model_type].min_training_samples:
                error_msg = f"Insufficient training data: {len(training_data)} samples"
                await self._record_training_job_error(job_id, error_msg)
                return False
            
            # Prepare features and targets
            X, y, feature_names = await self._prepare_training_features(training_data, model_type)
            
            # Split data
            config = self.model_configs[model_type]
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=config.validation_split, random_state=42
            )
            
            # Train model
            start_time = time.time()
            model, scaler, encoder = await self._train_model_algorithm(
                X_train, y_train, model_type, config
            )
            training_time = time.time() - start_time
            
            # Evaluate model
            performance = await self._evaluate_model(
                model, scaler, X_test, y_test, model_type, len(X_train), len(X_test), training_time
            )
            
            # Save model if performance is good
            if performance.r2_score >= config.min_accuracy_threshold:
                model_path = await self._save_model(model, scaler, encoder, model_type, performance)
                await self._record_model_version(model_type, config, model_path, performance)
                await self._record_training_job_success(job_id, len(training_data), performance.r2_score)
                
                logger.info(f"Successfully trained {model_type.value} model with R² = {performance.r2_score:.3f}")
                return True
            else:
                error_msg = f"Model performance below threshold: {performance.r2_score:.3f} < {config.min_accuracy_threshold}"
                await self._record_training_job_error(job_id, error_msg)
                return False
            
        except Exception as e:
            logger.error(f"Error training {model_type.value} model: {e}")
            await self._record_training_job_error(job_id, str(e))
            return False
    
    async def _load_training_data(self, model_type: ModelType) -> List[Dict[str, Any]]:
        """Load training data for a model type"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Load high and medium quality examples, exclude negative feedback
            cursor.execute("""
                SELECT features, target_value, quality, confidence_score
                FROM training_examples 
                WHERE model_type = ? AND quality IN ('high', 'medium')
                ORDER BY created_at DESC
            """, (model_type.value,))
            
            rows = cursor.fetchall()
            conn.close()
            
            training_data = []
            for row in rows:
                try:
                    features = json.loads(row[0])
                    features['target'] = float(row[1]) if row[1].replace('.', '').isdigit() else row[1]
                    features['quality'] = row[2]
                    features['confidence'] = row[3]
                    training_data.append(features)
                except (ValueError, json.JSONDecodeError) as e:
                    logger.warning(f"Skipping invalid training example: {e}")
                    continue
            
            return training_data
            
        except Exception as e:
            logger.error(f"Error loading training data: {e}")
            return []
    
    async def _prepare_training_features(self, training_data: List[Dict[str, Any]], 
                                       model_type: ModelType) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Prepare features and targets for training"""
        try:
            config = self.model_configs[model_type]
            
            # Extract features and targets
            features_list = []
            targets_list = []
            
            for example in training_data:
                try:
                    feature_vector = []
                    
                    # Extract configured features
                    for feature_name in config.feature_columns:
                        if feature_name in example:
                            value = example[feature_name]
                            
                            # Handle categorical features
                            if isinstance(value, str):
                                # Simple encoding for categorical features
                                feature_vector.append(hash(value) % 1000 / 1000.0)
                            else:
                                feature_vector.append(float(value))
                        else:
                            feature_vector.append(0.0)  # Default value for missing features
                    
                    features_list.append(feature_vector)
                    targets_list.append(example['target'])
                    
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping invalid example: {e}")
                    continue
            
            X = np.array(features_list)
            y = np.array(targets_list)
            
            return X, y, config.feature_columns
            
        except Exception as e:
            logger.error(f"Error preparing training features: {e}")
            return np.array([]), np.array([]), []
    
    async def _train_model_algorithm(self, X_train: np.ndarray, y_train: np.ndarray,
                                   model_type: ModelType, config: ModelConfiguration):
        """Train the actual ML algorithm"""
        try:
            # Prepare preprocessing
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            
            # Initialize model based on algorithm
            if config.algorithm == "random_forest":
                model = RandomForestRegressor(**config.hyperparameters)
            elif config.algorithm == "gradient_boost":
                model = GradientBoostingRegressor(**config.hyperparameters)
            elif config.algorithm == "neural_network":
                model = MLPRegressor(**config.hyperparameters)
            elif config.algorithm == "linear":
                model = Ridge(**config.hyperparameters)
            else:
                model = RandomForestRegressor(random_state=42)  # Default fallback
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            return model, scaler, None  # No label encoder for now
            
        except Exception as e:
            logger.error(f"Error training model algorithm: {e}")
            raise
    
    async def _evaluate_model(self, model, scaler, X_test: np.ndarray, y_test: np.ndarray,
                            model_type: ModelType, training_size: int, validation_size: int,
                            training_time: float) -> ModelPerformance:
        """Evaluate trained model performance"""
        try:
            # Scale test data
            X_test_scaled = scaler.transform(X_test)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            mae = mean_absolute_error(y_test, y_pred)
            rmse = math.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            # Create performance record
            performance = ModelPerformance(
                model_id=f"{model_type.value}_{int(time.time())}",
                model_type=model_type,
                version=f"v{datetime.utcnow().strftime('%Y%m%d_%H%M')}",
                mae=mae,
                rmse=rmse,
                r2_score=r2,
                user_satisfaction=0.0,  # Will be updated from feedback
                trade_success_rate=0.0,  # Will be updated from outcomes
                feedback_score=0.0,  # Will be updated from ratings
                training_size=training_size,
                validation_size=validation_size,
                training_time=training_time,
                deployed_at=datetime.utcnow(),
                performance_period='daily'
            )
            
            return performance
            
        except Exception as e:
            logger.error(f"Error evaluating model: {e}")
            raise
    
    async def _save_model(self, model, scaler, encoder, model_type: ModelType, 
                         performance: ModelPerformance) -> str:
        """Save trained model to disk"""
        try:
            model_dir = self.models_dir / model_type.value
            model_dir.mkdir(exist_ok=True)
            
            model_path = model_dir / f"{performance.version}.joblib"
            scaler_path = model_dir / f"{performance.version}_scaler.joblib"
            
            # Save model and preprocessors
            joblib.dump(model, model_path)
            joblib.dump(scaler, scaler_path)
            
            if encoder:
                encoder_path = model_dir / f"{performance.version}_encoder.joblib"
                joblib.dump(encoder, encoder_path)
            
            logger.info(f"Saved {model_type.value} model to {model_path}")
            return str(model_path)
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            raise
    
    async def load_model(self, model_type: ModelType, version: Optional[str] = None):
        """Load a trained model"""
        try:
            if version is None:
                # Load latest active model
                version = await self._get_active_model_version(model_type)
            
            model_dir = self.models_dir / model_type.value
            model_path = model_dir / f"{version}.joblib"
            scaler_path = model_dir / f"{version}_scaler.joblib"
            
            if model_path.exists():
                model = joblib.load(model_path)
                scaler = joblib.load(scaler_path) if scaler_path.exists() else None
                
                self.loaded_models[model_type] = model
                self.model_scalers[model_type] = scaler
                
                logger.info(f"Loaded {model_type.value} model version {version}")
                return True
            else:
                logger.warning(f"Model file not found: {model_path}")
                return False
                
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    async def predict(self, model_type: ModelType, features: Dict[str, Any]) -> Optional[float]:
        """Make prediction using loaded model"""
        try:
            if model_type not in self.loaded_models:
                await self.load_model(model_type)
            
            if model_type not in self.loaded_models:
                logger.error(f"No model available for {model_type.value}")
                return None
            
            model = self.loaded_models[model_type]
            scaler = self.model_scalers.get(model_type)
            config = self.model_configs[model_type]
            
            # Prepare feature vector
            feature_vector = []
            for feature_name in config.feature_columns:
                if feature_name in features:
                    value = features[feature_name]
                    if isinstance(value, str):
                        feature_vector.append(hash(value) % 1000 / 1000.0)
                    else:
                        feature_vector.append(float(value))
                else:
                    feature_vector.append(0.0)
            
            # Scale features if scaler available
            X = np.array([feature_vector])
            if scaler:
                X = scaler.transform(X)
            
            # Make prediction
            prediction = model.predict(X)[0]
            return float(prediction)
            
        except Exception as e:
            logger.error(f"Error making prediction: {e}")
            return None
    
    async def start_continuous_training(self):
        """Start continuous training worker"""
        logger.info("Starting continuous ML training worker")
        
        while True:
            try:
                # Wait for retrain requests
                model_type = await asyncio.wait_for(self.retrain_queue.get(), timeout=3600)
                
                # Train the model
                success = await self.train_model(model_type)
                
                if success:
                    # Load the new model
                    await self.load_model(model_type)
                
                # Mark task as done
                self.retrain_queue.task_done()
                
            except asyncio.TimeoutError:
                # No retrain requests, do periodic checks
                await self._periodic_health_check()
                
            except Exception as e:
                logger.error(f"Error in continuous training worker: {e}")
                await asyncio.sleep(60)  # Wait before retrying
    
    async def _periodic_health_check(self):
        """Perform periodic health checks on models"""
        try:
            for model_type in ModelType:
                # Check if models need periodic retraining
                await self._check_retrain_trigger(model_type)
                
                # Update performance metrics from recent feedback
                await self._update_model_performance_metrics(model_type)
            
        except Exception as e:
            logger.error(f"Error in periodic health check: {e}")
    
    async def _update_model_performance_metrics(self, model_type: ModelType):
        """Update model performance metrics from user feedback"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get recent feedback for this model type
            cursor.execute("""
                SELECT AVG(rating), COUNT(*), AVG(CASE WHEN trade_completed THEN 1.0 ELSE 0.0 END)
                FROM user_feedback 
                WHERE created_at > ? AND feedback_type LIKE ?
            """, (
                (datetime.utcnow() - timedelta(days=7)).isoformat(),
                f"%{model_type.value.split('_')[0]}%"
            ))
            
            result = cursor.fetchone()
            
            if result and result[1] > 0:  # If we have feedback
                avg_rating = result[0] or 0.0
                feedback_count = result[1]
                trade_success_rate = result[2] or 0.0
                
                # Update performance metrics
                cursor.execute("""
                    UPDATE model_performance 
                    SET user_satisfaction = ?, trade_success_rate = ?, feedback_score = ?
                    WHERE model_type = ? AND deployed_at > ?
                """, (
                    avg_rating / 5.0,  # Normalize to 0-1
                    trade_success_rate,
                    avg_rating / 5.0,
                    model_type.value,
                    (datetime.utcnow() - timedelta(days=1)).isoformat()
                ))
                
                conn.commit()
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Error updating model performance metrics: {e}")
    
    async def _record_training_job_start(self, job_id: str, model_type: ModelType):
        """Record training job start"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO training_jobs (job_id, model_type, status)
                VALUES (?, ?, 'running')
            """, (job_id, model_type.value))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error recording training job start: {e}")
    
    async def _record_training_job_success(self, job_id: str, training_samples: int, 
                                         improvement_score: float):
        """Record successful training job completion"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE training_jobs 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP,
                    training_samples = ?, improvement_score = ?
                WHERE job_id = ?
            """, (training_samples, improvement_score, job_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error recording training job success: {e}")
    
    async def _record_training_job_error(self, job_id: str, error_message: str):
        """Record training job error"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE training_jobs 
                SET status = 'failed', completed_at = CURRENT_TIMESTAMP,
                    error_message = ?
                WHERE job_id = ?
            """, (error_message, job_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error recording training job error: {e}")
    
    async def _record_model_version(self, model_type: ModelType, config: ModelConfiguration,
                                  model_path: str, performance: ModelPerformance):
        """Record new model version"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Deactivate old models
            cursor.execute("""
                UPDATE model_versions SET is_active = FALSE 
                WHERE model_type = ?
            """, (model_type.value,))
            
            # Record new model version
            cursor.execute("""
                INSERT INTO model_versions 
                (model_type, version, algorithm, hyperparameters, feature_columns,
                 model_path, is_active, performance_score)
                VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)
            """, (
                model_type.value,
                performance.version,
                config.algorithm,
                json.dumps(config.hyperparameters),
                json.dumps(config.feature_columns),
                model_path,
                performance.r2_score
            ))
            
            # Record performance
            cursor.execute("""
                INSERT INTO model_performance 
                (model_id, model_type, version, mae, rmse, r2_score,
                 training_size, validation_size, training_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                performance.model_id,
                performance.model_type.value,
                performance.version,
                performance.mae,
                performance.rmse,
                performance.r2_score,
                performance.training_size,
                performance.validation_size,
                performance.training_time
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error recording model version: {e}")
    
    async def _get_active_model_version(self, model_type: ModelType) -> Optional[str]:
        """Get active model version"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT version FROM model_versions 
                WHERE model_type = ? AND is_active = TRUE
                ORDER BY created_at DESC LIMIT 1
            """, (model_type.value,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] if result else None
            
        except Exception as e:
            logger.error(f"Error getting active model version: {e}")
            return None
    
    async def get_model_performance_summary(self) -> Dict[str, Any]:
        """Get summary of all model performances"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get latest performance for each model type
            cursor.execute("""
                SELECT model_type, version, r2_score, user_satisfaction, 
                       trade_success_rate, training_size, deployed_at
                FROM model_performance 
                WHERE (model_type, deployed_at) IN (
                    SELECT model_type, MAX(deployed_at) 
                    FROM model_performance 
                    GROUP BY model_type
                )
            """)
            
            results = cursor.fetchall()
            conn.close()
            
            summary = {
                'models': {},
                'overall_health': 'good',
                'last_updated': datetime.utcnow().isoformat()
            }
            
            for row in results:
                model_type = row[0]
                summary['models'][model_type] = {
                    'version': row[1],
                    'accuracy': row[2],
                    'user_satisfaction': row[3],
                    'trade_success_rate': row[4],
                    'training_size': row[5],
                    'deployed_at': row[6]
                }
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting model performance summary: {e}")
            return {}


# Global ML training pipeline instance
ml_training_pipeline = MLTrainingPipeline()


# Export classes and functions
__all__ = [
    'ModelType',
    'TrainingDataQuality',
    'TrainingExample',
    'ModelPerformance',
    'ModelConfiguration',
    'MLTrainingPipeline',
    'ml_training_pipeline'
]