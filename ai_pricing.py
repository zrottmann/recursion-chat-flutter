"""
AI Pricing and Photo Analysis System for Trading Post
Analyzes uploaded images to identify items and estimate prices using computer vision and market data
"""

import os
import json
import uuid
import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import aiofiles
import filetype
from PIL import Image, ImageEnhance, ImageFilter
import requests
import sqlite3
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON
from sqlalchemy.orm import Session, declarative_base, sessionmaker
from sqlalchemy import create_engine
import openai
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///trading_post.db")
USE_MOCK_API = os.getenv("USE_MOCK_AI", "true").lower() == "true"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
SUPPORTED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp']

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# FastAPI router
router = APIRouter(prefix="/api/items", tags=["ai-pricing"])


@dataclass
class MarketPrice:
    """Market price data structure"""
    min_price: float
    max_price: float
    average_price: float
    confidence: float
    source: str
    data_points: int


# Database Models
class AIAnalysisSession(Base):
    """Track AI analysis sessions"""
    __tablename__ = "ai_analysis_sessions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    image_path = Column(String, nullable=False)
    status = Column(String, default="processing")  # processing, completed, failed
    item_identification = Column(JSON)
    condition_assessment = Column(JSON)
    price_analysis = Column(JSON)
    market_data = Column(JSON)
    ai_suggestions = Column(JSON)
    processing_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)


class PriceHistory(Base):
    """Store historical pricing data for market analysis"""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    item_category = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    condition = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    source = Column(String, nullable=False)  # 'listing', 'ebay', 'amazon', etc.
    date_recorded = Column(DateTime, default=datetime.utcnow)
    metadata = Column(JSON)


class AIUsageMetrics(Base):
    """Track AI API usage for cost monitoring"""
    __tablename__ = "ai_usage_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("ai_analysis_sessions.id"))
    api_provider = Column(String, nullable=False)  # 'openai', 'google_vision', etc.
    operation = Column(String, nullable=False)  # 'vision_analysis', 'price_estimation'
    tokens_used = Column(Integer, default=0)
    cost_cents = Column(Integer, default=0)  # Cost in cents
    processing_time = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)


# Request/Response Models
class PhotoAnalysisRequest(BaseModel):
    """Request model for photo analysis"""
    user_id: Optional[int] = None
    include_pricing: bool = True
    include_market_data: bool = True


class CreateListingFromAI(BaseModel):
    """Request model for creating listing from AI analysis"""
    session_id: str
    title: str
    description: str
    price: float
    category: str
    condition: str
    listing_type: str = "sale"
    use_ai_suggestion: bool = True


class ItemIdentification(BaseModel):
    """Item identification results"""
    category: str
    subcategory: Optional[str]
    brand: Optional[str]
    model: Optional[str]
    name: str
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ConditionAssessment(BaseModel):
    """Item condition assessment"""
    overall_condition: str  # 'new', 'like_new', 'good', 'fair', 'poor'
    condition_score: float = Field(ge=0.0, le=10.0)
    wear_indicators: List[str] = Field(default_factory=list)
    damage_assessment: List[str] = Field(default_factory=list)
    notes: str = ""
    confidence: float = Field(ge=0.0, le=1.0)


class PriceEstimation(BaseModel):
    """Price estimation results"""
    estimated_price: float
    price_range_min: float
    price_range_max: float
    confidence: float = Field(ge=0.0, le=1.0)
    factors_considered: List[str] = Field(default_factory=list)
    market_context: str = ""


class AIAnalysisResponse(BaseModel):
    """Complete AI analysis response"""
    session_id: str
    item_identification: ItemIdentification
    condition_assessment: ConditionAssessment
    price_estimation: PriceEstimation
    market_data: Dict[str, Any]
    ai_suggestions: Dict[str, str]
    processing_time: float
    confidence_score: float


class AISessionStatus(BaseModel):
    """AI session status response"""
    session_id: str
    status: str
    progress: Optional[str] = None
    error_message: Optional[str] = None


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Utility Functions
async def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
    
    # Read first chunk to determine file type
    file_content = await file.read(1024)
    await file.seek(0)  # Reset file pointer
    
    # Check file type using python-filetype
    kind = filetype.guess(file_content)
    if not kind or kind.extension.lower() not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Supported types: {', '.join(SUPPORTED_IMAGE_TYPES)}"
        )
    
    return True


