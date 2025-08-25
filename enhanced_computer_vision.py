#!/usr/bin/env python3
"""
Enhanced Computer Vision System for Trading Post AI Photo Pricing
Advanced item recognition, wear detection, and condition assessment using multiple CV techniques
"""

import os
import json
import asyncio
import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import cv2
import base64
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
import sqlite3
from memory_optimized_image_processing import ai_processor, memory_safe_image_processing
import openai
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROK_API_KEY = os.getenv("GROK_API_KEY", "")
USE_ADVANCED_CV = os.getenv("USE_ADVANCED_CV", "true").lower() == "true"

# Initialize AI clients
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


@dataclass
class WearIndicator:
    """Represents a specific wear indicator found on an item"""
    type: str  # 'scratch', 'dent', 'stain', 'fade', 'crack', 'tear', 'chip'
    severity: str  # 'minor', 'moderate', 'major', 'severe'
    location: str  # Description of where the wear is located
    confidence: float  # Confidence in this detection (0-1)
    coordinates: Optional[Tuple[int, int, int, int]] = None  # Bounding box if detected
    description: str = ""


@dataclass
class ItemAttributes:
    """Enhanced item attributes from computer vision analysis"""
    category: str
    subcategory: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    color_primary: Optional[str] = None
    color_secondary: Optional[str] = None
    material: Optional[str] = None
    size_estimate: Optional[str] = None
    age_estimate: Optional[str] = None
    style: Optional[str] = None
    features: List[str] = None
    text_detected: List[str] = None
    confidence: float = 0.0

    def __post_init__(self):
        if self.features is None:
            self.features = []
        if self.text_detected is None:
            self.text_detected = []


@dataclass
class AdvancedConditionAssessment:
    """Advanced condition assessment with detailed wear analysis"""
    overall_condition: str  # 'mint', 'near_mint', 'excellent', 'very_good', 'good', 'fair', 'poor'
    condition_score: float  # 0-10 scale
    wear_indicators: List[WearIndicator]
    aesthetic_score: float  # How visually appealing (affects marketability)
    functional_score: float  # How functional the item appears
    marketability_score: float  # Combined score affecting sale potential
    detailed_notes: str
    confidence: float
    processing_time: float


@dataclass
class EnhancedItemRecognition:
    """Enhanced item recognition results"""
    primary_identification: ItemAttributes
    alternative_identifications: List[ItemAttributes]
    confidence_score: float
    processing_method: str  # 'ai_vision', 'hybrid_cv', 'template_matching'
    detail_level: str  # 'basic', 'detailed', 'expert'


