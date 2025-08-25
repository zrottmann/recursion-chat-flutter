"""
Batch Processing API Router for Trading Post
Provides REST endpoints for bulk operations and progress tracking
"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/batch", tags=["Batch Processing"])

# Pydantic models for request/response
class BatchJobCreateRequest(BaseModel):
    """Request to create a new batch job"""
    operation_type: str = Field(..., description="Type of batch operation")
    items: List[Dict[str, Any]] = Field(..., description="Items to process")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Processing options")

class BatchItemUploadRequest(BaseModel):
    """Request for batch item uploads"""
    items: List[Dict[str, Any]] = Field(..., description="Items to upload")
    auto_start: bool = Field(default=True, description="Automatically start processing")

class BatchImageAnalysisRequest(BaseModel):
    """Request for batch image analysis"""
    images: List[Dict[str, Any]] = Field(..., description="Images to analyze")
    analysis_type: str = Field(default="full", description="Type of analysis to perform")

class BatchDataExportRequest(BaseModel):
    """Request for data export"""
    export_type: str = Field(default="full", description="Type of data to export")
    include_images: bool = Field(default=False, description="Include image data")
    date_range: Optional[Dict[str, str]] = Field(default=None, description="Date range filter")

class BatchJobResponse(BaseModel):
    """Response for batch job operations"""
    job_id: str
    status: str
    message: str
    total_items: int
    created_at: str

class BatchJobStatusResponse(BaseModel):
    """Response for batch job status"""
    id: str
    user_id: int
    operation_type: str
    status: str
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    progress_percentage: float
    started_at: Optional[str]
    completed_at: Optional[str]
    estimated_completion: Optional[str]
    error_message: Optional[str]
    result_data: Optional[Dict[str, Any]]
    error_count: int

class BatchJobListResponse(BaseModel):
    """Response for listing batch jobs"""
    jobs: List[BatchJobStatusResponse]
    total_count: int
    page: int
    page_size: int

# Import dependencies - these will be set when the router is initialized
get_current_user = None
get_db = None
batch_processor = None

def init_batch_router(current_user_dependency, db_dependency, bp_instance):
    """Initialize batch router with dependencies"""
    global get_current_user, get_db, batch_processor
    get_current_user = current_user_dependency
    get_db = db_dependency
    batch_processor = bp_instance

# Batch Job Creation Endpoints
@router.post("/jobs/create", response_model=BatchJobResponse)
async def create_batch_job(
    request: BatchJobCreateRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Create a new batch processing job
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        from batch_processor import BatchOperationType
        
        # Validate operation type
        try:
            operation_type = BatchOperationType(request.operation_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid operation type: {request.operation_type}"
            )
        
        # Validate items
        if not request.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No items provided for processing"
            )
        
        if len(request.items) > 1000:  # Limit batch size
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Batch size too large. Maximum 1000 items per batch."
            )
        
        # Create the batch job
        job_id = await batch_processor.create_batch_job(
            user_id=current_user.id,
            operation_type=operation_type,
            items=request.items,
            options=request.options
        )
        
        # Start processing in background
        background_tasks.add_task(batch_processor.start_batch_job, job_id)
        
        return BatchJobResponse(
            job_id=job_id,
            status="created",
            message=f"Batch job created with {len(request.items)} items",
            total_items=len(request.items),
            created_at=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create batch job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create batch job"
        )

@router.post("/items/upload", response_model=BatchJobResponse)
async def batch_upload_items(
    request: BatchItemUploadRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Upload multiple items in a batch operation
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        from batch_processor import BatchOperationType
        
        # Validate items
        if not request.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No items provided for upload"
            )
        
        # Validate required fields for each item
        required_fields = ['title', 'description', 'category']
        for i, item in enumerate(request.items):
            for field in required_fields:
                if field not in item or not item[field]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Item {i}: Missing required field '{field}'"
                    )
        
        # Create batch job
        job_id = await batch_processor.create_batch_job(
            user_id=current_user.id,
            operation_type=BatchOperationType.ITEM_UPLOAD,
            items=request.items,
            options={"auto_start": request.auto_start}
        )
        
        # Start processing if requested
        if request.auto_start:
            background_tasks.add_task(batch_processor.start_batch_job, job_id)
        
        return BatchJobResponse(
            job_id=job_id,
            status="created" if request.auto_start else "pending",
            message=f"Batch upload job created for {len(request.items)} items",
            total_items=len(request.items),
            created_at=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create batch upload job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create batch upload job"
        )

@router.post("/images/analyze", response_model=BatchJobResponse)
async def batch_analyze_images(
    request: BatchImageAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Analyze multiple images with AI in a batch operation
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        from batch_processor import BatchOperationType
        
        # Validate images
        if not request.images:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No images provided for analysis"
            )
        
        # Validate image data
        for i, image in enumerate(request.images):
            if 'item_id' not in image:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Image {i}: Missing item_id"
                )
        
        # Create batch job
        job_id = await batch_processor.create_batch_job(
            user_id=current_user.id,
            operation_type=BatchOperationType.IMAGE_ANALYSIS,
            items=request.images,
            options={
                "analysis_type": request.analysis_type,
                "user_requested": True
            }
        )
        
        # Start processing
        background_tasks.add_task(batch_processor.start_batch_job, job_id)
        
        return BatchJobResponse(
            job_id=job_id,
            status="processing",
            message=f"Batch image analysis started for {len(request.images)} images",
            total_items=len(request.images),
            created_at=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create batch image analysis job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create batch image analysis job"
        )

@router.post("/data/export", response_model=BatchJobResponse)
async def export_user_data(
    request: BatchDataExportRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Export user data in various formats
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        from batch_processor import BatchOperationType
        
        # Create export job with single item (the export request)
        export_config = {
            "export_type": request.export_type,
            "include_images": request.include_images,
            "date_range": request.date_range,
            "user_id": current_user.id
        }
        
        job_id = await batch_processor.create_batch_job(
            user_id=current_user.id,
            operation_type=BatchOperationType.DATA_EXPORT,
            items=[export_config],
            options={"format": "json"}
        )
        
        # Start processing
        background_tasks.add_task(batch_processor.start_batch_job, job_id)
        
        return BatchJobResponse(
            job_id=job_id,
            status="processing",
            message="Data export job started",
            total_items=1,
            created_at=datetime.utcnow().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create data export job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create data export job"
        )

# Batch Job Management Endpoints
@router.get("/jobs/{job_id}/status", response_model=BatchJobStatusResponse)
async def get_batch_job_status(
    job_id: str,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Get the status of a specific batch job
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        job_status = await batch_processor.get_batch_job_status(job_id)
        
        if not job_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch job not found"
            )
        
        # Verify user owns this job
        if job_status["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this batch job"
            )
        
        return BatchJobStatusResponse(**job_status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get batch job status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get batch job status"
        )

@router.post("/jobs/{job_id}/start")
async def start_batch_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Start processing a pending batch job
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        # Verify job exists and user owns it
        job_status = await batch_processor.get_batch_job_status(job_id)
        
        if not job_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch job not found"
            )
        
        if job_status["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this batch job"
            )
        
        # Start the job
        success = await batch_processor.start_batch_job(job_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start batch job. Job may already be running or completed."
            )
        
        return {
            "success": True,
            "message": "Batch job started",
            "job_id": job_id,
            "status": "processing"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start batch job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start batch job"
        )

@router.post("/jobs/{job_id}/cancel")
async def cancel_batch_job(
    job_id: str,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Cancel a running batch job
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        # Verify job exists and user owns it
        job_status = await batch_processor.get_batch_job_status(job_id)
        
        if not job_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch job not found"
            )
        
        if job_status["user_id"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this batch job"
            )
        
        # Cancel the job
        success = await batch_processor.cancel_batch_job(job_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel batch job. Job may already be completed."
            )
        
        return {
            "success": True,
            "message": "Batch job cancelled",
            "job_id": job_id,
            "status": "cancelled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel batch job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel batch job"
        )

@router.get("/jobs", response_model=BatchJobListResponse)
async def list_user_batch_jobs(
    page: int = 1,
    page_size: int = 20,
    status_filter: Optional[str] = None,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    List batch jobs for the current user
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    try:
        # Get user's jobs from database
        db_conn = db()
        cursor = db_conn.cursor()
        
        # Build query
        base_query = "SELECT * FROM batch_jobs WHERE user_id = ?"
        params = [current_user.id]
        
        if status_filter:
            base_query += " AND status = ?"
            params.append(status_filter)
        
        base_query += " ORDER BY created_at DESC"
        
        # Get total count
        count_query = base_query.replace("SELECT *", "SELECT COUNT(*)")
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Get paginated results
        offset = (page - 1) * page_size
        paginated_query = base_query + f" LIMIT {page_size} OFFSET {offset}"
        
        cursor.execute(paginated_query, params)
        rows = cursor.fetchall()
        
        jobs = []
        for row in rows:
            job_data = {
                "id": row[0],
                "user_id": row[1],
                "operation_type": row[2],
                "status": row[3],
                "total_items": row[4],
                "processed_items": row[5],
                "successful_items": row[6],
                "failed_items": row[7],
                "progress_percentage": row[8],
                "started_at": row[9],
                "completed_at": row[10],
                "estimated_completion": row[11],
                "error_message": row[12],
                "result_data": json.loads(row[13]) if row[13] else None,
                "error_count": 0  # TODO: Calculate from error_items
            }
            jobs.append(BatchJobStatusResponse(**job_data))
        
        db_conn.close()
        
        return BatchJobListResponse(
            jobs=jobs,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list batch jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list batch jobs"
        )

# Utility Endpoints
@router.get("/health")
async def check_batch_health():
    """
    Check if batch processing service is available and functioning
    """
    try:
        # Check if required dependencies are available
        dependencies_available = True
        missing_deps = []
        
        try:
            import asyncio
            import threading
            from concurrent.futures import ThreadPoolExecutor
        except ImportError as e:
            dependencies_available = False
            missing_deps.append(str(e))
        
        return {
            "status": "healthy" if dependencies_available and batch_processor else "unavailable",
            "service": "batch_processing",
            "dependencies_available": dependencies_available,
            "missing_dependencies": missing_deps,
            "processor_initialized": batch_processor is not None,
            "active_jobs": len(batch_processor.active_jobs) if batch_processor else 0
        }
        
    except Exception as e:
        logger.error(f"Batch health check failed: {e}")
        return {
            "status": "error",
            "service": "batch_processing",
            "error": str(e)
        }

@router.post("/cleanup")
async def cleanup_old_jobs(
    days_old: int = 7,
    current_user = Depends(lambda: get_current_user()),
    db = Depends(lambda: get_db())
):
    """
    Clean up old completed batch jobs (admin only)
    """
    if not batch_processor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Batch processing service not available"
        )
    
    # For now, allow any user to clean up their own old jobs
    # TODO: Add admin role check for global cleanup
    
    try:
        await batch_processor.cleanup_old_jobs(days_old)
        
        return {
            "success": True,
            "message": f"Cleaned up batch jobs older than {days_old} days",
            "days_old": days_old
        }
        
    except Exception as e:
        logger.error(f"Failed to cleanup old jobs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup old jobs"
        )