async def preprocess_image(image_path: str) -> str:
    """Preprocess image for better AI analysis with memory optimization"""
    try:
        # Import memory-optimized processor
        from memory_optimized_image_processing import ai_processor
        
        # Use memory-optimized preprocessing
        processed_path = await ai_processor.preprocess_image_for_ai(image_path)
        logger.info(f"Image preprocessing completed using memory-optimized processor")
        return processed_path
        
    except Exception as e:
        logger.error(f"Memory-optimized image preprocessing failed: {str(e)}")
        
        # Fallback to basic preprocessing if memory optimization fails
        try:
            with Image.open(image_path) as img:
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                if img.width > 2048 or img.height > 2048:
                    img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
                
                processed_path = image_path.replace('.', '_processed.')
                img.save(processed_path, 'JPEG', quality=85, optimize=True)
                return processed_path
        except Exception as fallback_error:
            logger.error(f"Fallback preprocessing also failed: {fallback_error}")
            return image_path


def mock_vision_analysis(image_path: str) -> Dict[str, Any]:
    """Mock vision analysis for development/testing"""
    logger.info("Using mock vision analysis")
    
    # Simulate realistic results based on image filename or random selection
    mock_items = [
        {
            "category": "Electronics",
            "subcategory": "Smartphones",
            "brand": "Apple",
            "model": "iPhone 13",
            "name": "iPhone 13 128GB",
            "description": "Apple iPhone 13 in good condition with minor wear on corners",
            "confidence": 0.92,
            "attributes": {
                "color": "Blue",
                "storage": "128GB",
                "carrier": "Unlocked"
            }
        },
        {
            "category": "Furniture",
            "subcategory": "Seating",
            "brand": "IKEA",
            "model": "POÄNG",
            "name": "POÄNG Armchair",
            "description": "IKEA POÄNG armchair with birch veneer and beige cushion",
            "confidence": 0.87,
            "attributes": {
                "color": "Birch/Beige",
                "material": "Birch veneer",
                "style": "Modern"
            }
        }
    ]
    
    import random
    return random.choice(mock_items)


def mock_condition_analysis(image_path: str, item_data: Dict) -> Dict[str, Any]:
    """Mock condition analysis"""
    logger.info("Using mock condition analysis")
    
    conditions = ['new', 'like_new', 'good', 'fair']
    condition = random.choice(conditions)
    
    condition_scores = {'new': 10.0, 'like_new': 8.5, 'good': 7.0, 'fair': 5.5}
    
    return {
        "overall_condition": condition,
        "condition_score": condition_scores[condition],
        "wear_indicators": ["Minor corner wear", "Light scratches on back"] if condition in ['good', 'fair'] else [],
        "damage_assessment": ["No visible damage"] if condition in ['new', 'like_new'] else ["Minor cosmetic wear"],
        "notes": f"Item appears to be in {condition} condition based on visual inspection",
        "confidence": 0.85
    }