class AdvancedComputerVision:
    """
    Advanced computer vision system for item recognition and condition assessment
    """
    
    def __init__(self):
        self.wear_detection_models = self._initialize_wear_detection()
        self.brand_recognition_data = self._load_brand_recognition_data()
        self.color_detection_ranges = self._initialize_color_detection()
        self.text_extraction_enabled = True
        
    def _initialize_wear_detection(self) -> Dict[str, Any]:
        """Initialize wear detection algorithms"""
        return {
            'edge_detection': {
                'enabled': True,
                'canny_low': 50,
                'canny_high': 150,
                'blur_kernel': 5
            },
            'color_analysis': {
                'enabled': True,
                'saturation_threshold': 0.3,
                'brightness_threshold': 0.2
            },
            'texture_analysis': {
                'enabled': True,
                'glcm_properties': ['contrast', 'dissimilarity', 'homogeneity']
            },
            'contour_detection': {
                'enabled': True,
                'min_area': 100,
                'max_area': 50000
            }
        }
    
    def _load_brand_recognition_data(self) -> Dict[str, List[str]]:
        """Load brand recognition patterns"""
        return {
            'electronics': [
                'apple', 'samsung', 'sony', 'lg', 'panasonic', 'dell', 'hp', 'lenovo',
                'microsoft', 'nintendo', 'xbox', 'playstation', 'canon', 'nikon'
            ],
            'clothing': [
                'nike', 'adidas', 'under armour', 'levi', 'gap', 'h&m', 'zara',
                'gucci', 'prada', 'louis vuitton', 'coach', 'michael kors'
            ],
            'furniture': [
                'ikea', 'west elm', 'pottery barn', 'restoration hardware',
                'cb2', 'crate & barrel', 'ashley', 'la-z-boy'
            ],
            'tools': [
                'dewalt', 'milwaukee', 'ryobi', 'craftsman', 'black & decker',
                'makita', 'bosch', 'stanley', 'snap-on'
            ]
        }
    
    def _initialize_color_detection(self) -> Dict[str, Tuple[np.ndarray, np.ndarray]]:
        """Initialize HSV color ranges for detection"""
        return {
            'red': (np.array([0, 50, 50]), np.array([10, 255, 255])),
            'blue': (np.array([100, 50, 50]), np.array([130, 255, 255])),
            'green': (np.array([40, 50, 50]), np.array([80, 255, 255])),
            'yellow': (np.array([20, 50, 50]), np.array([40, 255, 255])),
            'black': (np.array([0, 0, 0]), np.array([180, 30, 30])),
            'white': (np.array([0, 0, 200]), np.array([180, 30, 255])),
            'gray': (np.array([0, 0, 50]), np.array([180, 30, 200])),
            'brown': (np.array([8, 50, 20]), np.array([20, 255, 200])),
            'orange': (np.array([10, 50, 50]), np.array([20, 255, 255])),
            'purple': (np.array([130, 50, 50]), np.array([160, 255, 255]))
        }
    
    async def analyze_image_advanced(self, image_path: str, 
                                   analysis_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Perform advanced computer vision analysis on an image
        
        analysis_type: 'quick', 'standard', 'comprehensive', 'expert'
        """
        start_time = datetime.now()
        
        try:
            with memory_safe_image_processing():
                # Load and preprocess image
                image = await self._load_and_preprocess_image(image_path)
                
                results = {
                    'timestamp': start_time.isoformat(),
                    'analysis_type': analysis_type,
                    'image_path': image_path
                }
                
                if analysis_type in ['quick', 'standard', 'comprehensive', 'expert']:
                    # Basic item recognition
                    results['item_recognition'] = await self._perform_item_recognition(image, image_path)
                
                if analysis_type in ['standard', 'comprehensive', 'expert']:
                    # Condition assessment
                    results['condition_assessment'] = await self._assess_item_condition(image, image_path)
                    
                    # Color analysis
                    results['color_analysis'] = await self._analyze_colors(image)
                
                if analysis_type in ['comprehensive', 'expert']:
                    # Advanced wear detection
                    results['wear_detection'] = await self._detect_wear_patterns(image)
                    
                    # Text extraction
                    results['text_extraction'] = await self._extract_text_content(image, image_path)
                    
                    # Material analysis
                    results['material_analysis'] = await self._analyze_materials(image)
                
                if analysis_type == 'expert':
                    # Expert-level analysis
                    results['brand_detection'] = await self._detect_brands(image, image_path)
                    results['authenticity_indicators'] = await self._check_authenticity_indicators(image)
                    results['market_category_confidence'] = await self._assess_market_category(results)
                
                # Calculate processing time
                processing_time = (datetime.now() - start_time).total_seconds()
                results['processing_time'] = processing_time
                results['success'] = True
                
                logger.info(f"Advanced CV analysis completed in {processing_time:.2f}s")
                return results
                
        except Exception as e:
            logger.error(f"Advanced CV analysis failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': start_time.isoformat(),
                'processing_time': (datetime.now() - start_time).total_seconds()
            }
    
    async def _load_and_preprocess_image(self, image_path: str) -> np.ndarray:
        """Load and preprocess image for CV analysis"""
        # Load image using OpenCV
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image: {image_path}")
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Apply preprocessing
        if image_rgb.shape[0] > 1024 or image_rgb.shape[1] > 1024:
            # Resize large images for processing efficiency
            height, width = image_rgb.shape[:2]
            scale = min(1024/height, 1024/width)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image_rgb = cv2.resize(image_rgb, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
        
        return image_rgb
    
    async def _perform_item_recognition(self, image: np.ndarray, 
                                      image_path: str) -> EnhancedItemRecognition:
        """Perform enhanced item recognition using multiple methods"""
        try:
            # Method 1: AI Vision API (primary)
            ai_recognition = await self._ai_vision_recognition(image_path)
            
            # Method 2: Computer Vision analysis (supplementary)
            cv_analysis = await self._cv_based_recognition(image)
            
            # Method 3: Combine results for enhanced accuracy
            combined_recognition = await self._combine_recognition_results(ai_recognition, cv_analysis)
            
            return combined_recognition
            
        except Exception as e:
            logger.error(f"Item recognition failed: {e}")
            return EnhancedItemRecognition(
                primary_identification=ItemAttributes(category="unknown", confidence=0.0),
                alternative_identifications=[],
                confidence_score=0.0,
                processing_method="error",
                detail_level="none"
            )
    
    async def _ai_vision_recognition(self, image_path: str) -> Dict[str, Any]:
        """Use AI vision for item recognition"""
        if not openai_client:
            return {'method': 'ai_vision', 'success': False, 'reason': 'no_api_key'}
        
        try:
            # Create optimized base64 for AI
            base64_image = await ai_processor.create_ai_ready_base64(image_path)
            
            prompt = """Analyze this image and provide detailed item identification in JSON format:
            {
                "category": "primary category (Electronics, Clothing, Furniture, Books, etc.)",
                "subcategory": "specific subcategory",
                "brand": "brand name if visible/identifiable",
                "model": "model number or name if identifiable",
                "color_primary": "primary color",
                "color_secondary": "secondary color if applicable",
                "material": "primary material (metal, plastic, fabric, wood, etc.)",
                "size_estimate": "estimated size category (small, medium, large, etc.)",
                "age_estimate": "estimated age (new, 1-2 years, 3-5 years, vintage, antique)",
                "style": "style description",
                "features": ["list", "of", "notable", "features"],
                "text_detected": ["any", "visible", "text", "or", "labels"],
                "confidence": 0.95
            }
            Focus on details that would help determine value and authenticity."""
            
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=600
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            result['method'] = 'ai_vision'
            result['success'] = True
            
            return result
            
        except Exception as e:
            logger.error(f"AI vision recognition failed: {e}")
            return {'method': 'ai_vision', 'success': False, 'error': str(e)}
    
    async def _cv_based_recognition(self, image: np.ndarray) -> Dict[str, Any]:
        """Computer vision-based recognition analysis"""
        try:
            results = {
                'method': 'computer_vision',
                'success': True
            }
            
            # Color analysis
            dominant_colors = await self._get_dominant_colors(image)
            results['dominant_colors'] = dominant_colors
            
            # Shape analysis
            shape_analysis = await self._analyze_shapes(image)
            results['shape_analysis'] = shape_analysis
            
            # Texture analysis
            texture_features = await self._analyze_texture(image)
            results['texture_features'] = texture_features
            
            # Edge density (complexity indicator)
            edge_density = await self._calculate_edge_density(image)
            results['edge_density'] = edge_density
            
            return results
            
        except Exception as e:
            logger.error(f"CV-based recognition failed: {e}")
            return {'method': 'computer_vision', 'success': False, 'error': str(e)}
    
    async def _assess_item_condition(self, image: np.ndarray, 
                                   image_path: str) -> AdvancedConditionAssessment:
        """Perform advanced condition assessment"""
        try:
            wear_indicators = []
            
            # Detect scratches and surface damage
            scratches = await self._detect_scratches(image)
            wear_indicators.extend(scratches)
            
            # Detect color fading
            fading = await self._detect_color_fading(image)
            wear_indicators.extend(fading)
            
            # Detect stains and discoloration
            stains = await self._detect_stains(image)
            wear_indicators.extend(stains)
            
            # Detect structural damage (dents, cracks, tears)
            structural_damage = await self._detect_structural_damage(image)
            wear_indicators.extend(structural_damage)
            
            # Calculate scores
            condition_score = await self._calculate_condition_score(wear_indicators)
            aesthetic_score = await self._calculate_aesthetic_score(image, wear_indicators)
            functional_score = await self._estimate_functional_score(wear_indicators)
            marketability_score = (condition_score + aesthetic_score + functional_score) / 3
            
            # Determine overall condition
            overall_condition = await self._determine_overall_condition(condition_score, wear_indicators)
            
            # Generate detailed notes
            detailed_notes = await self._generate_condition_notes(wear_indicators, condition_score)
            
            # AI-powered condition verification
            ai_condition = await self._ai_condition_verification(image_path, wear_indicators)
            
            return AdvancedConditionAssessment(
                overall_condition=overall_condition,
                condition_score=condition_score,
                wear_indicators=wear_indicators,
                aesthetic_score=aesthetic_score,
                functional_score=functional_score,
                marketability_score=marketability_score,
                detailed_notes=detailed_notes,
                confidence=ai_condition.get('confidence', 0.7),
                processing_time=0.0  # Will be set by caller
            )
            
        except Exception as e:
            logger.error(f"Condition assessment failed: {e}")
            return AdvancedConditionAssessment(
                overall_condition="unknown",
                condition_score=5.0,
                wear_indicators=[],
                aesthetic_score=5.0,
                functional_score=5.0,
                marketability_score=5.0,
                detailed_notes=f"Assessment failed: {str(e)}",
                confidence=0.1,
                processing_time=0.0
            )
    
    async def _detect_scratches(self, image: np.ndarray) -> List[WearIndicator]:
        """Detect scratches and surface damage using edge detection"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Apply Canny edge detection
            edges = cv2.Canny(blurred, 50, 150)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            scratches = []
            for contour in contours:
                # Analyze contour properties
                area = cv2.contourArea(contour)
                perimeter = cv2.arcLength(contour, True)
                
                if area > 0:
                    circularity = 4 * np.pi * area / (perimeter * perimeter)
                    
                    # Long, thin contours are likely scratches
                    if circularity < 0.3 and area > 50:
                        x, y, w, h = cv2.boundingRect(contour)
                        aspect_ratio = max(w, h) / min(w, h)
                        
                        if aspect_ratio > 3:  # Long and thin
                            severity = "minor"
                            if area > 500:
                                severity = "moderate"
                            if area > 1500:
                                severity = "major"
                            
                            scratches.append(WearIndicator(
                                type="scratch",
                                severity=severity,
                                location=f"Surface area at ({x}, {y})",
                                confidence=0.6,
                                coordinates=(x, y, w, h),
                                description=f"Linear surface damage, area: {area:.0f}px"
                            ))
            
            return scratches[:10]  # Limit to top 10 detections
            
        except Exception as e:
            logger.error(f"Scratch detection failed: {e}")
            return []
    
    async def _detect_color_fading(self, image: np.ndarray) -> List[WearIndicator]:
        """Detect color fading and discoloration"""
        try:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Calculate saturation statistics
            saturation = hsv[:, :, 1]
            mean_saturation = np.mean(saturation)
            std_saturation = np.std(saturation)
            
            fading_indicators = []
            
            # Check for overall low saturation (indicates fading)
            if mean_saturation < 100:  # Low saturation threshold
                confidence = min(0.8, (100 - mean_saturation) / 100)
                severity = "minor"
                if mean_saturation < 60:
                    severity = "moderate"
                if mean_saturation < 30:
                    severity = "major"
                
                fading_indicators.append(WearIndicator(
                    type="fade",
                    severity=severity,
                    location="Overall surface",
                    confidence=confidence,
                    description=f"Color fading detected, mean saturation: {mean_saturation:.1f}"
                ))
            
            # Check for uneven fading patterns
            if std_saturation > 40:  # High variation in saturation
                fading_indicators.append(WearIndicator(
                    type="fade",
                    severity="minor",
                    location="Patchy areas",
                    confidence=0.5,
                    description="Uneven color distribution suggesting patchy fading"
                ))
            
            return fading_indicators
            
        except Exception as e:
            logger.error(f"Color fading detection failed: {e}")
            return []
    
    async def _detect_stains(self, image: np.ndarray) -> List[WearIndicator]:
        """Detect stains and discoloration using color clustering"""
        try:
            # Convert to LAB color space for better stain detection
            lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
            
            # Focus on the 'a' and 'b' channels (color information)
            a_channel = lab[:, :, 1]
            b_channel = lab[:, :, 2]
            
            # Calculate color variance
            a_std = np.std(a_channel)
            b_std = np.std(b_channel)
            
            stains = []
            
            # High color variance in localized areas suggests stains
            if a_std > 15 or b_std > 15:
                # Use morphological operations to find dark/discolored regions
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                
                # Adaptive thresholding to find dark spots
                adaptive_thresh = cv2.adaptiveThreshold(
                    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
                )
                
                # Find contours of potential stains
                contours, _ = cv2.findContours(
                    255 - adaptive_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )
                
                for contour in contours:
                    area = cv2.contourArea(contour)
                    if 100 < area < 5000:  # Size range for typical stains
                        x, y, w, h = cv2.boundingRect(contour)
                        
                        severity = "minor"
                        if area > 1000:
                            severity = "moderate"
                        if area > 3000:
                            severity = "major"
                        
                        stains.append(WearIndicator(
                            type="stain",
                            severity=severity,
                            location=f"Surface at ({x}, {y})",
                            confidence=0.5,
                            coordinates=(x, y, w, h),
                            description=f"Discoloration area: {area:.0f}px"
                        ))
            
            return stains[:5]  # Limit to top 5 detections
            
        except Exception as e:
            logger.error(f"Stain detection failed: {e}")
            return []
    
    async def _detect_structural_damage(self, image: np.ndarray) -> List[WearIndicator]:
        """Detect structural damage like dents, cracks, and tears"""
        try:
            structural_damage = []
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Detect sharp edges that might indicate cracks or tears
            edges = cv2.Canny(gray, 100, 200)
            
            # Use Hough Line Transform to detect linear damage
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, 
                                   minLineLength=30, maxLineGap=10)
            
            if lines is not None:
                for line in lines[:10]:  # Limit processing
                    x1, y1, x2, y2 = line[0]
                    length = np.sqrt((x2-x1)**2 + (y2-y1)**2)
                    
                    if length > 50:  # Significant line length
                        severity = "minor"
                        if length > 100:
                            severity = "moderate"
                        if length > 200:
                            severity = "major"
                        
                        structural_damage.append(WearIndicator(
                            type="crack",
                            severity=severity,
                            location=f"Linear damage from ({x1}, {y1}) to ({x2}, {y2})",
                            confidence=0.4,
                            coordinates=(min(x1, x2), min(y1, y2), abs(x2-x1), abs(y2-y1)),
                            description=f"Linear structural damage, length: {length:.0f}px"
                        ))
            
            # Detect circular/curved damage (dents)
            circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 50,
                                     param1=50, param2=30, minRadius=10, maxRadius=100)
            
            if circles is not None:
                circles = np.round(circles[0, :]).astype("int")
                for (x, y, r) in circles[:5]:  # Limit to 5 detections
                    severity = "minor"
                    if r > 30:
                        severity = "moderate"
                    if r > 60:
                        severity = "major"
                    
                    structural_damage.append(WearIndicator(
                        type="dent",
                        severity=severity,
                        location=f"Circular damage at ({x}, {y})",
                        confidence=0.3,
                        coordinates=(x-r, y-r, 2*r, 2*r),
                        description=f"Circular deformation, radius: {r}px"
                    ))
            
            return structural_damage
            
        except Exception as e:
            logger.error(f"Structural damage detection failed: {e}")
            return []
    
    async def _calculate_condition_score(self, wear_indicators: List[WearIndicator]) -> float:
        """Calculate overall condition score based on wear indicators"""
        if not wear_indicators:
            return 9.0  # Near perfect if no wear detected
        
        base_score = 10.0
        
        for indicator in wear_indicators:
            # Deduct points based on severity and type
            severity_penalties = {
                'minor': 0.3,
                'moderate': 0.8,
                'major': 1.5,
                'severe': 2.5
            }
            
            type_multipliers = {
                'scratch': 1.0,
                'dent': 1.2,
                'stain': 0.8,
                'fade': 0.6,
                'crack': 1.8,
                'tear': 2.0,
                'chip': 1.1
            }
            
            penalty = severity_penalties.get(indicator.severity, 0.5)
            multiplier = type_multipliers.get(indicator.type, 1.0)
            confidence_factor = indicator.confidence
            
            base_score -= (penalty * multiplier * confidence_factor)
        
        return max(0.0, min(10.0, base_score))
    
    async def _calculate_aesthetic_score(self, image: np.ndarray, 
                                       wear_indicators: List[WearIndicator]) -> float:
        """Calculate aesthetic appeal score"""
        try:
            # Base aesthetic score from image properties
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Color vibrancy
            saturation_mean = np.mean(hsv[:, :, 1])
            vibrancy_score = min(10.0, saturation_mean / 20.0)
            
            # Brightness balance
            value_mean = np.mean(hsv[:, :, 2])
            brightness_score = 10.0 - abs(value_mean - 128) / 12.8
            
            # Edge clarity (focus quality)
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            clarity_score = min(10.0, laplacian_var / 100.0)
            
            base_aesthetic = (vibrancy_score + brightness_score + clarity_score) / 3
            
            # Reduce score based on visible wear
            wear_penalty = 0
            for indicator in wear_indicators:
                if indicator.type in ['stain', 'fade', 'scratch']:
                    wear_penalty += 0.5 * indicator.confidence
            
            return max(0.0, base_aesthetic - wear_penalty)
            
        except Exception as e:
            logger.error(f"Aesthetic score calculation failed: {e}")
            return 5.0
    
    async def _estimate_functional_score(self, wear_indicators: List[WearIndicator]) -> float:
        """Estimate functional score based on wear indicators"""
        base_functional = 10.0
        
        for indicator in wear_indicators:
            if indicator.type in ['crack', 'tear', 'dent']:
                # Structural damage affects functionality more
                severity_penalties = {
                    'minor': 1.0,
                    'moderate': 2.5,
                    'major': 4.0,
                    'severe': 6.0
                }
                penalty = severity_penalties.get(indicator.severity, 1.0)
                base_functional -= penalty * indicator.confidence
            elif indicator.type in ['stain', 'fade']:
                # Cosmetic damage has less impact on function
                base_functional -= 0.2 * indicator.confidence
        
        return max(0.0, base_functional)
    
    async def _determine_overall_condition(self, condition_score: float, 
                                         wear_indicators: List[WearIndicator]) -> str:
        """Determine overall condition category"""
        if condition_score >= 9.5:
            return "mint"
        elif condition_score >= 8.5:
            return "near_mint"
        elif condition_score >= 7.5:
            return "excellent"
        elif condition_score >= 6.5:
            return "very_good"
        elif condition_score >= 5.0:
            return "good"
        elif condition_score >= 3.0:
            return "fair"
        else:
            return "poor"
    
    async def _generate_condition_notes(self, wear_indicators: List[WearIndicator], 
                                      condition_score: float) -> str:
        """Generate detailed condition notes"""
        if not wear_indicators:
            return f"Item appears to be in excellent condition with no visible wear detected. Condition score: {condition_score:.1f}/10."
        
        notes = []
        notes.append(f"Overall condition score: {condition_score:.1f}/10")
        
        # Group indicators by type
        by_type = {}
        for indicator in wear_indicators:
            if indicator.type not in by_type:
                by_type[indicator.type] = []
            by_type[indicator.type].append(indicator)
        
        for wear_type, indicators in by_type.items():
            count = len(indicators)
            severities = [i.severity for i in indicators]
            most_severe = max(severities, key=lambda x: ['minor', 'moderate', 'major', 'severe'].index(x))
            
            if count == 1:
                notes.append(f"1 {most_severe} {wear_type} detected")
            else:
                notes.append(f"{count} {wear_type}s detected, most severe: {most_severe}")
        
        return ". ".join(notes) + "."
    
    async def _ai_condition_verification(self, image_path: str, 
                                       wear_indicators: List[WearIndicator]) -> Dict[str, Any]:
        """Use AI to verify condition assessment"""
        if not openai_client:
            return {'confidence': 0.5, 'notes': 'AI verification unavailable'}
        
        try:
            base64_image = await ai_processor.create_ai_ready_base64(image_path)
            
            wear_summary = f"Detected wear: {len(wear_indicators)} indicators including "
            wear_summary += ", ".join([f"{i.severity} {i.type}" for i in wear_indicators[:3]])
            
            prompt = f"""Assess the condition of this item for marketplace listing. 
            Computer vision detected: {wear_summary}
            
            Please verify and provide:
            {{
                "condition_verification": "mint|near_mint|excellent|very_good|good|fair|poor",
                "confidence": 0.85,
                "notes": "Brief assessment of visible condition",
                "cv_accuracy": "high|medium|low - how accurate was the computer vision"
            }}"""
            
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"AI condition verification failed: {e}")
            return {'confidence': 0.3, 'notes': f'Verification failed: {str(e)}'}
    
    # Additional helper methods for color analysis, shape analysis, etc.
    async def _get_dominant_colors(self, image: np.ndarray) -> List[str]:
        """Get dominant colors in the image"""
        try:
            # Reshape image to be a list of pixels
            pixels = image.reshape(-1, 3)
            
            # Use k-means clustering to find dominant colors
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            kmeans.fit(pixels)
            
            colors = []
            for center in kmeans.cluster_centers_:
                # Convert RGB to color name
                color_name = self._rgb_to_color_name(center)
                colors.append(color_name)
            
            return colors
            
        except Exception as e:
            logger.warning(f"Dominant color detection failed: {e}")
            return ["unknown"]
    
    def _rgb_to_color_name(self, rgb: np.ndarray) -> str:
        """Convert RGB values to color name"""
        r, g, b = rgb.astype(int)
        
        # Simple color name mapping
        if r > 200 and g > 200 and b > 200:
            return "white"
        elif r < 50 and g < 50 and b < 50:
            return "black"
        elif r > g and r > b:
            return "red"
        elif g > r and g > b:
            return "green"
        elif b > r and b > g:
            return "blue"
        elif r > 150 and g > 150 and b < 100:
            return "yellow"
        elif r > 150 and g < 100 and b > 150:
            return "purple"
        elif r > 150 and g > 100 and b < 100:
            return "orange"
        elif r < 150 and g > 100 and b < 100:
            return "brown"
        else:
            return "gray"
    
    async def _analyze_shapes(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze shapes in the image"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            shapes = {
                'total_contours': len(contours),
                'large_shapes': 0,
                'rectangular_shapes': 0,
                'circular_shapes': 0,
                'complexity': 'low'
            }
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 1000:  # Large shape threshold
                    shapes['large_shapes'] += 1
                    
                    # Approximate contour to polygon
                    epsilon = 0.02 * cv2.arcLength(contour, True)
                    approx = cv2.approxPolyDP(contour, epsilon, True)
                    
                    if len(approx) == 4:
                        shapes['rectangular_shapes'] += 1
                    
                    # Check circularity
                    perimeter = cv2.arcLength(contour, True)
                    if perimeter > 0:
                        circularity = 4 * np.pi * area / (perimeter * perimeter)
                        if circularity > 0.7:
                            shapes['circular_shapes'] += 1
            
            # Determine complexity
            if shapes['large_shapes'] > 10:
                shapes['complexity'] = 'high'
            elif shapes['large_shapes'] > 5:
                shapes['complexity'] = 'medium'
            
            return shapes
            
        except Exception as e:
            logger.error(f"Shape analysis failed: {e}")
            return {'error': str(e)}
    
    async def _analyze_texture(self, image: np.ndarray) -> Dict[str, float]:
        """Analyze texture properties of the image"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            # Calculate texture features
            features = {}
            
            # Standard deviation (texture roughness)
            features['roughness'] = np.std(gray) / 255.0
            
            # Local binary pattern approximation
            # Calculate gradient magnitude
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
            features['edge_density'] = np.mean(gradient_magnitude) / 255.0
            
            # Entropy (texture randomness)
            hist, _ = np.histogram(gray, bins=256, range=(0, 256))
            hist = hist / hist.sum()  # Normalize
            entropy = -np.sum(hist * np.log2(hist + 1e-7))
            features['entropy'] = entropy / 8.0  # Normalize to 0-1
            
            return features
            
        except Exception as e:
            logger.error(f"Texture analysis failed: {e}")
            return {'error': str(e)}
    
    async def _calculate_edge_density(self, image: np.ndarray) -> float:
        """Calculate edge density as a measure of image complexity"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            edge_pixels = np.sum(edges > 0)
            total_pixels = edges.shape[0] * edges.shape[1]
            return edge_pixels / total_pixels
            
        except Exception as e:
            logger.error(f"Edge density calculation failed: {e}")
            return 0.0
    
    async def _combine_recognition_results(self, ai_result: Dict[str, Any], 
                                         cv_result: Dict[str, Any]) -> EnhancedItemRecognition:
        """Combine AI and CV recognition results"""
        try:
            # Use AI result as primary if successful
            if ai_result.get('success', False):
                primary_attrs = ItemAttributes(
                    category=ai_result.get('category', 'unknown'),
                    subcategory=ai_result.get('subcategory'),
                    brand=ai_result.get('brand'),
                    model=ai_result.get('model'),
                    color_primary=ai_result.get('color_primary'),
                    color_secondary=ai_result.get('color_secondary'),
                    material=ai_result.get('material'),
                    size_estimate=ai_result.get('size_estimate'),
                    age_estimate=ai_result.get('age_estimate'),
                    style=ai_result.get('style'),
                    features=ai_result.get('features', []),
                    text_detected=ai_result.get('text_detected', []),
                    confidence=ai_result.get('confidence', 0.0)
                )
                
                # Enhance with CV data
                if cv_result.get('success', False):
                    if cv_result.get('dominant_colors'):
                        if not primary_attrs.color_primary:
                            primary_attrs.color_primary = cv_result['dominant_colors'][0]
                        if not primary_attrs.color_secondary and len(cv_result['dominant_colors']) > 1:
                            primary_attrs.color_secondary = cv_result['dominant_colors'][1]
                
                return EnhancedItemRecognition(
                    primary_identification=primary_attrs,
                    alternative_identifications=[],
                    confidence_score=primary_attrs.confidence,
                    processing_method="ai_vision_enhanced",
                    detail_level="detailed"
                )
            else:
                # Fallback to CV-only analysis
                cv_attrs = ItemAttributes(
                    category="unknown",
                    color_primary=cv_result.get('dominant_colors', ['unknown'])[0] if cv_result.get('dominant_colors') else 'unknown',
                    confidence=0.3
                )
                
                return EnhancedItemRecognition(
                    primary_identification=cv_attrs,
                    alternative_identifications=[],
                    confidence_score=0.3,
                    processing_method="computer_vision_only",
                    detail_level="basic"
                )
                
        except Exception as e:
            logger.error(f"Result combination failed: {e}")
            return EnhancedItemRecognition(
                primary_identification=ItemAttributes(category="unknown", confidence=0.0),
                alternative_identifications=[],
                confidence_score=0.0,
                processing_method="error",
                detail_level="none"
            )


# Global instance
enhanced_cv = AdvancedComputerVision()


# Export functions
async def analyze_image_for_trading_post(image_path: str, 
                                       analysis_type: str = "comprehensive") -> Dict[str, Any]:
    """
    Main entry point for Trading Post image analysis
    """
    return await enhanced_cv.analyze_image_advanced(image_path, analysis_type)


# Export the enhanced computer vision system
__all__ = [
    'AdvancedComputerVision',
    'WearIndicator', 
    'ItemAttributes',
    'AdvancedConditionAssessment',
    'EnhancedItemRecognition',
    'analyze_image_for_trading_post',
    'enhanced_cv'
]