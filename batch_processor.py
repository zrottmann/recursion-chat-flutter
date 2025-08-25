"""
Batch Processing System for Trading Post
Handles bulk operations efficiently with progress tracking and error handling
"""

import os
import asyncio
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Callable, AsyncGenerator
from dataclasses import dataclass, asdict
from enum import Enum
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from pathlib import Path

logger = logging.getLogger(__name__)

class BatchStatus(Enum):
    """Batch operation status"""
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class BatchOperationType(Enum):
    """Types of batch operations"""
    ITEM_UPLOAD = "item_upload"
    ITEM_UPDATE = "item_update"
    ITEM_DELETE = "item_delete"
    TRADE_PROCESS = "trade_process"
    IMAGE_ANALYSIS = "image_analysis"
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"
    USER_UPDATE = "user_update"

@dataclass
class BatchJob:
    """Represents a batch processing job"""
    id: str
    user_id: int
    operation_type: BatchOperationType
    status: BatchStatus
    total_items: int
    processed_items: int = 0
    successful_items: int = 0
    failed_items: int = 0
    error_items: List[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    progress_percentage: float = 0.0
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        if self.error_items is None:
            self.error_items = []

@dataclass
class BatchItem:
    """Individual item in a batch operation"""
    id: str
    data: Dict[str, Any]
    status: str = "pending"
    error_message: Optional[str] = None
    processed_at: Optional[datetime] = None

class BatchProcessor:
    """Manages batch processing operations"""
    
    def __init__(self, db_session_factory, max_workers: int = 4):
        self.db_session_factory = db_session_factory
        self.max_workers = max_workers
        self.active_jobs: Dict[str, BatchJob] = {}
        self.job_lock = threading.Lock()
        
        # Thread pool for CPU-intensive operations
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        
        # Import dependencies
        try:
            from error_monitoring import error_monitor
            self.error_monitor = error_monitor
        except ImportError:
            self.error_monitor = None
    
    async def create_batch_job(
        self, 
        user_id: int, 
        operation_type: BatchOperationType, 
        items: List[Dict[str, Any]],
        options: Dict[str, Any] = None
    ) -> str:
        """Create a new batch processing job"""
        
        job_id = str(uuid.uuid4())
        
        job = BatchJob(
            id=job_id,
            user_id=user_id,
            operation_type=operation_type,
            status=BatchStatus.PENDING,
            total_items=len(items)
        )
        
        # Store job in memory and database
        with self.job_lock:
            self.active_jobs[job_id] = job
        
        # Store job data in database
        try:
            await self._store_batch_job(job, items, options or {})
            logger.info(f"Created batch job {job_id} for user {user_id}: {operation_type.value} with {len(items)} items")
            return job_id
            
        except Exception as e:
            logger.error(f"Failed to create batch job: {e}")
            if self.error_monitor:
                self.error_monitor.log_error(e, {"user_id": user_id, "operation": "create_batch_job"})
            raise
    
    async def start_batch_job(self, job_id: str) -> bool:
        """Start processing a batch job"""
        
        with self.job_lock:
            if job_id not in self.active_jobs:
                logger.error(f"Batch job {job_id} not found")
                return False
            
            job = self.active_jobs[job_id]
            if job.status != BatchStatus.PENDING:
                logger.warning(f"Batch job {job_id} is not in pending status: {job.status}")
                return False
            
            job.status = BatchStatus.PROCESSING
            job.started_at = datetime.utcnow()
        
        # Start processing in background
        asyncio.create_task(self._process_batch_job(job_id))
        
        logger.info(f"Started batch job {job_id}")
        return True
    
    async def _process_batch_job(self, job_id: str):
        """Process a batch job asynchronously"""
        
        try:
            with self.job_lock:
                job = self.active_jobs.get(job_id)
                if not job:
                    return
            
            # Load job data from database
            items = await self._load_batch_items(job_id)
            
            # Process items based on operation type
            if job.operation_type == BatchOperationType.ITEM_UPLOAD:
                await self._process_item_uploads(job, items)
            elif job.operation_type == BatchOperationType.ITEM_UPDATE:
                await self._process_item_updates(job, items)
            elif job.operation_type == BatchOperationType.ITEM_DELETE:
                await self._process_item_deletions(job, items)
            elif job.operation_type == BatchOperationType.IMAGE_ANALYSIS:
                await self._process_image_analysis(job, items)
            elif job.operation_type == BatchOperationType.DATA_EXPORT:
                await self._process_data_export(job, items)
            elif job.operation_type == BatchOperationType.DATA_IMPORT:
                await self._process_data_import(job, items)
            else:
                raise ValueError(f"Unsupported operation type: {job.operation_type}")
            
            # Mark job as completed
            with self.job_lock:
                job.status = BatchStatus.COMPLETED
                job.completed_at = datetime.utcnow()
                job.progress_percentage = 100.0
            
            await self._update_batch_job_status(job)
            logger.info(f"Completed batch job {job_id}: {job.successful_items}/{job.total_items} successful")
            
        except Exception as e:
            logger.error(f"Batch job {job_id} failed: {e}")
            
            with self.job_lock:
                if job_id in self.active_jobs:
                    job = self.active_jobs[job_id]
                    job.status = BatchStatus.FAILED
                    job.completed_at = datetime.utcnow()
                    job.error_message = str(e)
            
            await self._update_batch_job_status(job)
            
            if self.error_monitor:
                self.error_monitor.log_error(e, {"job_id": job_id, "operation": "process_batch_job"})
    
    async def _process_item_uploads(self, job: BatchJob, items: List[Dict[str, Any]]):
        """Process batch item uploads"""
        
        for i, item_data in enumerate(items):
            try:
                # Simulate item upload processing
                await self._process_single_item_upload(job.user_id, item_data)
                
                job.successful_items += 1
                job.processed_items += 1
                job.progress_percentage = (job.processed_items / job.total_items) * 100
                
                # Update progress every 10 items or at completion
                if i % 10 == 0 or i == len(items) - 1:
                    await self._update_batch_job_status(job)
                
            except Exception as e:
                logger.warning(f"Failed to process item {i} in job {job.id}: {e}")
                job.failed_items += 1
                job.processed_items += 1
                job.error_items.append({
                    "item_index": i,
                    "error": str(e),
                    "data": item_data
                })
        
        logger.info(f"Item upload batch {job.id}: {job.successful_items} successful, {job.failed_items} failed")
    
    async def _process_single_item_upload(self, user_id: int, item_data: Dict[str, Any]):
        """Process a single item upload"""
        
        # Get database connection
        db = self.db_session_factory()
        
        try:
            # Insert item into database
            cursor = db.cursor()
            
            insert_sql = """
            INSERT INTO items (
                user_id, title, description, category, condition_rating,
                estimated_value, latitude, longitude, is_available, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            cursor.execute(insert_sql, (
                user_id,
                item_data.get('title', ''),
                item_data.get('description', ''),
                item_data.get('category', ''),
                item_data.get('condition_rating', 5),
                item_data.get('estimated_value', 0.0),
                item_data.get('latitude'),
                item_data.get('longitude'),
                item_data.get('is_available', True),
                datetime.utcnow()
            ))
            
            item_id = cursor.lastrowid
            
            # Process images if provided
            if 'images' in item_data and item_data['images']:
                await self._process_item_images(item_id, item_data['images'])
            
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    async def _process_item_images(self, item_id: int, image_data: List[Dict[str, Any]]):
        """Process images for an item"""
        
        # This would integrate with the existing image processing system
        # For now, just log the operation
        logger.info(f"Processing {len(image_data)} images for item {item_id}")
        
        # TODO: Integrate with actual image processing and AI analysis
        pass
    
    async def _process_image_analysis(self, job: BatchJob, items: List[Dict[str, Any]]):
        """Process batch image analysis"""
        
        for i, item_data in enumerate(items):
            try:
                # Simulate AI image analysis
                analysis_result = await self._analyze_item_image(item_data)
                
                job.successful_items += 1
                job.processed_items += 1
                job.progress_percentage = (job.processed_items / job.total_items) * 100
                
                # Store analysis result
                if not job.result_data:
                    job.result_data = {"analysis_results": []}
                job.result_data["analysis_results"].append(analysis_result)
                
                if i % 5 == 0 or i == len(items) - 1:
                    await self._update_batch_job_status(job)
                
            except Exception as e:
                logger.warning(f"Failed to analyze image {i} in job {job.id}: {e}")
                job.failed_items += 1
                job.processed_items += 1
                job.error_items.append({
                    "item_index": i,
                    "error": str(e),
                    "data": item_data
                })
    
    async def _analyze_item_image(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a single item image"""
        
        # Simulate AI analysis
        await asyncio.sleep(0.1)  # Simulate processing time
        
        return {
            "item_id": item_data.get("item_id"),
            "categories": ["electronics", "smartphone"],
            "condition_score": 8.5,
            "estimated_value": 250.00,
            "wear_analysis": {
                "scratches": "minimal",
                "wear_level": "light",
                "functional_issues": "none_detected"
            },
            "confidence": 0.92,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    async def _process_data_export(self, job: BatchJob, items: List[Dict[str, Any]]):
        """Process data export operation"""
        
        export_data = {
            "exported_at": datetime.utcnow().isoformat(),
            "user_id": job.user_id,
            "export_type": items[0].get("export_type", "full"),
            "data": []
        }
        
        # Export user's data
        db = self.db_session_factory()
        
        try:
            cursor = db.cursor()
            
            # Export items
            cursor.execute("SELECT * FROM items WHERE user_id = ?", (job.user_id,))
            items_data = cursor.fetchall()
            
            # Export trades
            cursor.execute("""
                SELECT * FROM trades 
                WHERE initiator_id = ? OR receiver_id = ?
            """, (job.user_id, job.user_id))
            trades_data = cursor.fetchall()
            
            export_data["data"] = {
                "items": [dict(row) for row in items_data],
                "trades": [dict(row) for row in trades_data]
            }
            
            # Save export file
            export_filename = f"trading_post_export_{job.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            export_path = Path("exports") / export_filename
            export_path.parent.mkdir(exist_ok=True)
            
            with open(export_path, 'w') as f:
                json.dump(export_data, f, indent=2, default=str)
            
            job.result_data = {
                "export_file": export_filename,
                "export_path": str(export_path),
                "items_exported": len(items_data),
                "trades_exported": len(trades_data)
            }
            
            job.successful_items = 1
            job.processed_items = 1
            job.progress_percentage = 100.0
            
        finally:
            db.close()
    
    async def get_batch_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a batch job"""
        
        with self.job_lock:
            job = self.active_jobs.get(job_id)
            if not job:
                # Try to load from database
                job = await self._load_batch_job(job_id)
                if job:
                    self.active_jobs[job_id] = job
        
        if not job:
            return None
        
        return {
            "id": job.id,
            "user_id": job.user_id,
            "operation_type": job.operation_type.value,
            "status": job.status.value,
            "total_items": job.total_items,
            "processed_items": job.processed_items,
            "successful_items": job.successful_items,
            "failed_items": job.failed_items,
            "progress_percentage": job.progress_percentage,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "estimated_completion": job.estimated_completion.isoformat() if job.estimated_completion else None,
            "error_message": job.error_message,
            "result_data": job.result_data,
            "error_count": len(job.error_items)
        }
    
    async def cancel_batch_job(self, job_id: str) -> bool:
        """Cancel a running batch job"""
        
        with self.job_lock:
            job = self.active_jobs.get(job_id)
            if not job:
                return False
            
            if job.status in [BatchStatus.COMPLETED, BatchStatus.FAILED, BatchStatus.CANCELLED]:
                return False
            
            job.status = BatchStatus.CANCELLED
            job.completed_at = datetime.utcnow()
        
        await self._update_batch_job_status(job)
        logger.info(f"Cancelled batch job {job_id}")
        return True
    
    async def cleanup_old_jobs(self, days_old: int = 7):
        """Clean up old completed batch jobs"""
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Remove from memory
        to_remove = []
        with self.job_lock:
            for job_id, job in self.active_jobs.items():
                if (job.completed_at and job.completed_at < cutoff_date and 
                    job.status in [BatchStatus.COMPLETED, BatchStatus.FAILED, BatchStatus.CANCELLED]):
                    to_remove.append(job_id)
        
        for job_id in to_remove:
            with self.job_lock:
                del self.active_jobs[job_id]
        
        # Clean up database
        try:
            db = self.db_session_factory()
            cursor = db.cursor()
            
            cursor.execute("""
                DELETE FROM batch_jobs 
                WHERE completed_at < ? AND status IN ('completed', 'failed', 'cancelled')
            """, (cutoff_date,))
            
            cursor.execute("""
                DELETE FROM batch_items 
                WHERE job_id NOT IN (SELECT id FROM batch_jobs)
            """, )
            
            db.commit()
            db.close()
            
            logger.info(f"Cleaned up {len(to_remove)} old batch jobs")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old jobs: {e}")
    
    # Database operations
    async def _store_batch_job(self, job: BatchJob, items: List[Dict[str, Any]], options: Dict[str, Any]):
        """Store batch job in database"""
        
        db = self.db_session_factory()
        
        try:
            cursor = db.cursor()
            
            # Create tables if they don't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS batch_jobs (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    operation_type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    total_items INTEGER NOT NULL,
                    processed_items INTEGER DEFAULT 0,
                    successful_items INTEGER DEFAULT 0,
                    failed_items INTEGER DEFAULT 0,
                    progress_percentage REAL DEFAULT 0.0,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    estimated_completion TIMESTAMP,
                    error_message TEXT,
                    result_data TEXT,
                    options TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS batch_items (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    item_index INTEGER NOT NULL,
                    data TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    error_message TEXT,
                    processed_at TIMESTAMP,
                    FOREIGN KEY (job_id) REFERENCES batch_jobs (id)
                )
            """)
            
            # Insert job
            cursor.execute("""
                INSERT INTO batch_jobs (
                    id, user_id, operation_type, status, total_items,
                    processed_items, successful_items, failed_items,
                    progress_percentage, options
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                job.id, job.user_id, job.operation_type.value, job.status.value,
                job.total_items, job.processed_items, job.successful_items,
                job.failed_items, job.progress_percentage, json.dumps(options)
            ))
            
            # Insert items
            for i, item_data in enumerate(items):
                item_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO batch_items (id, job_id, item_index, data)
                    VALUES (?, ?, ?, ?)
                """, (item_id, job.id, i, json.dumps(item_data)))
            
            db.commit()
            
        finally:
            db.close()
    
    async def _update_batch_job_status(self, job: BatchJob):
        """Update batch job status in database"""
        
        db = self.db_session_factory()
        
        try:
            cursor = db.cursor()
            
            cursor.execute("""
                UPDATE batch_jobs SET 
                    status = ?, processed_items = ?, successful_items = ?,
                    failed_items = ?, progress_percentage = ?, started_at = ?,
                    completed_at = ?, estimated_completion = ?, error_message = ?,
                    result_data = ?
                WHERE id = ?
            """, (
                job.status.value, job.processed_items, job.successful_items,
                job.failed_items, job.progress_percentage, job.started_at,
                job.completed_at, job.estimated_completion, job.error_message,
                json.dumps(job.result_data) if job.result_data else None,
                job.id
            ))
            
            db.commit()
            
        finally:
            db.close()
    
    async def _load_batch_job(self, job_id: str) -> Optional[BatchJob]:
        """Load batch job from database"""
        
        db = self.db_session_factory()
        
        try:
            cursor = db.cursor()
            
            cursor.execute("SELECT * FROM batch_jobs WHERE id = ?", (job_id,))
            row = cursor.fetchone()
            
            if not row:
                return None
            
            # Convert row to BatchJob
            job = BatchJob(
                id=row[0],
                user_id=row[1],
                operation_type=BatchOperationType(row[2]),
                status=BatchStatus(row[3]),
                total_items=row[4],
                processed_items=row[5],
                successful_items=row[6],
                failed_items=row[7],
                progress_percentage=row[8],
                started_at=datetime.fromisoformat(row[9]) if row[9] else None,
                completed_at=datetime.fromisoformat(row[10]) if row[10] else None,
                estimated_completion=datetime.fromisoformat(row[11]) if row[11] else None,
                error_message=row[12],
                result_data=json.loads(row[13]) if row[13] else None
            )
            
            return job
            
        finally:
            db.close()
    
    async def _load_batch_items(self, job_id: str) -> List[Dict[str, Any]]:
        """Load batch items from database"""
        
        db = self.db_session_factory()
        
        try:
            cursor = db.cursor()
            
            cursor.execute("""
                SELECT data FROM batch_items 
                WHERE job_id = ? 
                ORDER BY item_index
            """, (job_id,))
            
            rows = cursor.fetchall()
            return [json.loads(row[0]) for row in rows]
            
        finally:
            db.close()

# Global instance
batch_processor = None

def init_batch_processor(db_session_factory, max_workers: int = 4):
    """Initialize the batch processing system"""
    global batch_processor
    batch_processor = BatchProcessor(db_session_factory, max_workers)
    return batch_processor

# Export everything
__all__ = [
    'BatchProcessor',
    'BatchJob',
    'BatchItem',
    'BatchStatus',
    'BatchOperationType',
    'batch_processor',
    'init_batch_processor'
]