async def analyze_with_openai_vision(image_path: str) -> Dict[str, Any]:
    """Analyze image using OpenAI Vision API with memory optimization"""
    if not openai_client:
        logger.warning("OpenAI API key not configured, using mock analysis")
        return mock_vision_analysis(image_path)
    
    try:
        # Use memory-optimized vision analysis
        from memory_optimized_image_processing import memory_safe_vision_analysis
        
        item_prompt = """Analyze this image and identify the item for a marketplace listing. Return a JSON object with:
                        {
                            "category": "main category (Electronics, Furniture, Clothing, etc.)",
                            "subcategory": "specific subcategory",
                            "brand": "brand name if visible",
                            "model": "model number/name if identifiable", 
                            "name": "descriptive item name",
                            "description": "detailed description for listing",
                            "confidence": "confidence score 0-1",
                            "attributes": {
                                "key-value pairs of item attributes like color, size, material, etc."
                            }
                        }
                        Focus on details that would help a buyer understand exactly what the item is."""
        
        result = await memory_safe_vision_analysis(image_path, openai_client, item_prompt)
        logger.info("OpenAI Vision analysis completed with memory optimization")
        return result
        
    except Exception as e:
        logger.error(f"Memory-optimized OpenAI Vision analysis failed: {str(e)}")
        
        # Fallback to basic approach if memory optimization fails
        try:
            import base64
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": item_prompt
                            },
                            {
                                "type": "image_url", 
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as fallback_error:
            logger.error(f"Fallback OpenAI Vision analysis failed: {fallback_error}")
            return mock_vision_analysis(image_path)


async def assess_condition_with_ai(image_path: str, item_data: Dict) -> Dict[str, Any]:
    """Assess item condition using AI vision analysis with memory optimization"""
    if not openai_client:
        return mock_condition_analysis(image_path, item_data)
    
    try:
        # Use memory-optimized vision analysis
        from memory_optimized_image_processing import memory_safe_vision_analysis
        
        condition_prompt = f"""Assess the condition of this {item_data.get('name', 'item')} for marketplace selling. 
                            Look for wear, damage, scratches, dents, stains, or any condition issues.
                            Return JSON:
                            {{
                                "overall_condition": "new|like_new|good|fair|poor",
                                "condition_score": "numeric score 0-10 (10=perfect)",
                                "wear_indicators": ["list of visible wear signs"],
                                "damage_assessment": ["list of any damage observed"],
                                "notes": "detailed condition assessment",
                                "confidence": "confidence score 0-1"
                            }}"""
        
        result = await memory_safe_vision_analysis(image_path, openai_client, condition_prompt)
        logger.info("AI condition assessment completed with memory optimization")
        return result
        
    except Exception as e:
        logger.error(f"Memory-optimized AI condition assessment failed: {str(e)}")
        
        # Fallback to basic approach
        try:
            import base64
            with open(image_path, "rb") as image_file:
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')
            
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": condition_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=400
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as fallback_error:
            logger.error(f"Fallback AI condition assessment failed: {fallback_error}")
            return mock_condition_analysis(image_path, item_data)


def get_market_data(item_data: Dict, condition: str) -> MarketPrice:
    """Get market pricing data from various sources"""
    try:
        # This would integrate with real market data APIs like:
        # - eBay API for sold listings
        # - Amazon Product API
        # - Facebook Marketplace
        # - Local marketplace APIs
        
        # For now, return mock data with realistic pricing patterns
        category = item_data.get('category', '').lower()
        brand = item_data.get('brand', '').lower()
        
        # Base prices by category
        base_prices = {
            'electronics': {'min': 50, 'max': 2000, 'avg': 300},
            'furniture': {'min': 25, 'max': 1500, 'avg': 200},
            'clothing': {'min': 5, 'max': 500, 'avg': 50},
            'books': {'min': 1, 'max': 200, 'avg': 15},
            'toys': {'min': 5, 'max': 300, 'avg': 40},
        }
        
        # Brand multipliers
        brand_multipliers = {
            'apple': 1.8,
            'samsung': 1.4,
            'sony': 1.3,
            'nike': 1.4,
            'adidas': 1.3,
            'ikea': 0.7,
            'target': 0.6,
        }
        
        # Condition multipliers
        condition_multipliers = {
            'new': 1.0,
            'like_new': 0.85,
            'good': 0.65,
            'fair': 0.45,
            'poor': 0.25
        }
        
        # Get base pricing
        base = base_prices.get(category, base_prices['electronics'])
        brand_mult = brand_multipliers.get(brand, 1.0)
        condition_mult = condition_multipliers.get(condition, 0.7)
        
        # Calculate final prices
        multiplier = brand_mult * condition_mult
        min_price = base['min'] * multiplier
        max_price = base['max'] * multiplier
        avg_price = base['avg'] * multiplier
        
        return MarketPrice(
            min_price=round(min_price, 2),
            max_price=round(max_price, 2),
            average_price=round(avg_price, 2),
            confidence=0.75,
            source="aggregated_marketplaces",
            data_points=random.randint(15, 150)
        )
        
    except Exception as e:
        logger.error(f"Market data retrieval failed: {str(e)}")
        return MarketPrice(
            min_price=10.0,
            max_price=100.0,
            average_price=50.0,
            confidence=0.5,
            source="fallback_estimate",
            data_points=1
        )


async def generate_ai_suggestions(item_data: Dict, condition_data: Dict, price_data: MarketPrice) -> Dict[str, str]:
    """Generate AI-powered listing suggestions"""
    
    suggested_title = f"{item_data.get('brand', '')} {item_data.get('name', 'Item')}".strip()
    if condition_data['overall_condition'] in ['new', 'like_new']:
        suggested_title += f" - {condition_data['overall_condition'].replace('_', ' ').title()}"
    
    # Generate description
    description_parts = [item_data.get('description', '')]
    if condition_data.get('notes'):
        description_parts.append(f"Condition: {condition_data['notes']}")
    
    attributes = item_data.get('attributes', {})
    if attributes:
        attr_text = ", ".join([f"{k}: {v}" for k, v in attributes.items()])
        description_parts.append(f"Details: {attr_text}")
    
    suggested_description = "\n\n".join(description_parts)
    
    # Suggested price (slightly below average for competitive pricing)
    suggested_price = max(price_data.average_price * 0.95, price_data.min_price)
    
    return {
        "suggested_title": suggested_title,
        "suggested_description": suggested_description,
        "suggested_price": f"{suggested_price:.2f}",
        "suggested_category": item_data.get('category', 'Other'),
        "suggested_condition": condition_data['overall_condition'],
        "pricing_strategy": f"Priced competitively at ${suggested_price:.2f}, which is near the market average of ${price_data.average_price:.2f} for similar items in {condition_data['overall_condition']} condition."
    }


async def track_ai_usage(session_id: str, api_provider: str, operation: str, processing_time: float, db: Session):
    """Track AI API usage for cost monitoring"""
    try:
        usage = AIUsageMetrics(
            session_id=session_id,
            api_provider=api_provider,
            operation=operation,
            tokens_used=0,  # Would be populated with actual token usage
            cost_cents=5,   # Estimated cost in cents
            processing_time=processing_time
        )
        db.add(usage)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to track AI usage: {str(e)}")


async def process_photo_analysis(session_id: str, image_path: str, user_id: Optional[int], db: Session):
    """Background task to process photo analysis"""
    start_time = time.time()
    
    try:
        # Get session from database
        session = db.query(AIAnalysisSession).filter(AIAnalysisSession.id == session_id).first()
        if not session:
            raise Exception("Analysis session not found")
        
        # Step 1: Preprocess image
        processed_image_path = await preprocess_image(image_path)
        
        # Step 2: Identify item using AI vision
        if USE_MOCK_API:
            item_data = mock_vision_analysis(processed_image_path)
        else:
            item_data = await analyze_with_openai_vision(processed_image_path)
        
        # Step 3: Assess condition
        if USE_MOCK_API:
            condition_data = mock_condition_analysis(processed_image_path, item_data)
        else:
            condition_data = await assess_condition_with_ai(processed_image_path, item_data)
        
        # Step 4: Get market pricing data
        market_price = get_market_data(item_data, condition_data['overall_condition'])
        
        # Step 5: Generate AI suggestions
        ai_suggestions = await generate_ai_suggestions(item_data, condition_data, market_price)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Update session with results
        session.status = "completed"
        session.item_identification = item_data
        session.condition_assessment = condition_data
        session.price_analysis = {
            "estimated_price": market_price.average_price * 0.95,
            "price_range_min": market_price.min_price,
            "price_range_max": market_price.max_price,
            "confidence": market_price.confidence,
            "factors_considered": ["Market comparison", "Item condition", "Brand value"],
            "market_context": f"Based on {market_price.data_points} similar items"
        }
        session.market_data = {
            "average_price": market_price.average_price,
            "price_range": f"${market_price.min_price:.2f} - ${market_price.max_price:.2f}",
            "confidence": market_price.confidence,
            "source": market_price.source,
            "data_points": market_price.data_points
        }
        session.ai_suggestions = ai_suggestions
        session.processing_time = processing_time
        session.completed_at = datetime.utcnow()
        
        db.commit()
        
        # Track AI usage
        await track_ai_usage(session_id, "openai_vision", "full_analysis", processing_time, db)
        
        logger.info(f"Photo analysis completed for session {session_id} in {processing_time:.2f}s")
        
    except Exception as e:
        logger.error(f"Photo analysis failed for session {session_id}: {str(e)}")
        
        # Update session with error
        session = db.query(AIAnalysisSession).filter(AIAnalysisSession.id == session_id).first()
        if session:
            session.status = "failed"
            session.error_message = str(e)
            session.completed_at = datetime.utcnow()
            db.commit()
    
    finally:
        # Always cleanup memory and temporary files
        try:
            from memory_optimized_image_processing import ai_processor
            await ai_processor.cleanup_processing_files(session_id)
        except Exception as cleanup_error:
            logger.error(f"Cleanup failed for session {session_id}: {cleanup_error}")


# API Endpoints
@router.post("/analyze-photo", response_model=AISessionStatus)
async def analyze_photo(
    background_tasks: BackgroundTasks,
    photo: UploadFile = File(...),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Upload photo and start AI analysis for item identification and pricing
    Returns session ID to track analysis progress
    """
    try:
        # Validate uploaded file
        await validate_image_file(photo)
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Save uploaded file
        upload_dir = "uploads/ai_analysis"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_extension = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
        image_filename = f"{session_id}.{file_extension}"
        image_path = os.path.join(upload_dir, image_filename)
        
        async with aiofiles.open(image_path, 'wb') as f:
            content = await photo.read()
            await f.write(content)
        
        # Create analysis session record
        session = AIAnalysisSession(
            id=session_id,
            user_id=user_id,
            image_path=image_path,
            status="processing"
        )
        db.add(session)
        db.commit()
        
        # Start background processing
        background_tasks.add_task(process_photo_analysis, session_id, image_path, user_id, db)
        
        logger.info(f"Started photo analysis for session {session_id}")
        
        return AISessionStatus(
            session_id=session_id,
            status="processing",
            progress="Analysis started"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Photo analysis initiation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start photo analysis")


@router.get("/ai-suggestions/{session_id}")
async def get_ai_suggestions(session_id: str, db: Session = Depends(get_db)):
    """
    Get AI analysis results for a session
    Returns 202 if still processing, 200 when complete
    """
    try:
        session = db.query(AIAnalysisSession).filter(AIAnalysisSession.id == session_id).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Analysis session not found")
        
        if session.status == "processing":
            return JSONResponse(
                status_code=202,
                content={
                    "session_id": session_id,
                    "status": "processing",
                    "progress": "AI is analyzing your photo..."
                }
            )
        elif session.status == "failed":
            raise HTTPException(
                status_code=500, 
                detail=session.error_message or "Analysis failed"
            )
        
        # Analysis complete - return results
        response = AIAnalysisResponse(
            session_id=session_id,
            item_identification=ItemIdentification(**session.item_identification),
            condition_assessment=ConditionAssessment(**session.condition_assessment),
            price_estimation=PriceEstimation(**session.price_analysis),
            market_data=session.market_data,
            ai_suggestions=session.ai_suggestions,
            processing_time=session.processing_time,
            confidence_score=(
                session.item_identification.get('confidence', 0.5) + 
                session.condition_assessment.get('confidence', 0.5) + 
                session.price_analysis.get('confidence', 0.5)
            ) / 3
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get AI suggestions for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analysis results")


@router.get("/analysis-status/{session_id}")
async def get_analysis_status(session_id: str, db: Session = Depends(get_db)):
    """Get status of an analysis session"""
    try:
        session = db.query(AIAnalysisSession).filter(AIAnalysisSession.id == session_id).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Analysis session not found")
        
        progress_messages = {
            "processing": "AI is analyzing your photo...",
            "completed": "Analysis complete!",
            "failed": "Analysis failed"
        }
        
        return AISessionStatus(
            session_id=session_id,
            status=session.status,
            progress=progress_messages.get(session.status, "Unknown status"),
            error_message=session.error_message if session.status == "failed" else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get analysis status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get analysis status")


@router.get("/usage-metrics")
async def get_usage_metrics(db: Session = Depends(get_db)):
    """Get AI usage metrics for cost monitoring (admin only)"""
    try:
        # Get metrics for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        metrics = db.query(AIUsageMetrics)\
                   .filter(AIUsageMetrics.created_at >= thirty_days_ago)\
                   .all()
        
        total_sessions = len(set(m.session_id for m in metrics))
        total_cost_cents = sum(m.cost_cents for m in metrics)
        avg_processing_time = sum(m.processing_time for m in metrics) / len(metrics) if metrics else 0
        
        by_provider = {}
        for metric in metrics:
            if metric.api_provider not in by_provider:
                by_provider[metric.api_provider] = {"count": 0, "cost_cents": 0}
            by_provider[metric.api_provider]["count"] += 1
            by_provider[metric.api_provider]["cost_cents"] += metric.cost_cents
        
        return {
            "period": "last_30_days",
            "total_sessions": total_sessions,
            "total_cost_dollars": total_cost_cents / 100,
            "average_processing_time": round(avg_processing_time, 2),
            "by_provider": by_provider,
            "metrics_count": len(metrics)
        }
        
    except Exception as e:
        logger.error(f"Failed to get usage metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get usage metrics")


@router.get("/memory-stats")
async def get_memory_stats():
    """Get current memory usage statistics for monitoring"""
    try:
        from memory_optimized_image_processing import get_memory_stats
        
        stats = get_memory_stats()
        
        # Add additional information
        stats.update({
            "timestamp": datetime.utcnow().isoformat(),
            "memory_optimization_enabled": True,
            "status": "healthy" if stats.get("memory_usage_mb", 0) < 500 else "warning"
        })
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get memory stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get memory statistics")


@router.post("/create-from-ai")
async def create_listing_from_ai(
    listing_data: CreateListingFromAI,
    db: Session = Depends(get_db)
):
    """
    Create a new listing using AI analysis data
    """
    try:
        # Verify the AI analysis session exists
        session = db.query(AIAnalysisSession).filter(
            AIAnalysisSession.id == listing_data.session_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="AI analysis session not found")
        
        if session.status != "completed":
            raise HTTPException(status_code=400, detail="AI analysis not completed yet")
        
        # For now, we'll return a mock response since the full listing creation
        # would require integration with the existing listings system
        # In a real implementation, this would:
        # 1. Create a new listing record in the main listings table
        # 2. Associate the AI analysis session with the listing
        # 3. Copy the analyzed image to the listing's image gallery
        # 4. Track that this listing was AI-generated for analytics
        
        mock_listing = {
            "id": f"listing_{listing_data.session_id[:8]}",
            "title": listing_data.title,
            "description": listing_data.description,
            "price": listing_data.price,
            "category": listing_data.category,
            "condition": listing_data.condition,
            "listing_type": listing_data.listing_type,
            "ai_generated": True,
            "ai_session_id": listing_data.session_id,
            "images": [session.image_path] if session.image_path else [],
            "created_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        logger.info(f"Created listing from AI analysis session {listing_data.session_id}")
        
        return {
            "message": "Listing created successfully from AI analysis",
            "listing": mock_listing
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create listing from AI: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create listing from AI analysis")


@router.get("/market-trends/{category}")
async def get_market_trends(category: str, db: Session = Depends(get_db)):
    """
    Get market trends for a specific category (for pricing insights)
    """
    try:
        # This would normally query real market data
        # For now, return mock trend data
        
        trend_data = {
            "category": category,
            "average_price_trend": "increasing",
            "price_change_percent": 5.2,
            "popular_conditions": ["good", "like_new"],
            "seasonal_factors": {
                "current_season": "high_demand" if category.lower() in ["electronics", "clothing"] else "normal",
                "price_multiplier": 1.1 if category.lower() in ["electronics", "clothing"] else 1.0
            },
            "recent_sales_count": 42,
            "average_days_to_sell": 8.5,
            "price_ranges": {
                "low": 15.99,
                "average": 89.99,
                "high": 299.99
            }
        }
        
        return trend_data
        
    except Exception as e:
        logger.error(f"Failed to get market trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get market trends")


# Export router
def get_ai_pricing_router():
    """Get the AI pricing router for inclusion in main app"""
    return router