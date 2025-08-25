#!/usr/bin/env python3
"""
Unified AI Photo Processing System for Trading Post
Complete integration of computer vision, wear detection, and price estimation
"""

import os
import json
import asyncio
import logging
import uuid
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import sqlite3
import aiofiles
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Import our enhanced AI modules
from enhanced_computer_vision import (
    enhanced_cv, analyze_image_for_trading_post, 
    ItemAttributes, AdvancedConditionAssessment, EnhancedItemRecognition
)
from ml_wear_detection import (
    ml_wear_detector, detect_wear_with_ml, 
    WearIndicator, add_user_feedback
)
from advanced_price_estimation import (
    advanced_price_engine, estimate_price_advanced, validate_user_price,
    AdvancedPriceEstimate, PriceValidation
)
from memory_optimized_image_processing import (
    ai_processor, memory_safe_image_processing, get_memory_stats
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI router
router = APIRouter(prefix="/api/ai-photo", tags=["ai-photo-pricing"])


@dataclass
class UnifiedAnalysisSession:
    """Complete AI analysis session"""
    session_id: str
    user_id: Optional[int]
    image_path: str
    status: str  # 'processing', 'completed', 'failed'
    progress_stage: str
    progress_percentage: float
    
    # Analysis results
    item_recognition: Optional[EnhancedItemRecognition] = None
    condition_assessment: Optional[AdvancedConditionAssessment] = None
    wear_detection: Optional[List[WearIndicator]] = None
    price_estimate: Optional[AdvancedPriceEstimate] = None
    
    # Metadata
    processing_time: float = 0.0
    confidence_score: float = 0.0
    error_message: Optional[str] = None
    created_at: datetime = None
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


# Request/Response Models
class PhotoAnalysisRequest(BaseModel):
    """Request for photo analysis"""
    user_id: Optional[int] = None
    analysis_depth: str = Field(default="comprehensive", regex="^(quick|standard|comprehensive|expert)$")
    include_pricing: bool = True
    include_market_data: bool = True
    user_context: Optional[Dict[str, Any]] = None


class AnalysisProgress(BaseModel):
    """Analysis progress response"""
    session_id: str
    status: str
    progress_stage: str
    progress_percentage: float
    estimated_completion: Optional[str] = None
    current_operation: Optional[str] = None


class UnifiedAnalysisResult(BaseModel):
    """Complete analysis result"""
    session_id: str
    success: bool
    
    # Core results
    item_identification: Dict[str, Any]
    condition_assessment: Dict[str, Any]
    wear_analysis: Dict[str, Any]
    price_analysis: Dict[str, Any]
    
    # Meta information
    confidence_score: float
    processing_time: float
    analysis_depth: str
    recommendations: List[str]
    
    # Market insights
    market_position: Optional[str] = None
    selling_recommendations: List[str] = []
    timing_advice: Optional[str] = None


class PriceValidationRequest(BaseModel):
    """Request for price validation"""
    session_id: str
    user_suggested_price: float
    listing_context: Optional[Dict[str, Any]] = None


class FeedbackRequest(BaseModel):
    """User feedback for model improvement"""
    session_id: str
    user_rating: int = Field(ge=1, le=5)
    accuracy_feedback: Dict[str, Any]
    price_feedback: Optional[Dict[str, Any]] = None
    general_comments: Optional[str] = None


class UnifiedAIPhotoSystem:
    """
    Unified system that orchestrates all AI photo processing components
    """
    
    def __init__(self):
        self.active_sessions = {}
        self.db_path = "trading_post.db"
        self._initialize_database()
        
        # Processing stages for progress tracking
        self.processing_stages = [
            ("upload_validation", "Validating uploaded image", 5),
            ("image_preprocessing", "Preprocessing image for analysis", 10),
            ("item_recognition", "Identifying item using AI vision", 25),
            ("condition_assessment", "Analyzing item condition", 40),
            ("wear_detection", "Detecting wear patterns with ML", 55),
            ("market_research", "Gathering market data", 70),
            ("price_estimation", "Calculating price estimate", 85),
            ("result_synthesis", "Finalizing analysis results", 95),
            ("completed", "Analysis complete", 100)
        ]
    
    def _initialize_database(self):
        """Initialize database tables for unified system"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create unified analysis sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS unified_analysis_sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER,
                    image_path TEXT NOT NULL,
                    status TEXT DEFAULT 'processing',
                    progress_stage TEXT DEFAULT 'upload_validation',
                    progress_percentage REAL DEFAULT 0.0,
                    
                    item_recognition TEXT,
                    condition_assessment TEXT,
                    wear_detection TEXT,
                    price_estimate TEXT,
                    
                    processing_time REAL DEFAULT 0.0,
                    confidence_score REAL DEFAULT 0.0,
                    error_message TEXT,
                    
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    
                    analysis_depth TEXT DEFAULT 'standard',
                    user_context TEXT
                )
            """)
            
            # Create user feedback table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_user_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    user_rating INTEGER,
                    accuracy_feedback TEXT,
                    price_feedback TEXT,
                    general_comments TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (session_id) REFERENCES unified_analysis_sessions (id)
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("Unified AI system database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    async def start_photo_analysis(self, image_file: UploadFile, 
                                 request: PhotoAnalysisRequest) -> str:
        """
        Start comprehensive photo analysis
        """
        try:
            # Generate session ID
            session_id = str(uuid.uuid4())
            
            # Validate and save image
            image_path = await self._save_uploaded_image(image_file, session_id)
            
            # Create analysis session
            session = UnifiedAnalysisSession(
                session_id=session_id,
                user_id=request.user_id,
                image_path=image_path,
                status='processing',
                progress_stage='upload_validation',
                progress_percentage=5.0
            )
            
            self.active_sessions[session_id] = session
            
            # Store in database
            await self._store_session(session, request)
            
            # Start background processing
            asyncio.create_task(self._process_photo_comprehensive(session, request))
            
            logger.info(f"Started unified photo analysis: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to start photo analysis: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _save_uploaded_image(self, image_file: UploadFile, session_id: str) -> str:
        """Save uploaded image with validation"""
        try:
            # Validate file
            if not image_file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            if image_file.size > 10 * 1024 * 1024:  # 10MB limit
                raise HTTPException(status_code=413, detail="Image too large (max 10MB)")
            
            # Create upload directory
            upload_dir = "uploads/unified_ai"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save image
            file_extension = image_file.filename.split('.')[-1] if '.' in image_file.filename else 'jpg'
            image_filename = f"{session_id}.{file_extension}"
            image_path = os.path.join(upload_dir, image_filename)
            
            async with aiofiles.open(image_path, 'wb') as f:
                content = await image_file.read()
                await f.write(content)
            
            logger.info(f"Saved image: {image_path}")
            return image_path
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Image save failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to save image")
    
    async def _store_session(self, session: UnifiedAnalysisSession, 
                           request: PhotoAnalysisRequest):
        """Store session in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO unified_analysis_sessions 
                (id, user_id, image_path, status, progress_stage, progress_percentage,
                 analysis_depth, user_context, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session.session_id,
                session.user_id,
                session.image_path,
                session.status,
                session.progress_stage,
                session.progress_percentage,
                request.analysis_depth,
                json.dumps(request.user_context) if request.user_context else None,
                session.created_at.isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Session storage failed: {e}")
    
    async def _process_photo_comprehensive(self, session: UnifiedAnalysisSession,
                                         request: PhotoAnalysisRequest):
        """
        Comprehensive photo processing pipeline
        """
        start_time = time.time()
        
        try:
            # Stage 1: Image preprocessing
            await self._update_progress(session, "image_preprocessing", 10)
            image = await self._preprocess_image(session.image_path)
            
            # Stage 2: Item recognition
            await self._update_progress(session, "item_recognition", 25)
            session.item_recognition = await self._perform_item_recognition(
                image, session.image_path, request.analysis_depth
            )
            
            # Stage 3: Condition assessment and wear detection
            await self._update_progress(session, "condition_assessment", 40)
            session.condition_assessment = await self._assess_condition(
                image, session.image_path, request.analysis_depth
            )
            
            await self._update_progress(session, "wear_detection", 55)
            session.wear_detection = await self._detect_wear_ml(
                image, session.image_path
            )
            
            # Stage 4: Price estimation (if requested)
            if request.include_pricing:
                await self._update_progress(session, "market_research", 70)
                await self._update_progress(session, "price_estimation", 85)
                
                session.price_estimate = await self._estimate_price(
                    session.item_recognition.primary_identification,
                    session.condition_assessment,
                    session.wear_detection,
                    request.user_context
                )
            
            # Stage 5: Finalize results
            await self._update_progress(session, "result_synthesis", 95)
            
            # Calculate overall confidence
            session.confidence_score = await self._calculate_overall_confidence(session)
            
            # Complete processing
            session.processing_time = time.time() - start_time
            session.status = 'completed'
            session.completed_at = datetime.utcnow()
            
            await self._update_progress(session, "completed", 100)
            await self._finalize_session(session)
            
            logger.info(f"Completed unified analysis {session.session_id} in {session.processing_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Photo processing failed for {session.session_id}: {e}")
            
            session.status = 'failed'
            session.error_message = str(e)
            session.processing_time = time.time() - start_time
            session.completed_at = datetime.utcnow()
            
            await self._finalize_session(session)
    
    async def _preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for analysis"""
        try:
            with memory_safe_image_processing():
                # Use the memory-optimized preprocessor
                processed_path = await ai_processor.preprocess_image_for_ai(image_path)
                
                # Load processed image
                image = cv2.imread(processed_path)
                if image is None:
                    raise ValueError("Could not load processed image")
                
                # Convert BGR to RGB
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                
                return image_rgb
                
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise
    
    async def _perform_item_recognition(self, image: np.ndarray, 
                                      image_path: str, 
                                      analysis_depth: str) -> EnhancedItemRecognition:
        """Perform item recognition using enhanced computer vision"""
        try:
            # Use the enhanced computer vision system
            cv_results = await analyze_image_for_trading_post(image_path, analysis_depth)
            
            if cv_results.get('success', False):
                return cv_results['item_recognition']
            else:
                raise ValueError("Item recognition failed")
                
        except Exception as e:
            logger.error(f"Item recognition failed: {e}")
            # Return fallback recognition
            return EnhancedItemRecognition(
                primary_identification=ItemAttributes(category="unknown", confidence=0.1),
                alternative_identifications=[],
                confidence_score=0.1,
                processing_method="error_fallback",
                detail_level="none"
            )
    
    async def _assess_condition(self, image: np.ndarray, 
                              image_path: str,
                              analysis_depth: str) -> AdvancedConditionAssessment:
        """Assess item condition using enhanced computer vision"""
        try:
            cv_results = await analyze_image_for_trading_post(image_path, analysis_depth)
            
            if cv_results.get('success', False) and 'condition_assessment' in cv_results:
                return cv_results['condition_assessment']
            else:
                raise ValueError("Condition assessment failed")
                
        except Exception as e:
            logger.error(f"Condition assessment failed: {e}")
            # Return fallback assessment
            return AdvancedConditionAssessment(
                overall_condition="unknown",
                condition_score=5.0,
                wear_indicators=[],
                aesthetic_score=5.0,
                functional_score=5.0,
                marketability_score=5.0,
                detailed_notes="Assessment failed due to technical error",
                confidence=0.1,
                processing_time=0.0
            )
    
    async def _detect_wear_ml(self, image: np.ndarray, 
                            image_path: str) -> List[WearIndicator]:
        """Detect wear using ML system"""
        try:
            return await detect_wear_with_ml(image, image_path)
        except Exception as e:
            logger.error(f"ML wear detection failed: {e}")
            return []
    
    async def _estimate_price(self, item_attributes: ItemAttributes,
                            condition_assessment: AdvancedConditionAssessment,
                            wear_indicators: List[WearIndicator],
                            user_context: Optional[Dict]) -> AdvancedPriceEstimate:
        """Estimate price using advanced pricing engine"""
        try:
            return await estimate_price_advanced(
                item_attributes, condition_assessment, wear_indicators, user_context
            )
        except Exception as e:
            logger.error(f"Price estimation failed: {e}")
            # Return fallback estimate
            from advanced_price_estimation import AdvancedPriceEstimate
            return AdvancedPriceEstimate(
                estimated_price=50.0,
                price_range_min=30.0,
                price_range_max=80.0,
                confidence_score=0.2,
                market_analysis={},
                condition_impact={},
                brand_premium=0.0,
                rarity_factor=1.0,
                market_trends={},
                comparable_sales=[],
                pricing_factors={},
                valuation_method="error_fallback",
                data_freshness="error"
            )
    
    async def _calculate_overall_confidence(self, session: UnifiedAnalysisSession) -> float:
        """Calculate overall confidence score"""
        try:
            confidences = []
            
            if session.item_recognition:
                confidences.append(session.item_recognition.confidence_score)
            
            if session.condition_assessment:
                confidences.append(session.condition_assessment.confidence)
            
            if session.price_estimate:
                confidences.append(session.price_estimate.confidence_score)
            
            if confidences:
                return sum(confidences) / len(confidences)
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Confidence calculation failed: {e}")
            return 0.0
    
    async def _update_progress(self, session: UnifiedAnalysisSession, 
                             stage: str, percentage: float):
        """Update session progress"""
        try:
            session.progress_stage = stage
            session.progress_percentage = percentage
            
            # Update in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE unified_analysis_sessions 
                SET progress_stage = ?, progress_percentage = ?
                WHERE id = ?
            """, (stage, percentage, session.session_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Progress update failed: {e}")
    
    async def _finalize_session(self, session: UnifiedAnalysisSession):
        """Finalize session and store complete results"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE unified_analysis_sessions 
                SET status = ?, 
                    item_recognition = ?,
                    condition_assessment = ?,
                    wear_detection = ?,
                    price_estimate = ?,
                    processing_time = ?,
                    confidence_score = ?,
                    error_message = ?,
                    completed_at = ?
                WHERE id = ?
            """, (
                session.status,
                json.dumps(asdict(session.item_recognition)) if session.item_recognition else None,
                json.dumps(asdict(session.condition_assessment)) if session.condition_assessment else None,
                json.dumps([asdict(w) for w in session.wear_detection]) if session.wear_detection else None,
                json.dumps(asdict(session.price_estimate)) if session.price_estimate else None,
                session.processing_time,
                session.confidence_score,
                session.error_message,
                session.completed_at.isoformat() if session.completed_at else None,
                session.session_id
            ))
            
            conn.commit()
            conn.close()
            
            # Keep session in memory for a while for quick access
            if session.status == 'completed':
                # Schedule cleanup after 1 hour
                asyncio.create_task(self._cleanup_session(session.session_id, delay=3600))
            
        except Exception as e:
            logger.error(f"Session finalization failed: {e}")
    
    async def _cleanup_session(self, session_id: str, delay: int = 3600):
        """Clean up session from memory after delay"""
        try:
            await asyncio.sleep(delay)
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
                logger.info(f"Cleaned up session {session_id}")
        except Exception as e:
            logger.error(f"Session cleanup failed: {e}")
    
    async def get_session_status(self, session_id: str) -> AnalysisProgress:
        """Get current session status"""
        try:
            # Check memory first
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                
                # Estimate completion time
                estimated_completion = None
                if session.status == 'processing' and session.progress_percentage > 0:
                    elapsed = (datetime.utcnow() - session.created_at).total_seconds()
                    if session.progress_percentage > 5:
                        estimated_total = elapsed * (100 / session.progress_percentage)
                        remaining = estimated_total - elapsed
                        estimated_completion = (datetime.utcnow() + timedelta(seconds=remaining)).isoformat()
                
                return AnalysisProgress(
                    session_id=session_id,
                    status=session.status,
                    progress_stage=session.progress_stage,
                    progress_percentage=session.progress_percentage,
                    estimated_completion=estimated_completion,
                    current_operation=self._get_stage_description(session.progress_stage)
                )
            
            # Check database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status, progress_stage, progress_percentage
                FROM unified_analysis_sessions 
                WHERE id = ?
            """, (session_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                status, progress_stage, progress_percentage = result
                return AnalysisProgress(
                    session_id=session_id,
                    status=status,
                    progress_stage=progress_stage,
                    progress_percentage=progress_percentage,
                    current_operation=self._get_stage_description(progress_stage)
                )
            else:
                raise HTTPException(status_code=404, detail="Session not found")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Status retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to get session status")
    
    def _get_stage_description(self, stage: str) -> str:
        """Get human-readable description of processing stage"""
        stage_descriptions = {
            'upload_validation': 'Validating uploaded image',
            'image_preprocessing': 'Optimizing image for AI analysis',
            'item_recognition': 'Identifying item using computer vision',
            'condition_assessment': 'Analyzing condition and quality',
            'wear_detection': 'Detecting wear patterns with machine learning',
            'market_research': 'Researching market prices',
            'price_estimation': 'Calculating estimated value',
            'result_synthesis': 'Preparing final results',
            'completed': 'Analysis complete'
        }
        return stage_descriptions.get(stage, 'Processing...')
    
    async def get_analysis_results(self, session_id: str) -> UnifiedAnalysisResult:
        """Get complete analysis results"""
        try:
            # Check if session is in memory
            session = self.active_sessions.get(session_id)
            
            if not session:
                # Load from database
                session = await self._load_session_from_db(session_id)
            
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            if session.status == 'processing':
                raise HTTPException(status_code=202, detail="Analysis still in progress")
            
            if session.status == 'failed':
                raise HTTPException(status_code=500, detail=session.error_message or "Analysis failed")
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(session)
            
            # Generate selling advice
            selling_recommendations = await self._generate_selling_advice(session)
            
            # Generate timing advice
            timing_advice = await self._generate_timing_advice(session)
            
            # Prepare response
            result = UnifiedAnalysisResult(
                session_id=session_id,
                success=True,
                item_identification=asdict(session.item_recognition) if session.item_recognition else {},
                condition_assessment=asdict(session.condition_assessment) if session.condition_assessment else {},
                wear_analysis={
                    'wear_indicators': [asdict(w) for w in session.wear_detection] if session.wear_detection else [],
                    'total_wear_count': len(session.wear_detection) if session.wear_detection else 0
                },
                price_analysis=asdict(session.price_estimate) if session.price_estimate else {},
                confidence_score=session.confidence_score,
                processing_time=session.processing_time,
                analysis_depth="comprehensive",  # From request context
                recommendations=recommendations,
                market_position=session.price_estimate.market_analysis.get('position') if session.price_estimate else None,
                selling_recommendations=selling_recommendations,
                timing_advice=timing_advice
            )
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Results retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to get analysis results")
    
    async def _load_session_from_db(self, session_id: str) -> Optional[UnifiedAnalysisSession]:
        """Load session from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM unified_analysis_sessions WHERE id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            # Reconstruct session object
            columns = [description[0] for description in cursor.description]
            data = dict(zip(columns, row))
            
            session = UnifiedAnalysisSession(
                session_id=data['id'],
                user_id=data['user_id'],
                image_path=data['image_path'],
                status=data['status'],
                progress_stage=data['progress_stage'],
                progress_percentage=data['progress_percentage'],
                processing_time=data['processing_time'],
                confidence_score=data['confidence_score'],
                error_message=data['error_message'],
                created_at=datetime.fromisoformat(data['created_at']),
                completed_at=datetime.fromisoformat(data['completed_at']) if data['completed_at'] else None
            )
            
            # Deserialize complex objects
            if data['item_recognition']:
                # Would need proper deserialization logic here
                pass
            
            return session
            
        except Exception as e:
            logger.error(f"Session loading failed: {e}")
            return None
    
    async def _generate_recommendations(self, session: UnifiedAnalysisSession) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        try:
            if session.condition_assessment:
                condition_score = session.condition_assessment.condition_score
                
                if condition_score < 5:
                    recommendations.append("Consider improving item condition before listing")
                elif condition_score > 8:
                    recommendations.append("Highlight excellent condition in your listing")
            
            if session.wear_detection and len(session.wear_detection) > 3:
                recommendations.append("Be transparent about wear indicators in listing description")
            
            if session.price_estimate:
                confidence = session.price_estimate.confidence_score
                if confidence < 0.5:
                    recommendations.append("Price estimate has low confidence - consider getting second opinion")
                elif confidence > 0.8:
                    recommendations.append("Price estimate is highly reliable based on market data")
            
            if not recommendations:
                recommendations.append("Item appears ready for listing")
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            recommendations.append("Unable to generate specific recommendations")
        
        return recommendations
    
    async def _generate_selling_advice(self, session: UnifiedAnalysisSession) -> List[str]:
        """Generate selling advice"""
        advice = []
        
        try:
            if session.item_recognition and session.item_recognition.primary_identification.brand:
                advice.append(f"Emphasize {session.item_recognition.primary_identification.brand} brand in title")
            
            if session.condition_assessment and session.condition_assessment.overall_condition in ['excellent', 'mint']:
                advice.append("Use high-quality photos to showcase excellent condition")
            
            if session.price_estimate and len(session.price_estimate.comparable_sales) > 5:
                advice.append("Strong market data supports competitive pricing")
            
        except Exception as e:
            logger.error(f"Selling advice generation failed: {e}")
        
        return advice or ["Standard listing practices recommended"]
    
    async def _generate_timing_advice(self, session: UnifiedAnalysisSession) -> Optional[str]:
        """Generate timing advice for selling"""
        try:
            if session.price_estimate and session.price_estimate.market_trends:
                trend = session.price_estimate.market_trends.get('trend_direction', 'stable')
                
                if trend == 'increasing':
                    return "Market trends suggest good timing for selling"
                elif trend == 'decreasing':
                    return "Consider listing soon as market may be softening"
                else:
                    return "Market conditions are stable for selling"
            
        except Exception as e:
            logger.error(f"Timing advice generation failed: {e}")
        
        return None
    
    async def validate_suggested_price(self, session_id: str, 
                                     user_price: float) -> PriceValidation:
        """Validate user's suggested price"""
        try:
            session = self.active_sessions.get(session_id)
            if not session:
                session = await self._load_session_from_db(session_id)
            
            if not session or not session.price_estimate:
                raise HTTPException(status_code=404, detail="Price estimate not available")
            
            item_attributes = session.item_recognition.primary_identification if session.item_recognition else None
            
            if not item_attributes:
                raise HTTPException(status_code=400, detail="Item identification required for validation")
            
            return await validate_user_price(user_price, item_attributes, session.price_estimate)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Price validation failed: {e}")
            raise HTTPException(status_code=500, detail="Price validation failed")
    
    async def submit_feedback(self, feedback: FeedbackRequest) -> Dict[str, str]:
        """Submit user feedback for model improvement"""
        try:
            # Store feedback in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO ai_user_feedback 
                (session_id, user_rating, accuracy_feedback, price_feedback, general_comments)
                VALUES (?, ?, ?, ?, ?)
            """, (
                feedback.session_id,
                feedback.user_rating,
                json.dumps(feedback.accuracy_feedback),
                json.dumps(feedback.price_feedback) if feedback.price_feedback else None,
                feedback.general_comments
            ))
            
            conn.commit()
            conn.close()
            
            # Use feedback for model improvement
            if feedback.accuracy_feedback.get('condition_rating'):
                # Add training example for wear detection
                session = await self._load_session_from_db(feedback.session_id)
                if session:
                    await add_user_feedback(
                        session.image_path,
                        feedback.accuracy_feedback.get('condition_rating', 'good'),
                        feedback.accuracy_feedback.get('condition_score', 7.0),
                        feedback.general_comments or ""
                    )
            
            logger.info(f"Received feedback for session {feedback.session_id}")
            
            return {"status": "success", "message": "Feedback received and will improve future analysis"}
            
        except Exception as e:
            logger.error(f"Feedback submission failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to submit feedback")


# Global unified system instance
unified_ai_system = UnifiedAIPhotoSystem()


# API Endpoints
@router.post("/analyze", response_model=Dict[str, str])
async def start_photo_analysis(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    user_id: Optional[int] = Form(None),
    analysis_depth: str = Form("comprehensive"),
    include_pricing: bool = Form(True),
    include_market_data: bool = Form(True)
):
    """
    Start comprehensive AI photo analysis
    """
    try:
        request = PhotoAnalysisRequest(
            user_id=user_id,
            analysis_depth=analysis_depth,
            include_pricing=include_pricing,
            include_market_data=include_market_data
        )
        
        session_id = await unified_ai_system.start_photo_analysis(photo, request)
        
        return {
            "session_id": session_id,
            "status": "processing",
            "message": "Analysis started successfully"
        }
        
    except Exception as e:
        logger.error(f"Analysis start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{session_id}", response_model=AnalysisProgress)
async def get_analysis_status(session_id: str):
    """
    Get current analysis progress
    """
    return await unified_ai_system.get_session_status(session_id)


@router.get("/results/{session_id}", response_model=UnifiedAnalysisResult)
async def get_analysis_results(session_id: str):
    """
    Get complete analysis results
    """
    return await unified_ai_system.get_analysis_results(session_id)


@router.post("/validate-price/{session_id}", response_model=PriceValidation)
async def validate_price(session_id: str, request: PriceValidationRequest):
    """
    Validate user's suggested price
    """
    return await unified_ai_system.validate_suggested_price(session_id, request.user_suggested_price)


@router.post("/feedback", response_model=Dict[str, str])
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit user feedback for model improvement
    """
    return await unified_ai_system.submit_feedback(feedback)


@router.get("/system-stats")
async def get_system_stats():
    """
    Get system performance statistics
    """
    try:
        memory_stats = get_memory_stats()
        ml_performance = await ml_wear_detector.get_model_performance()
        
        active_sessions = len(unified_ai_system.active_sessions)
        
        return {
            "active_sessions": active_sessions,
            "memory_stats": memory_stats,
            "ml_performance": ml_performance,
            "system_status": "operational"
        }
        
    except Exception as e:
        logger.error(f"System stats failed: {e}")
        return {"error": str(e)}


# Export the unified AI system
__all__ = [
    'UnifiedAIPhotoSystem',
    'UnifiedAnalysisSession',
    'UnifiedAnalysisResult',
    'AnalysisProgress',
    'PriceValidationRequest',
    'FeedbackRequest',
    'unified_ai_system',
    'router'
]