#!/usr/bin/env python3
"""
Photo-to-Trade Pipeline for Trading Post
Seamless integration: Photo Upload → AI Analysis → Equal Value Matching → Trade Suggestions
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import sqlite3
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import our AI systems
from unified_ai_photo_system import (
    unified_ai_system, PhotoAnalysisRequest, UnifiedAnalysisResult
)
from enhanced_equal_value_matcher import (
    equal_value_engine, EqualValueTradeRequest, TradePreference, 
    EqualValueMatch, PhotoBasedItemData
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI router
router = APIRouter(prefix="/api/photo-to-trade", tags=["photo-to-trade-pipeline"])


@dataclass
class PhotoToTradeSession:
    """Complete photo-to-trade session"""
    session_id: str
    user_id: int
    status: str  # 'uploading', 'analyzing', 'matching', 'completed', 'failed'
    current_stage: str
    progress_percentage: float
    
    # Photo analysis
    photo_analysis_session_id: Optional[str] = None
    photo_analysis_result: Optional[UnifiedAnalysisResult] = None
    
    # Trade matching
    trade_matches: Optional[List[Dict[str, Any]]] = None
    total_matches_found: int = 0
    
    # User preferences
    trade_preferences: Optional[Dict[str, Any]] = None
    
    # Metadata
    processing_time: float = 0.0
    error_message: Optional[str] = None
    created_at: datetime = None
    completed_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()


class PhotoToTradePipeline:
    """
    Main pipeline orchestrating photo upload → AI analysis → equal value matching
    """
    
    def __init__(self):
        self.active_sessions = {}
        self.db_path = "trading_post.db"
        self._initialize_database()
        
        # Pipeline stages
        self.pipeline_stages = [
            ("photo_upload", "Uploading and validating photo", 10),
            ("ai_analysis", "Analyzing item with AI", 40),
            ("value_estimation", "Estimating item value", 60),
            ("trade_matching", "Finding equal value trades", 85),
            ("result_preparation", "Preparing trade suggestions", 95),
            ("completed", "Ready to trade", 100)
        ]
        
        # Default trade preferences
        self.default_trade_preferences = {
            "trade_preference": TradePreference.WITHIN_PERCENT,
            "max_value_difference_percent": 15.0,
            "max_distance_km": 50.0,
            "include_cash_adjustments": True,
            "preferred_categories": [],
            "excluded_categories": [],
            "minimum_user_rating": 4.0,
            "require_photo_verification": True
        }
    
    def _initialize_database(self):
        """Initialize database tables for photo-to-trade pipeline"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Photo-to-trade sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS photo_to_trade_sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'uploading',
                    current_stage TEXT DEFAULT 'photo_upload',
                    progress_percentage REAL DEFAULT 0.0,
                    
                    photo_analysis_session_id TEXT,
                    photo_analysis_result TEXT,
                    
                    trade_matches TEXT,
                    total_matches_found INTEGER DEFAULT 0,
                    trade_preferences TEXT,
                    
                    processing_time REAL DEFAULT 0.0,
                    error_message TEXT,
                    
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    
                    FOREIGN KEY (photo_analysis_session_id) REFERENCES unified_analysis_sessions (id)
                )
            """)
            
            # Quick trade suggestions cache
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quick_trade_suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    match_id TEXT NOT NULL,
                    suggestion_rank INTEGER,
                    suggestion_score REAL,
                    suggestion_reasoning TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                    FOREIGN KEY (session_id) REFERENCES photo_to_trade_sessions (id),
                    FOREIGN KEY (match_id) REFERENCES equal_value_matches (id)
                )
            """)
            
            conn.commit()
            conn.close()
            
            logger.info("Photo-to-trade pipeline database initialized")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
    
    async def start_photo_to_trade_session(self, image_file: UploadFile, 
                                         user_id: int,
                                         trade_preferences: Optional[Dict[str, Any]] = None) -> str:
        """
        Start complete photo-to-trade session
        """
        try:
            # Generate session ID
            session_id = str(uuid.uuid4())
            
            # Merge user preferences with defaults
            final_preferences = {**self.default_trade_preferences}
            if trade_preferences:
                final_preferences.update(trade_preferences)
            
            # Create session
            session = PhotoToTradeSession(
                session_id=session_id,
                user_id=user_id,
                status='uploading',
                current_stage='photo_upload',
                progress_percentage=10.0,
                trade_preferences=final_preferences
            )
            
            self.active_sessions[session_id] = session
            
            # Store in database
            await self._store_session(session)
            
            # Start background processing
            asyncio.create_task(self._process_photo_to_trade_pipeline(session, image_file))
            
            logger.info(f"Started photo-to-trade session: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to start photo-to-trade session: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def _process_photo_to_trade_pipeline(self, session: PhotoToTradeSession, 
                                             image_file: UploadFile):
        """
        Complete photo-to-trade processing pipeline
        """
        start_time = time.time()
        
        try:
            # Stage 1: Photo AI Analysis
            await self._update_progress(session, "ai_analysis", 40)
            
            photo_analysis_request = PhotoAnalysisRequest(
                user_id=session.user_id,
                analysis_depth="comprehensive",
                include_pricing=True,
                include_market_data=True
            )
            
            session.photo_analysis_session_id = await unified_ai_system.start_photo_analysis(
                image_file, photo_analysis_request
            )
            
            # Wait for photo analysis to complete
            await self._wait_for_photo_analysis(session)
            
            if session.status == 'failed':
                return
            
            # Stage 2: Value Estimation Complete
            await self._update_progress(session, "value_estimation", 60)
            
            # Get the completed photo analysis
            session.photo_analysis_result = await unified_ai_system.get_analysis_results(
                session.photo_analysis_session_id
            )
            
            # Stage 3: Equal Value Trade Matching
            await self._update_progress(session, "trade_matching", 85)
            
            trade_request = EqualValueTradeRequest(
                photo_analysis_session_id=session.photo_analysis_session_id,
                user_id=session.user_id,
                trade_preference=TradePreference(session.trade_preferences["trade_preference"]),
                max_value_difference_percent=session.trade_preferences["max_value_difference_percent"],
                max_distance_km=session.trade_preferences["max_distance_km"],
                include_cash_adjustments=session.trade_preferences["include_cash_adjustments"],
                preferred_categories=session.trade_preferences["preferred_categories"],
                excluded_categories=session.trade_preferences["excluded_categories"],
                minimum_user_rating=session.trade_preferences["minimum_user_rating"],
                require_photo_verification=session.trade_preferences["require_photo_verification"]
            )
            
            matches = await equal_value_engine.find_equal_value_matches(trade_request)
            
            # Stage 4: Prepare Results
            await self._update_progress(session, "result_preparation", 95)
            
            session.trade_matches = matches
            session.total_matches_found = len(matches)
            
            # Generate quick trade suggestions
            await self._generate_quick_trade_suggestions(session)
            
            # Complete processing
            session.processing_time = time.time() - start_time
            session.status = 'completed'
            session.completed_at = datetime.utcnow()
            
            await self._update_progress(session, "completed", 100)
            await self._finalize_session(session)
            
            logger.info(f"Completed photo-to-trade pipeline {session.session_id} in {session.processing_time:.2f}s - found {session.total_matches_found} matches")
            
        except Exception as e:
            logger.error(f"Photo-to-trade pipeline failed for {session.session_id}: {e}")
            
            session.status = 'failed'
            session.error_message = str(e)
            session.processing_time = time.time() - start_time
            session.completed_at = datetime.utcnow()
            
            await self._finalize_session(session)
    
    async def _wait_for_photo_analysis(self, session: PhotoToTradeSession, 
                                     max_wait_time: int = 300):
        """Wait for photo analysis to complete"""
        start_time = time.time()
        
        while True:
            try:
                # Check if we've exceeded max wait time
                if time.time() - start_time > max_wait_time:
                    session.status = 'failed'
                    session.error_message = "Photo analysis timeout"
                    return
                
                # Get photo analysis status
                analysis_status = await unified_ai_system.get_session_status(
                    session.photo_analysis_session_id
                )
                
                # Update our progress based on photo analysis progress
                photo_progress = analysis_status.progress_percentage
                our_progress = 10 + (photo_progress * 0.5)  # Map 0-100% to 10-60% of our progress
                session.progress_percentage = our_progress
                session.current_stage = f"ai_analysis: {analysis_status.current_operation}"
                
                # Check if completed
                if analysis_status.status == 'completed':
                    logger.info(f"Photo analysis completed for session {session.session_id}")
                    return
                elif analysis_status.status == 'failed':
                    session.status = 'failed'
                    session.error_message = "Photo analysis failed"
                    return
                
                # Wait before checking again
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error waiting for photo analysis: {e}")
                session.status = 'failed'
                session.error_message = f"Photo analysis monitoring error: {str(e)}"
                return
    
    async def _generate_quick_trade_suggestions(self, session: PhotoToTradeSession):
        """Generate quick trade suggestions for immediate display"""
        try:
            if not session.trade_matches:
                return
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Clear existing suggestions
            cursor.execute("""
                DELETE FROM quick_trade_suggestions WHERE session_id = ?
            """, (session.session_id,))
            
            # Create top suggestions
            for rank, match in enumerate(session.trade_matches[:10], 1):
                suggestion_score = match.get('match_quality_score', 0) * match.get('confidence_score', 0)
                
                # Generate quick reasoning
                value_diff = abs(
                    match['value_analysis'].get('value1', 0) - 
                    match['value_analysis'].get('value2', 0)
                )
                
                quick_reasoning = self._generate_quick_reasoning(match, value_diff)
                
                cursor.execute("""
                    INSERT INTO quick_trade_suggestions 
                    (session_id, match_id, suggestion_rank, suggestion_score, suggestion_reasoning)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    session.session_id,
                    match['match_id'],
                    rank,
                    suggestion_score,
                    quick_reasoning
                ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error generating quick trade suggestions: {e}")
    
    def _generate_quick_reasoning(self, match: Dict[str, Any], value_diff: float) -> str:
        """Generate quick reasoning for trade suggestion"""
        try:
            score = match.get('match_quality_score', 0)
            confidence = match.get('confidence_score', 0)
            
            if score > 0.8 and confidence > 0.8:
                return f"Excellent match! Values differ by only ${value_diff:.2f}. High confidence trade."
            elif score > 0.7:
                return f"Great match with ${value_diff:.2f} value difference. Recommended trade."
            elif score > 0.6:
                return f"Good match opportunity. Consider this ${value_diff:.2f} value difference."
            else:
                return f"Potential match with ${value_diff:.2f} difference. Review carefully."
                
        except Exception as e:
            logger.error(f"Error generating quick reasoning: {e}")
            return "Trade match available for review."
    
    async def _update_progress(self, session: PhotoToTradeSession, 
                             stage: str, percentage: float):
        """Update session progress"""
        try:
            session.current_stage = stage
            session.progress_percentage = percentage
            
            # Update in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE photo_to_trade_sessions 
                SET current_stage = ?, progress_percentage = ?, status = ?
                WHERE id = ?
            """, (stage, percentage, session.status, session.session_id))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Progress update failed: {e}")
    
    async def _store_session(self, session: PhotoToTradeSession):
        """Store session in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO photo_to_trade_sessions 
                (id, user_id, status, current_stage, progress_percentage,
                 trade_preferences, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                session.session_id,
                session.user_id,
                session.status,
                session.current_stage,
                session.progress_percentage,
                json.dumps(session.trade_preferences),
                session.created_at.isoformat()
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Session storage failed: {e}")
    
    async def _finalize_session(self, session: PhotoToTradeSession):
        """Finalize session and store complete results"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE photo_to_trade_sessions 
                SET status = ?, 
                    photo_analysis_session_id = ?,
                    photo_analysis_result = ?,
                    trade_matches = ?,
                    total_matches_found = ?,
                    processing_time = ?,
                    error_message = ?,
                    completed_at = ?
                WHERE id = ?
            """, (
                session.status,
                session.photo_analysis_session_id,
                json.dumps(session.photo_analysis_result.__dict__) if session.photo_analysis_result else None,
                json.dumps(session.trade_matches) if session.trade_matches else None,
                session.total_matches_found,
                session.processing_time,
                session.error_message,
                session.completed_at.isoformat() if session.completed_at else None,
                session.session_id
            ))
            
            conn.commit()
            conn.close()
            
            # Schedule cleanup after 2 hours
            if session.status == 'completed':
                asyncio.create_task(self._cleanup_session(session.session_id, delay=7200))
            
        except Exception as e:
            logger.error(f"Session finalization failed: {e}")
    
    async def _cleanup_session(self, session_id: str, delay: int = 7200):
        """Clean up session from memory after delay"""
        try:
            await asyncio.sleep(delay)
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
                logger.info(f"Cleaned up photo-to-trade session {session_id}")
        except Exception as e:
            logger.error(f"Session cleanup failed: {e}")
    
    async def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """Get current session status"""
        try:
            # Check memory first
            if session_id in self.active_sessions:
                session = self.active_sessions[session_id]
                
                return {
                    "session_id": session_id,
                    "status": session.status,
                    "current_stage": session.current_stage,
                    "progress_percentage": session.progress_percentage,
                    "total_matches_found": session.total_matches_found,
                    "processing_time": session.processing_time,
                    "error_message": session.error_message,
                    "photo_analysis_session_id": session.photo_analysis_session_id
                }
            
            # Check database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT status, current_stage, progress_percentage, total_matches_found,
                       processing_time, error_message, photo_analysis_session_id
                FROM photo_to_trade_sessions 
                WHERE id = ?
            """, (session_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                (status, current_stage, progress_percentage, total_matches_found,
                 processing_time, error_message, photo_analysis_session_id) = result
                
                return {
                    "session_id": session_id,
                    "status": status,
                    "current_stage": current_stage,
                    "progress_percentage": progress_percentage,
                    "total_matches_found": total_matches_found,
                    "processing_time": processing_time,
                    "error_message": error_message,
                    "photo_analysis_session_id": photo_analysis_session_id
                }
            else:
                raise HTTPException(status_code=404, detail="Session not found")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Status retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to get session status")
    
    async def get_session_results(self, session_id: str) -> Dict[str, Any]:
        """Get complete session results"""
        try:
            # Check if session is in memory
            session = self.active_sessions.get(session_id)
            
            if not session:
                # Load from database
                session = await self._load_session_from_db(session_id)
            
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            
            if session.status == 'processing' or session.status == 'uploading':
                raise HTTPException(status_code=202, detail="Session still in progress")
            
            if session.status == 'failed':
                raise HTTPException(status_code=500, detail=session.error_message or "Session failed")
            
            # Get quick suggestions
            quick_suggestions = await self._get_quick_suggestions(session_id)
            
            return {
                "session_id": session_id,
                "success": True,
                "photo_analysis": session.photo_analysis_result.__dict__ if session.photo_analysis_result else None,
                "trade_matches": session.trade_matches,
                "total_matches_found": session.total_matches_found,
                "quick_suggestions": quick_suggestions,
                "processing_time": session.processing_time,
                "trade_preferences": session.trade_preferences,
                "created_at": session.created_at.isoformat(),
                "completed_at": session.completed_at.isoformat() if session.completed_at else None
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Results retrieval failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to get session results")
    
    async def _load_session_from_db(self, session_id: str) -> Optional[PhotoToTradeSession]:
        """Load session from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT * FROM photo_to_trade_sessions WHERE id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row:
                return None
            
            # Reconstruct session object (simplified)
            return PhotoToTradeSession(
                session_id=session_id,
                user_id=row[1],
                status=row[2],
                current_stage=row[3],
                progress_percentage=row[4],
                photo_analysis_session_id=row[5],
                total_matches_found=row[7] if row[7] else 0,
                processing_time=row[9] if row[9] else 0.0,
                error_message=row[10]
            )
            
        except Exception as e:
            logger.error(f"Session loading failed: {e}")
            return None
    
    async def _get_quick_suggestions(self, session_id: str) -> List[Dict[str, Any]]:
        """Get quick trade suggestions for session"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT match_id, suggestion_rank, suggestion_score, suggestion_reasoning
                FROM quick_trade_suggestions 
                WHERE session_id = ?
                ORDER BY suggestion_rank
            """, (session_id,))
            
            rows = cursor.fetchall()
            conn.close()
            
            return [
                {
                    "match_id": row[0],
                    "rank": row[1],
                    "score": row[2],
                    "reasoning": row[3]
                }
                for row in rows
            ]
            
        except Exception as e:
            logger.error(f"Error getting quick suggestions: {e}")
            return []


# Global pipeline instance
photo_to_trade_pipeline = PhotoToTradePipeline()


# Request/Response Models
class PhotoToTradeRequest(BaseModel):
    """Request for photo-to-trade pipeline"""
    trade_preference: str = "within_percent"
    max_value_difference_percent: float = Field(default=15.0, ge=1.0, le=50.0)
    max_distance_km: float = Field(default=50.0, ge=1.0, le=500.0)
    include_cash_adjustments: bool = True
    preferred_categories: Optional[List[str]] = None
    excluded_categories: Optional[List[str]] = None
    minimum_user_rating: float = Field(default=4.0, ge=1.0, le=5.0)
    require_photo_verification: bool = True


class PhotoToTradeStatusResponse(BaseModel):
    """Response for photo-to-trade status"""
    session_id: str
    status: str
    current_stage: str
    progress_percentage: float
    total_matches_found: int
    processing_time: float
    error_message: Optional[str] = None
    photo_analysis_session_id: Optional[str] = None


class PhotoToTradeResultResponse(BaseModel):
    """Response for photo-to-trade results"""
    session_id: str
    success: bool
    photo_analysis: Optional[Dict[str, Any]] = None
    trade_matches: Optional[List[Dict[str, Any]]] = None
    total_matches_found: int
    quick_suggestions: List[Dict[str, Any]]
    processing_time: float
    trade_preferences: Dict[str, Any]
    created_at: str
    completed_at: Optional[str] = None


# API Endpoints
@router.post("/start", response_model=Dict[str, str])
async def start_photo_to_trade(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    user_id: int = Form(...),
    trade_preference: str = Form("within_percent"),
    max_value_difference_percent: float = Form(15.0),
    max_distance_km: float = Form(50.0),
    include_cash_adjustments: bool = Form(True),
    minimum_user_rating: float = Form(4.0),
    require_photo_verification: bool = Form(True)
):
    """
    Start complete photo-to-trade pipeline
    Upload photo → AI analysis → Find equal value trades
    """
    try:
        trade_preferences = {
            "trade_preference": trade_preference,
            "max_value_difference_percent": max_value_difference_percent,
            "max_distance_km": max_distance_km,
            "include_cash_adjustments": include_cash_adjustments,
            "minimum_user_rating": minimum_user_rating,
            "require_photo_verification": require_photo_verification
        }
        
        session_id = await photo_to_trade_pipeline.start_photo_to_trade_session(
            photo, user_id, trade_preferences
        )
        
        return {
            "session_id": session_id,
            "status": "started",
            "message": "Photo-to-trade pipeline started successfully"
        }
        
    except Exception as e:
        logger.error(f"Photo-to-trade start failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{session_id}", response_model=PhotoToTradeStatusResponse)
async def get_photo_to_trade_status(session_id: str):
    """
    Get current photo-to-trade pipeline status
    """
    status_data = await photo_to_trade_pipeline.get_session_status(session_id)
    return PhotoToTradeStatusResponse(**status_data)


@router.get("/results/{session_id}", response_model=PhotoToTradeResultResponse)
async def get_photo_to_trade_results(session_id: str):
    """
    Get complete photo-to-trade results
    """
    results_data = await photo_to_trade_pipeline.get_session_results(session_id)
    return PhotoToTradeResultResponse(**results_data)


@router.get("/quick-suggestions/{session_id}")
async def get_quick_trade_suggestions(session_id: str):
    """
    Get quick trade suggestions for immediate display
    """
    try:
        suggestions = await photo_to_trade_pipeline._get_quick_suggestions(session_id)
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Error getting quick suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pipeline-info")
async def get_pipeline_info():
    """
    Get information about the photo-to-trade pipeline stages
    """
    return {
        "pipeline_stages": [
            {
                "stage": "photo_upload",
                "description": "Uploading and validating photo",
                "typical_duration": "2-5 seconds"
            },
            {
                "stage": "ai_analysis", 
                "description": "AI-powered item recognition and condition analysis",
                "typical_duration": "15-30 seconds"
            },
            {
                "stage": "value_estimation",
                "description": "Estimating item value using market data",
                "typical_duration": "5-10 seconds"
            },
            {
                "stage": "trade_matching",
                "description": "Finding equal value trade opportunities",
                "typical_duration": "10-20 seconds"
            },
            {
                "stage": "result_preparation",
                "description": "Preparing personalized trade suggestions",
                "typical_duration": "2-5 seconds"
            }
        ],
        "total_typical_duration": "30-70 seconds",
        "features": [
            "AI-powered item recognition",
            "Automatic wear and condition assessment", 
            "Real-time market value estimation",
            "Equal value trade matching",
            "Geographic proximity filtering",
            "User preference customization",
            "Real-time progress tracking"
        ]
    }


# Export the photo-to-trade pipeline
__all__ = [
    'PhotoToTradePipeline',
    'PhotoToTradeSession',
    'photo_to_trade_pipeline',
    'router'
]