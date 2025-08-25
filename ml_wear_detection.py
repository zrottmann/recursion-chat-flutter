#!/usr/bin/env python3
"""
Machine Learning Wear Detection System for Trading Post
Advanced pattern recognition for item condition assessment with continuous learning
"""

import os
import json
import asyncio
import logging
import pickle
import numpy as np
from typing import Dict, List, Optional, Tuple, Any, NamedTuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import cv2
import sqlite3
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
from enhanced_computer_vision import WearIndicator, AdvancedConditionAssessment
from memory_optimized_image_processing import memory_safe_image_processing

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WearPattern(NamedTuple):
    """Represents a learned wear pattern"""
    pattern_id: str
    wear_type: str
    features: np.ndarray
    severity_score: float
    confidence: float
    training_count: int


@dataclass
class TrainingExample:
    """Training example for wear detection"""
    image_path: str
    wear_annotations: List[Dict[str, Any]]
    ground_truth_condition: str
    ground_truth_score: float
    user_feedback: Optional[str] = None
    expert_validated: bool = False
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


@dataclass
class WearDetectionMetrics:
    """Metrics for wear detection performance"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    false_negative_rate: float
    user_satisfaction_score: float
    training_examples_count: int


class MLWearDetectionSystem:
    """
    Machine Learning-based wear detection system with continuous learning
    """
    
    def __init__(self, model_dir: str = "models/wear_detection"):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Initialize models
        self.wear_classifier = None
        self.severity_estimator = None
        self.anomaly_detector = None
        self.feature_scaler = StandardScaler()
        
        # Training data storage
        self.training_examples = []
        self.wear_patterns = {}
        
        # Model paths
        self.classifier_path = os.path.join(model_dir, "wear_classifier.joblib")
        self.severity_path = os.path.join(model_dir, "severity_estimator.joblib")
        self.scaler_path = os.path.join(model_dir, "feature_scaler.joblib")
        self.patterns_path = os.path.join(model_dir, "wear_patterns.json")
        
        # Performance tracking
        self.metrics_history = []
        self.last_training_time = None
        
        # Load existing models
        asyncio.create_task(self._load_models())
    
    async def _load_models(self):
        """Load existing trained models"""
        try:
            if os.path.exists(self.classifier_path):
                self.wear_classifier = joblib.load(self.classifier_path)
                logger.info("Loaded wear classifier model")
            
            if os.path.exists(self.severity_path):
                self.severity_estimator = joblib.load(self.severity_path)
                logger.info("Loaded severity estimator model")
            
            if os.path.exists(self.scaler_path):
                self.feature_scaler = joblib.load(self.scaler_path)
                logger.info("Loaded feature scaler")
            
            if os.path.exists(self.patterns_path):
                with open(self.patterns_path, 'r') as f:
                    patterns_data = json.load(f)
                    self.wear_patterns = {
                        k: WearPattern(**v) for k, v in patterns_data.items()
                    }
                logger.info(f"Loaded {len(self.wear_patterns)} wear patterns")
            
            # Initialize default models if none exist
            if self.wear_classifier is None:
                await self._initialize_default_models()
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            await self._initialize_default_models()
    
    async def _initialize_default_models(self):
        """Initialize default models with basic configuration"""
        try:
            # Initialize wear classifier (multi-class)
            self.wear_classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )
            
            # Initialize severity estimator (regression)
            from sklearn.ensemble import RandomForestRegressor
            self.severity_estimator = RandomForestRegressor(
                n_estimators=50,
                max_depth=8,
                random_state=42
            )
            
            # Initialize anomaly detector for unusual wear patterns
            self.anomaly_detector = IsolationForest(
                contamination=0.1,
                random_state=42
            )
            
            logger.info("Initialized default ML models")
            
        except Exception as e:
            logger.error(f"Error initializing default models: {e}")
    
    async def detect_wear_ml(self, image: np.ndarray, 
                           image_path: str) -> List[WearIndicator]:
        """
        Detect wear using machine learning models
        """
        try:
            with memory_safe_image_processing():
                # Extract comprehensive features
                features = await self._extract_wear_features(image)
                
                # Use trained models to predict wear
                wear_indicators = []
                
                if self.wear_classifier is not None and len(features) > 0:
                    # Classify wear types
                    wear_predictions = await self._classify_wear_types(features, image)
                    wear_indicators.extend(wear_predictions)
                
                # Use pattern matching for additional detection
                pattern_matches = await self._match_learned_patterns(features)
                wear_indicators.extend(pattern_matches)
                
                # Anomaly detection for unusual wear
                anomalies = await self._detect_anomalous_wear(features, image)
                wear_indicators.extend(anomalies)
                
                # Post-process and refine detections
                refined_indicators = await self._refine_detections(wear_indicators, image)
                
                return refined_indicators
                
        except Exception as e:
            logger.error(f"ML wear detection failed: {e}")
            return []
    
    async def _extract_wear_features(self, image: np.ndarray) -> np.ndarray:
        """Extract comprehensive features for wear detection"""
        try:
            features = []
            
            # Convert to different color spaces
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            
            # 1. Texture features
            texture_features = await self._extract_texture_features(gray)
            features.extend(texture_features)
            
            # 2. Color distribution features
            color_features = await self._extract_color_features(hsv, lab)
            features.extend(color_features)
            
            # 3. Edge and contour features
            edge_features = await self._extract_edge_features(gray)
            features.extend(edge_features)
            
            # 4. Gradient features
            gradient_features = await self._extract_gradient_features(gray)
            features.extend(gradient_features)
            
            # 5. Statistical features
            statistical_features = await self._extract_statistical_features(image)
            features.extend(statistical_features)
            
            # 6. Morphological features
            morphological_features = await self._extract_morphological_features(gray)
            features.extend(morphological_features)
            
            return np.array(features)
            
        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return np.array([])
    
    async def _extract_texture_features(self, gray: np.ndarray) -> List[float]:
        """Extract texture-based features"""
        features = []
        
        try:
            # Local Binary Pattern approximation
            # Calculate gradient direction
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            
            features.extend([
                np.mean(gradient_magnitude),
                np.std(gradient_magnitude),
                np.max(gradient_magnitude),
                np.percentile(gradient_magnitude, 95)
            ])
            
            # Variance and standard deviation in local windows
            kernel = np.ones((5, 5), np.float32) / 25
            local_mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
            local_variance = cv2.filter2D((gray.astype(np.float32) - local_mean)**2, -1, kernel)
            
            features.extend([
                np.mean(local_variance),
                np.std(local_variance),
                np.max(local_variance)
            ])
            
            # Fourier transform features (frequency domain)
            f_transform = np.fft.fft2(gray)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.log(np.abs(f_shift) + 1)
            
            features.extend([
                np.mean(magnitude_spectrum),
                np.std(magnitude_spectrum),
                np.max(magnitude_spectrum)
            ])
            
        except Exception as e:
            logger.warning(f"Texture feature extraction failed: {e}")
            features.extend([0.0] * 10)  # Fallback values
        
        return features
    
    async def _extract_color_features(self, hsv: np.ndarray, lab: np.ndarray) -> List[float]:
        """Extract color-based features"""
        features = []
        
        try:
            # HSV channel statistics
            for channel in range(3):
                channel_data = hsv[:, :, channel]
                features.extend([
                    np.mean(channel_data),
                    np.std(channel_data),
                    np.min(channel_data),
                    np.max(channel_data),
                    np.percentile(channel_data, 25),
                    np.percentile(channel_data, 75)
                ])
            
            # LAB channel statistics
            for channel in range(3):
                channel_data = lab[:, :, channel]
                features.extend([
                    np.mean(channel_data),
                    np.std(channel_data)
                ])
            
            # Color uniformity measures
            h_channel = hsv[:, :, 0]
            s_channel = hsv[:, :, 1]
            
            # Hue concentration (indicates color fading)
            hue_hist, _ = np.histogram(h_channel, bins=36, range=(0, 180))
            hue_concentration = np.max(hue_hist) / np.sum(hue_hist)
            features.append(hue_concentration)
            
            # Saturation uniformity (indicates color fading)
            saturation_uniformity = 1.0 - (np.std(s_channel) / (np.mean(s_channel) + 1e-6))
            features.append(saturation_uniformity)
            
        except Exception as e:
            logger.warning(f"Color feature extraction failed: {e}")
            features.extend([0.0] * 26)  # Fallback values
        
        return features
    
    async def _extract_edge_features(self, gray: np.ndarray) -> List[float]:
        """Extract edge and contour features"""
        features = []
        
        try:
            # Canny edge detection with multiple thresholds
            edges_low = cv2.Canny(gray, 50, 100)
            edges_high = cv2.Canny(gray, 100, 200)
            
            # Edge density
            edge_density_low = np.sum(edges_low > 0) / edges_low.size
            edge_density_high = np.sum(edges_high > 0) / edges_high.size
            features.extend([edge_density_low, edge_density_high])
            
            # Contour analysis
            contours, _ = cv2.findContours(edges_high, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Contour statistics
                areas = [cv2.contourArea(c) for c in contours]
                perimeters = [cv2.arcLength(c, True) for c in contours]
                
                features.extend([
                    len(contours),  # Number of contours
                    np.mean(areas) if areas else 0,
                    np.std(areas) if areas else 0,
                    np.max(areas) if areas else 0,
                    np.mean(perimeters) if perimeters else 0,
                    np.std(perimeters) if perimeters else 0
                ])
                
                # Circularity and aspect ratio features
                circularities = []
                aspect_ratios = []
                
                for contour in contours[:10]:  # Limit to avoid computation overhead
                    area = cv2.contourArea(contour)
                    perimeter = cv2.arcLength(contour, True)
                    
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter ** 2)
                        circularities.append(circularity)
                    
                    x, y, w, h = cv2.boundingRect(contour)
                    if h > 0:
                        aspect_ratio = w / h
                        aspect_ratios.append(aspect_ratio)
                
                features.extend([
                    np.mean(circularities) if circularities else 0,
                    np.std(circularities) if circularities else 0,
                    np.mean(aspect_ratios) if aspect_ratios else 1,
                    np.std(aspect_ratios) if aspect_ratios else 0
                ])
            else:
                features.extend([0.0] * 10)  # No contours found
            
        except Exception as e:
            logger.warning(f"Edge feature extraction failed: {e}")
            features.extend([0.0] * 12)  # Fallback values
        
        return features
    
    async def _extract_gradient_features(self, gray: np.ndarray) -> List[float]:
        """Extract gradient-based features"""
        features = []
        
        try:
            # Sobel gradients
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            
            # Gradient magnitude and direction
            magnitude = np.sqrt(grad_x**2 + grad_y**2)
            direction = np.arctan2(grad_y, grad_x)
            
            # Magnitude statistics
            features.extend([
                np.mean(magnitude),
                np.std(magnitude),
                np.max(magnitude),
                np.percentile(magnitude, 95),
                np.percentile(magnitude, 5)
            ])
            
            # Direction statistics (gradient orientation)
            features.extend([
                np.mean(direction),
                np.std(direction),
                np.var(direction)
            ])
            
            # Laplacian (second-order derivative)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            features.extend([
                np.mean(np.abs(laplacian)),
                np.std(laplacian),
                np.var(laplacian)
            ])
            
        except Exception as e:
            logger.warning(f"Gradient feature extraction failed: {e}")
            features.extend([0.0] * 11)  # Fallback values
        
        return features
    
    async def _extract_statistical_features(self, image: np.ndarray) -> List[float]:
        """Extract statistical features from image"""
        features = []
        
        try:
            # Convert to grayscale for some statistics
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Basic statistics
            features.extend([
                np.mean(gray),
                np.std(gray),
                np.var(gray),
                np.min(gray),
                np.max(gray),
                np.median(gray)
            ])
            
            # Percentiles
            percentiles = [10, 25, 75, 90, 95, 99]
            for p in percentiles:
                features.append(np.percentile(gray, p))
            
            # Skewness and kurtosis approximation
            mean_val = np.mean(gray)
            std_val = np.std(gray)
            if std_val > 0:
                # Approximate skewness
                skewness = np.mean(((gray - mean_val) / std_val) ** 3)
                # Approximate kurtosis
                kurtosis = np.mean(((gray - mean_val) / std_val) ** 4) - 3
            else:
                skewness = 0
                kurtosis = 0
            
            features.extend([skewness, kurtosis])
            
            # Entropy
            hist, _ = np.histogram(gray, bins=256, range=(0, 256))
            hist = hist / hist.sum()  # Normalize
            entropy = -np.sum(hist * np.log2(hist + 1e-7))
            features.append(entropy)
            
        except Exception as e:
            logger.warning(f"Statistical feature extraction failed: {e}")
            features.extend([0.0] * 15)  # Fallback values
        
        return features
    
    async def _extract_morphological_features(self, gray: np.ndarray) -> List[float]:
        """Extract morphological features"""
        features = []
        
        try:
            # Morphological operations
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            
            # Opening (erosion followed by dilation)
            opening = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel)
            opening_diff = np.mean(np.abs(gray.astype(np.float32) - opening.astype(np.float32)))
            features.append(opening_diff)
            
            # Closing (dilation followed by erosion)
            closing = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
            closing_diff = np.mean(np.abs(gray.astype(np.float32) - closing.astype(np.float32)))
            features.append(closing_diff)
            
            # Gradient (difference between dilation and erosion)
            gradient = cv2.morphologyEx(gray, cv2.MORPH_GRADIENT, kernel)
            features.extend([
                np.mean(gradient),
                np.std(gradient),
                np.max(gradient)
            ])
            
            # Top hat (difference between input and opening)
            tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
            features.extend([
                np.mean(tophat),
                np.std(tophat)
            ])
            
            # Black hat (difference between closing and input)
            blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
            features.extend([
                np.mean(blackhat),
                np.std(blackhat)
            ])
            
        except Exception as e:
            logger.warning(f"Morphological feature extraction failed: {e}")
            features.extend([0.0] * 9)  # Fallback values
        
        return features
    
    async def _classify_wear_types(self, features: np.ndarray, 
                                 image: np.ndarray) -> List[WearIndicator]:
        """Classify wear types using trained classifier"""
        try:
            if self.wear_classifier is None or len(features) == 0:
                return []
            
            # Reshape features for prediction
            features_reshaped = features.reshape(1, -1)
            
            # Scale features
            if hasattr(self.feature_scaler, 'transform'):
                features_scaled = self.feature_scaler.transform(features_reshaped)
            else:
                features_scaled = features_reshaped
            
            # Predict wear types
            wear_indicators = []
            
            try:
                # Get prediction probabilities
                if hasattr(self.wear_classifier, 'predict_proba'):
                    probabilities = self.wear_classifier.predict_proba(features_scaled)[0]
                    classes = self.wear_classifier.classes_
                    
                    # Create wear indicators for high-probability classes
                    for i, (class_name, prob) in enumerate(zip(classes, probabilities)):
                        if prob > 0.3:  # Threshold for positive detection
                            severity = await self._estimate_severity(features_scaled, class_name)
                            
                            wear_indicators.append(WearIndicator(
                                type=class_name,
                                severity=severity,
                                location="ML detected region",
                                confidence=float(prob),
                                description=f"ML detected {class_name} with {prob:.2f} confidence"
                            ))
                else:
                    # Fallback to simple prediction
                    prediction = self.wear_classifier.predict(features_scaled)[0]
                    severity = await self._estimate_severity(features_scaled, prediction)
                    
                    wear_indicators.append(WearIndicator(
                        type=prediction,
                        severity=severity,
                        location="ML detected region",
                        confidence=0.6,
                        description=f"ML detected {prediction}"
                    ))
                    
            except Exception as prediction_error:
                logger.warning(f"ML prediction failed: {prediction_error}")
                return []
            
            return wear_indicators
            
        except Exception as e:
            logger.error(f"Wear classification failed: {e}")
            return []
    
    async def _estimate_severity(self, features: np.ndarray, wear_type: str) -> str:
        """Estimate severity of detected wear"""
        try:
            if self.severity_estimator is not None:
                severity_score = self.severity_estimator.predict(features)[0]
                
                # Convert continuous score to categorical severity
                if severity_score >= 0.8:
                    return "severe"
                elif severity_score >= 0.6:
                    return "major"
                elif severity_score >= 0.4:
                    return "moderate"
                else:
                    return "minor"
            else:
                # Default severity estimation based on wear type
                default_severities = {
                    'scratch': 'minor',
                    'dent': 'moderate',
                    'crack': 'major',
                    'tear': 'major',
                    'stain': 'minor',
                    'fade': 'minor',
                    'chip': 'moderate'
                }
                return default_severities.get(wear_type, 'minor')
                
        except Exception as e:
            logger.warning(f"Severity estimation failed: {e}")
            return "minor"
    
    async def _match_learned_patterns(self, features: np.ndarray) -> List[WearIndicator]:
        """Match features against learned wear patterns"""
        pattern_matches = []
        
        try:
            if not self.wear_patterns or len(features) == 0:
                return []
            
            # Compare features with learned patterns
            for pattern_id, pattern in self.wear_patterns.items():
                if len(pattern.features) == len(features):
                    # Calculate similarity (using cosine similarity)
                    similarity = np.dot(features, pattern.features) / (
                        np.linalg.norm(features) * np.linalg.norm(pattern.features) + 1e-7
                    )
                    
                    if similarity > 0.7:  # High similarity threshold
                        confidence = min(similarity * pattern.confidence, 1.0)
                        
                        # Estimate severity based on pattern
                        severity_mapping = {
                            (0, 2): "minor",
                            (2, 5): "moderate", 
                            (5, 8): "major",
                            (8, 10): "severe"
                        }
                        
                        severity = "minor"
                        for (min_score, max_score), sev in severity_mapping.items():
                            if min_score <= pattern.severity_score < max_score:
                                severity = sev
                                break
                        
                        pattern_matches.append(WearIndicator(
                            type=pattern.wear_type,
                            severity=severity,
                            location=f"Pattern-matched region (pattern {pattern_id[:8]})",
                            confidence=confidence,
                            description=f"Matched learned pattern (similarity: {similarity:.2f})"
                        ))
            
        except Exception as e:
            logger.error(f"Pattern matching failed: {e}")
        
        return pattern_matches
    
    async def _detect_anomalous_wear(self, features: np.ndarray, 
                                   image: np.ndarray) -> List[WearIndicator]:
        """Detect anomalous wear patterns"""
        try:
            if self.anomaly_detector is None or len(features) == 0:
                return []
            
            features_reshaped = features.reshape(1, -1)
            
            # Scale features if scaler is available
            if hasattr(self.feature_scaler, 'transform'):
                features_scaled = self.feature_scaler.transform(features_reshaped)
            else:
                features_scaled = features_reshaped
            
            # Detect anomalies
            anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
            is_anomaly = self.anomaly_detector.predict(features_scaled)[0] == -1
            
            anomalous_indicators = []
            
            if is_anomaly:
                # Anomaly detected - classify as unusual wear
                confidence = min(abs(anomaly_score) / 2.0, 1.0)  # Convert score to confidence
                
                anomalous_indicators.append(WearIndicator(
                    type="unusual_wear",
                    severity="moderate",
                    location="Anomaly detected region",
                    confidence=confidence,
                    description=f"Unusual wear pattern detected (anomaly score: {anomaly_score:.2f})"
                ))
            
            return anomalous_indicators
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
            return []
    
    async def _refine_detections(self, wear_indicators: List[WearIndicator], 
                               image: np.ndarray) -> List[WearIndicator]:
        """Refine and filter wear detections"""
        try:
            if not wear_indicators:
                return []
            
            # Remove duplicate detections
            refined = []
            seen_types = set()
            
            # Sort by confidence
            sorted_indicators = sorted(wear_indicators, key=lambda x: x.confidence, reverse=True)
            
            for indicator in sorted_indicators:
                # Keep only highest confidence detection per type
                if indicator.type not in seen_types or indicator.confidence > 0.8:
                    refined.append(indicator)
                    seen_types.add(indicator.type)
            
            # Limit total number of detections
            refined = refined[:10]
            
            # Filter low-confidence detections
            high_confidence = [ind for ind in refined if ind.confidence > 0.4]
            
            return high_confidence
            
        except Exception as e:
            logger.error(f"Detection refinement failed: {e}")
            return wear_indicators
    
    async def add_training_example(self, example: TrainingExample):
        """Add a training example for model improvement"""
        try:
            self.training_examples.append(example)
            
            # Store in database for persistence
            await self._store_training_example(example)
            
            # Trigger retraining if we have enough new examples
            if len(self.training_examples) % 50 == 0:  # Retrain every 50 examples
                await self._retrain_models()
                
            logger.info(f"Added training example, total: {len(self.training_examples)}")
            
        except Exception as e:
            logger.error(f"Failed to add training example: {e}")
    
    async def _store_training_example(self, example: TrainingExample):
        """Store training example in database"""
        try:
            db_path = "trading_post.db"
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Create table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ml_training_examples (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_path TEXT,
                    wear_annotations TEXT,
                    ground_truth_condition TEXT,
                    ground_truth_score REAL,
                    user_feedback TEXT,
                    expert_validated BOOLEAN,
                    created_at TIMESTAMP
                )
            """)
            
            # Insert example
            cursor.execute("""
                INSERT INTO ml_training_examples 
                (image_path, wear_annotations, ground_truth_condition, 
                 ground_truth_score, user_feedback, expert_validated, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                example.image_path,
                json.dumps(example.wear_annotations),
                example.ground_truth_condition,
                example.ground_truth_score,
                example.user_feedback,
                example.expert_validated,
                example.created_at.isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to store training example: {e}")
    
    async def _retrain_models(self):
        """Retrain models with accumulated training data"""
        try:
            if len(self.training_examples) < 20:  # Need minimum training data
                logger.info("Insufficient training data for retraining")
                return
            
            logger.info(f"Starting model retraining with {len(self.training_examples)} examples")
            
            # Prepare training data
            X, y_wear_type, y_severity = await self._prepare_training_data()
            
            if len(X) == 0:
                logger.warning("No valid training data prepared")
                return
            
            # Split data
            X_train, X_test, y_wear_train, y_wear_test = train_test_split(
                X, y_wear_type, test_size=0.2, random_state=42
            )
            
            # Train feature scaler
            self.feature_scaler.fit(X_train)
            X_train_scaled = self.feature_scaler.transform(X_train)
            X_test_scaled = self.feature_scaler.transform(X_test)
            
            # Train wear type classifier
            self.wear_classifier.fit(X_train_scaled, y_wear_train)
            
            # Train severity estimator
            if len(y_severity) > 0:
                _, _, y_sev_train, y_sev_test = train_test_split(
                    X, y_severity, test_size=0.2, random_state=42
                )
                self.severity_estimator.fit(X_train_scaled, y_sev_train)
            
            # Train anomaly detector
            self.anomaly_detector.fit(X_train_scaled)
            
            # Evaluate models
            await self._evaluate_models(X_test_scaled, y_wear_test)
            
            # Save models
            await self._save_models()
            
            self.last_training_time = datetime.utcnow()
            logger.info("Model retraining completed successfully")
            
        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
    
    async def _prepare_training_data(self) -> Tuple[np.ndarray, List[str], List[float]]:
        """Prepare training data from examples"""
        X = []
        y_wear_type = []
        y_severity = []
        
        try:
            for example in self.training_examples:
                if not os.path.exists(example.image_path):
                    continue
                
                # Load and process image
                image = cv2.imread(example.image_path)
                if image is None:
                    continue
                
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                # Extract features
                features = await self._extract_wear_features(image_rgb)
                if len(features) == 0:
                    continue
                
                X.append(features)
                
                # Extract labels from annotations
                if example.wear_annotations:
                    primary_wear = example.wear_annotations[0]
                    wear_type = primary_wear.get('type', 'unknown')
                    severity_str = primary_wear.get('severity', 'minor')
                    
                    # Convert severity to numeric
                    severity_map = {'minor': 0.25, 'moderate': 0.5, 'major': 0.75, 'severe': 1.0}
                    severity_score = severity_map.get(severity_str, 0.25)
                    
                    y_wear_type.append(wear_type)
                    y_severity.append(severity_score)
                else:
                    # Use ground truth condition
                    condition_to_wear = {
                        'mint': 'none',
                        'near_mint': 'minor_wear',
                        'excellent': 'minor_wear',
                        'very_good': 'moderate_wear',
                        'good': 'moderate_wear',
                        'fair': 'major_wear',
                        'poor': 'severe_wear'
                    }
                    
                    wear_type = condition_to_wear.get(example.ground_truth_condition, 'unknown')
                    severity_score = (10.0 - example.ground_truth_score) / 10.0
                    
                    y_wear_type.append(wear_type)
                    y_severity.append(severity_score)
            
            return np.array(X), y_wear_type, y_severity
            
        except Exception as e:
            logger.error(f"Training data preparation failed: {e}")
            return np.array([]), [], []
    
    async def _evaluate_models(self, X_test: np.ndarray, y_test: List[str]):
        """Evaluate trained models"""
        try:
            if len(X_test) == 0:
                return
            
            # Evaluate wear classifier
            y_pred = self.wear_classifier.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            # Generate classification report
            report = classification_report(y_test, y_pred, output_dict=True)
            
            # Calculate metrics
            metrics = WearDetectionMetrics(
                accuracy=accuracy,
                precision=report['macro avg']['precision'],
                recall=report['macro avg']['recall'],
                f1_score=report['macro avg']['f1-score'],
                false_positive_rate=1.0 - report['macro avg']['precision'],
                false_negative_rate=1.0 - report['macro avg']['recall'],
                user_satisfaction_score=0.8,  # Would be updated from user feedback
                training_examples_count=len(self.training_examples)
            )
            
            self.metrics_history.append(metrics)
            
            logger.info(f"Model evaluation - Accuracy: {accuracy:.3f}, "
                       f"Precision: {metrics.precision:.3f}, "
                       f"Recall: {metrics.recall:.3f}")
            
        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
    
    async def _save_models(self):
        """Save trained models to disk"""
        try:
            # Save models
            joblib.dump(self.wear_classifier, self.classifier_path)
            joblib.dump(self.severity_estimator, self.severity_path)
            joblib.dump(self.feature_scaler, self.scaler_path)
            
            # Save wear patterns
            patterns_data = {k: asdict(v) for k, v in self.wear_patterns.items()}
            with open(self.patterns_path, 'w') as f:
                json.dump(patterns_data, f, indent=2)
            
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error(f"Model saving failed: {e}")
    
    async def get_model_performance(self) -> Dict[str, Any]:
        """Get current model performance metrics"""
        try:
            if not self.metrics_history:
                return {"status": "no_metrics", "message": "No performance data available"}
            
            latest_metrics = self.metrics_history[-1]
            
            return {
                "status": "available",
                "latest_metrics": asdict(latest_metrics),
                "training_examples": len(self.training_examples),
                "last_training": self.last_training_time.isoformat() if self.last_training_time else None,
                "model_versions": {
                    "wear_classifier": "v1.0",
                    "severity_estimator": "v1.0",
                    "anomaly_detector": "v1.0"
                },
                "learned_patterns": len(self.wear_patterns)
            }
            
        except Exception as e:
            logger.error(f"Performance metrics retrieval failed: {e}")
            return {"status": "error", "message": str(e)}


# Global ML wear detection instance
ml_wear_detector = MLWearDetectionSystem()


# Export functions
async def detect_wear_with_ml(image: np.ndarray, image_path: str) -> List[WearIndicator]:
    """
    Main entry point for ML-based wear detection
    """
    return await ml_wear_detector.detect_wear_ml(image, image_path)


async def add_user_feedback(image_path: str, user_condition: str, 
                          user_score: float, feedback_notes: str = ""):
    """
    Add user feedback for model improvement
    """
    example = TrainingExample(
        image_path=image_path,
        wear_annotations=[],
        ground_truth_condition=user_condition,
        ground_truth_score=user_score,
        user_feedback=feedback_notes,
        expert_validated=False
    )
    
    await ml_wear_detector.add_training_example(example)


# Export the ML wear detection system
__all__ = [
    'MLWearDetectionSystem',
    'WearPattern',
    'TrainingExample', 
    'WearDetectionMetrics',
    'detect_wear_with_ml',
    'add_user_feedback',
    'ml_wear_detector'
]