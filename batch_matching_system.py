"""
Batch Matching System for Trading Post
Efficiently processes multiple items and handles conflict resolution
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple, Any
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict, Counter
import heapq
from enum import Enum

# Database imports
from sqlalchemy.orm import Session
from ai_matching_schema import (
    MatchingSuggestion,
    MatchingPreference, 
    MatchingHistory,
    get_matching_db
)

# Matching engine imports
from ai_matching_engine import (
    AIMatchingEngine,
    MatchingContext,
    ItemData,
    UserProfile
)
from ml_learning_system import MatchingMLSystem

logger = logging.getLogger(__name__)


class MatchingPriority(Enum):
    """Priority levels for batch matching"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4


@dataclass
class MatchingJob:
    """Individual matching job in the batch"""
    job_id: str
    user_id: str
    item_ids: List[str]
    priority: MatchingPriority = MatchingPriority.NORMAL
    max_matches: int = 20
    created_at: datetime = field(default_factory=datetime.utcnow)
    context: Optional[Dict[str, Any]] = None


@dataclass
class MatchingResult:
    """Result of a matching operation"""
    job_id: str
    user_id: str
    matches: List[Dict[str, Any]]
    processing_time: float
    success: bool
    error: Optional[str] = None
    conflicts_resolved: int = 0


@dataclass
class ConflictResolution:
    """Result of conflict resolution"""
    item_id: str
    competing_users: List[str]
    selected_user: str
    resolution_method: str
    score_differences: Dict[str, float]


class BatchMatchingSystem:
    """
    System for processing multiple matching requests efficiently
    with intelligent conflict resolution
    """
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.matching_engine = AIMatchingEngine()
        self.ml_system = MatchingMLSystem()
        self.active_jobs = {}
        self.job_queue = []
        self.processing_stats = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'conflicts_resolved': 0,
            'avg_processing_time': 0.0
        }
        
        # Conflict resolution strategies
        self.conflict_resolvers = {
            'highest_score': self._resolve_by_highest_score,
            'first_come_first_served': self._resolve_by_timestamp,
            'user_priority': self._resolve_by_user_priority,
            'fairness_algorithm': self._resolve_by_fairness,
            'ml_prediction': self._resolve_by_ml_prediction
        }
    
    async def submit_batch_job(self, job: MatchingJob, db_session: Session) -> str:
        """
        Submit a batch matching job for processing
        """
        try:
            # Validate job
            if not job.item_ids:
                raise ValueError("Job must contain at least one item ID")
            
            # Add to queue based on priority
            heapq.heappush(
                self.job_queue, 
                (-job.priority.value, job.created_at.timestamp(), job)
            )
            
            # Store active job
            self.active_jobs[job.job_id] = {
                'status': 'queued',
                'submitted_at': job.created_at,
                'progress': 0.0
            }
            
            logger.info(f"Submitted batch job {job.job_id} with {len(job.item_ids)} items")
            return job.job_id
            
        except Exception as e:
            logger.error(f"Error submitting batch job: {e}")
            raise
    
    async def process_batch_jobs(self, db_session: Session, 
                               max_concurrent: int = None) -> List[MatchingResult]:
        """
        Process all queued batch jobs
        """
        if not self.job_queue:
            logger.info("No jobs in queue")
            return []
        
        max_concurrent = max_concurrent or self.max_workers
        results = []
        
        with ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            # Submit jobs to thread pool
            future_to_job = {}
            
            while self.job_queue and len(future_to_job) < max_concurrent:
                _, _, job = heapq.heappop(self.job_queue)
                
                future = executor.submit(
                    self._process_single_job_sync, 
                    job, 
                    db_session
                )
                future_to_job[future] = job
                
                # Update job status
                self.active_jobs[job.job_id]['status'] = 'processing'
            
            # Process completed jobs
            for future in as_completed(future_to_job):
                job = future_to_job[future]
                
                try:
                    result = future.result()
                    results.append(result)
                    
                    # Update stats
                    self._update_processing_stats(result)
                    
                    # Clean up job tracking
                    if job.job_id in self.active_jobs:
                        del self.active_jobs[job.job_id]
                    
                    logger.info(f"Completed job {job.job_id}: {result.success}")
                    
                except Exception as e:
                    logger.error(f"Job {job.job_id} failed: {e}")
                    results.append(MatchingResult(
                        job_id=job.job_id,
                        user_id=job.user_id,
                        matches=[],
                        processing_time=0.0,
                        success=False,
                        error=str(e)
                    ))
        
        return results
    
    def _process_single_job_sync(self, job: MatchingJob, db_session: Session) -> MatchingResult:
        """
        Process a single matching job synchronously
        """
        start_time = time.time()
        
        try:
            # Run async processing in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                result = loop.run_until_complete(
                    self._process_single_job(job, db_session)
                )
            finally:
                loop.close()
            
            processing_time = time.time() - start_time
            result.processing_time = processing_time
            
            return result
            
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Error processing job {job.job_id}: {e}")
            
            return MatchingResult(
                job_id=job.job_id,
                user_id=job.user_id,
                matches=[],
                processing_time=processing_time,
                success=False,
                error=str(e)
            )
    
    async def _process_single_job(self, job: MatchingJob, db_session: Session) -> MatchingResult:
        """
        Process a single matching job
        """
        try:
            all_matches = []
            conflicts_resolved = 0
            
            # Process each item in the job
            for i, item_id in enumerate(job.item_ids):
                # Update progress
                progress = (i / len(job.item_ids)) * 100
                if job.job_id in self.active_jobs:
                    self.active_jobs[job.job_id]['progress'] = progress
                
                # Create matching context
                context = MatchingContext(
                    user_id=job.user_id,
                    item_id=item_id,
                    max_matches=job.max_matches // len(job.item_ids) + 5,
                    use_ai_enhancement=True
                )
                
                # Find matches for this item
                item_matches = await self.matching_engine.find_matches_for_item(
                    context, db_session
                )
                
                # Apply ML enhancements
                enhanced_matches = await self._apply_ml_enhancements(
                    item_matches, job.user_id, db_session
                )
                
                all_matches.extend(enhanced_matches)
            
            # Resolve conflicts and optimize match selection
            optimized_matches, resolved_conflicts = await self._resolve_conflicts_and_optimize(
                all_matches, job, db_session
            )
            
            conflicts_resolved += resolved_conflicts
            
            # Final ranking and limiting
            final_matches = self._rank_and_limit_matches(
                optimized_matches, job.max_matches
            )
            
            return MatchingResult(
                job_id=job.job_id,
                user_id=job.user_id,
                matches=final_matches,
                processing_time=0.0,  # Will be set by caller
                success=True,
                conflicts_resolved=conflicts_resolved
            )
            
        except Exception as e:
            logger.error(f"Error in job processing: {e}")
            raise
    
    async def _apply_ml_enhancements(self, matches: List[Dict[str, Any]], 
                                   user_id: str, db_session: Session) -> List[Dict[str, Any]]:
        """
        Apply ML enhancements to matches
        """
        try:
            enhanced_matches = []
            
            # Get user-specific adjustments
            adjustments = self.ml_system.get_personalized_match_adjustments(
                user_id, db_session
            )
            
            for match in matches:
                try:
                    # Create mock MatchingSuggestion object for ML prediction
                    mock_suggestion = type('MockSuggestion', (), {
                        'overall_score': match.get('overall_score', 0.5),
                        'value_compatibility_score': match.get('value_score', 0.5),
                        'geographic_score': match.get('geographic_score', 0.5),
                        'category_score': match.get('category_score', 0.5),
                        'preference_score': 0.5,
                        'confidence_level': match.get('confidence_level', 0.5),
                        'item1_estimated_value': match.get('item1_estimated_value'),
                        'item2_estimated_value': match.get('item2_estimated_value'),
                        'value_difference_percentage': match.get('value_difference_percentage'),
                        'distance_km': match.get('distance_km'),
                        'created_at': match.get('created_at', datetime.utcnow()),
                        'ml_features': match.get('features', {})
                    })()
                    
                    # Get ML prediction
                    ml_prediction = self.ml_system.predict_match_acceptance(
                        mock_suggestion
                    )
                    
                    # Apply personalized adjustments
                    adjusted_score = match['overall_score']
                    if match.get('distance_km'):
                        # Adjust based on distance preference
                        if match['distance_km'] > 50:
                            adjusted_score *= adjustments.get('distance_weight', 1.0)
                    
                    # Adjust based on ML confidence
                    confidence_boost = adjustments.get('confidence_boost', 0.0)
                    adjusted_score += confidence_boost
                    
                    # Add ML predictions to match
                    match['ml_acceptance_probability'] = ml_prediction.get('probability', 0.5)
                    match['ml_confidence'] = ml_prediction.get('confidence', 0.0)
                    match['adjusted_score'] = max(0.0, min(1.0, adjusted_score))
                    match['personalization_applied'] = True
                    
                    # Only include matches above user's threshold
                    if adjusted_score >= adjustments.get('score_threshold', 0.3):
                        enhanced_matches.append(match)
                    
                except Exception as e:
                    logger.error(f"Error applying ML enhancement to match: {e}")
                    # Include original match if ML enhancement fails
                    match['ml_acceptance_probability'] = 0.5
                    match['ml_confidence'] = 0.0
                    match['adjusted_score'] = match['overall_score']
                    match['personalization_applied'] = False
                    enhanced_matches.append(match)
            
            logger.info(f"ML enhancement: {len(matches)} -> {len(enhanced_matches)} matches")
            return enhanced_matches
            
        except Exception as e:
            logger.error(f"Error in ML enhancement: {e}")
            return matches  # Return original matches if enhancement fails
    
    async def _resolve_conflicts_and_optimize(self, matches: List[Dict[str, Any]], 
                                            job: MatchingJob, 
                                            db_session: Session) -> Tuple[List[Dict[str, Any]], int]:
        """
        Resolve conflicts where multiple users want the same item
        """
        try:
            # Group matches by target item
            item_matches = defaultdict(list)
            for match in matches:
                target_item_id = match.get('item2_id') or match.get('candidate_item', {}).get('id')
                if target_item_id:
                    item_matches[target_item_id].append(match)
            
            resolved_matches = []
            conflicts_resolved = 0
            
            for item_id, competing_matches in item_matches.items():
                if len(competing_matches) <= 1:
                    # No conflict
                    resolved_matches.extend(competing_matches)
                else:
                    # Resolve conflict
                    resolution = await self._resolve_conflict(
                        item_id, competing_matches, db_session
                    )
                    
                    if resolution:
                        # Find the winning match
                        winning_match = next(
                            (m for m in competing_matches 
                             if m.get('user1_id') == resolution.selected_user), 
                            None
                        )
                        
                        if winning_match:
                            # Mark as conflict-resolved
                            winning_match['conflict_resolved'] = True
                            winning_match['resolution_method'] = resolution.resolution_method
                            winning_match['competing_users_count'] = len(resolution.competing_users)
                            resolved_matches.append(winning_match)
                            conflicts_resolved += 1
                        
                        # Store conflict resolution for analytics
                        await self._store_conflict_resolution(resolution, db_session)
                    else:
                        # If resolution fails, include all matches
                        resolved_matches.extend(competing_matches)
            
            return resolved_matches, conflicts_resolved
            
        except Exception as e:
            logger.error(f"Error resolving conflicts: {e}")
            return matches, 0
    
    async def _resolve_conflict(self, item_id: str, competing_matches: List[Dict[str, Any]], 
                              db_session: Session) -> Optional[ConflictResolution]:
        """
        Resolve conflict between multiple users wanting the same item
        """
        try:
            if len(competing_matches) <= 1:
                return None
            
            # Extract competing users and their scores
            users_scores = {}
            for match in competing_matches:
                user_id = match.get('user1_id')
                if user_id:
                    users_scores[user_id] = {
                        'overall_score': match.get('adjusted_score', match.get('overall_score', 0)),
                        'ml_probability': match.get('ml_acceptance_probability', 0.5),
                        'timestamp': match.get('created_at', datetime.utcnow())
                    }
            
            competing_users = list(users_scores.keys())
            
            # Try different resolution strategies
            resolution_strategies = ['fairness_algorithm', 'ml_prediction', 'highest_score']
            
            for strategy in resolution_strategies:
                try:
                    resolver = self.conflict_resolvers.get(strategy)
                    if resolver:
                        selected_user = await resolver(
                            item_id, users_scores, db_session
                        )
                        
                        if selected_user:
                            return ConflictResolution(
                                item_id=item_id,
                                competing_users=competing_users,
                                selected_user=selected_user,
                                resolution_method=strategy,
                                score_differences=users_scores
                            )
                except Exception as e:
                    logger.error(f"Resolution strategy {strategy} failed: {e}")
                    continue
            
            # Fallback to first user if all strategies fail
            return ConflictResolution(
                item_id=item_id,
                competing_users=competing_users,
                selected_user=competing_users[0],
                resolution_method='fallback',
                score_differences=users_scores
            )
            
        except Exception as e:
            logger.error(f"Error in conflict resolution: {e}")
            return None
    
    # Conflict resolution strategies
    async def _resolve_by_highest_score(self, item_id: str, users_scores: Dict[str, Dict], 
                                      db_session: Session) -> Optional[str]:
        """Resolve by highest overall score"""
        try:
            best_user = max(users_scores.items(), key=lambda x: x[1]['overall_score'])
            return best_user[0]
        except Exception:
            return None
    
    async def _resolve_by_timestamp(self, item_id: str, users_scores: Dict[str, Dict], 
                                  db_session: Session) -> Optional[str]:
        """Resolve by earliest timestamp (first come, first served)"""
        try:
            earliest_user = min(users_scores.items(), key=lambda x: x[1]['timestamp'])
            return earliest_user[0]
        except Exception:
            return None
    
    async def _resolve_by_user_priority(self, item_id: str, users_scores: Dict[str, Dict], 
                                      db_session: Session) -> Optional[str]:
        """Resolve by user priority (premium users, high ratings, etc.)"""
        try:
            # This would integrate with user priority system
            # For now, fallback to highest score
            return await self._resolve_by_highest_score(item_id, users_scores, db_session)
        except Exception:
            return None
    
    async def _resolve_by_fairness(self, item_id: str, users_scores: Dict[str, Dict], 
                                 db_session: Session) -> Optional[str]:
        """Resolve by fairness algorithm (considering user history)"""
        try:
            # Get user histories to ensure fairness
            user_histories = {}
            for user_id in users_scores.keys():
                history = db_session.query(MatchingHistory).filter(
                    MatchingHistory.user_id == user_id,
                    MatchingHistory.action == 'accepted',
                    MatchingHistory.created_at >= datetime.utcnow() - timedelta(days=30)
                ).count()
                
                user_histories[user_id] = history
            
            # Favor users with fewer recent matches
            fairness_scores = {}
            for user_id, score_data in users_scores.items():
                recent_matches = user_histories.get(user_id, 0)
                # Higher score for fewer recent matches
                fairness_score = score_data['overall_score'] * (1 + 1.0 / (recent_matches + 1))
                fairness_scores[user_id] = fairness_score
            
            best_user = max(fairness_scores.items(), key=lambda x: x[1])
            return best_user[0]
            
        except Exception as e:
            logger.error(f"Fairness resolution failed: {e}")
            return None
    
    async def _resolve_by_ml_prediction(self, item_id: str, users_scores: Dict[str, Dict], 
                                      db_session: Session) -> Optional[str]:
        """Resolve by ML prediction of acceptance likelihood"""
        try:
            best_probability = -1
            best_user = None
            
            for user_id, score_data in users_scores.items():
                ml_probability = score_data.get('ml_probability', 0.5)
                if ml_probability > best_probability:
                    best_probability = ml_probability
                    best_user = user_id
            
            return best_user
            
        except Exception:
            return None
    
    def _rank_and_limit_matches(self, matches: List[Dict[str, Any]], 
                               max_matches: int) -> List[Dict[str, Any]]:
        """
        Final ranking and limiting of matches
        """
        try:
            # Sort by adjusted score (with ML and personalization)
            sorted_matches = sorted(
                matches,
                key=lambda m: (
                    m.get('adjusted_score', m.get('overall_score', 0)),
                    m.get('ml_acceptance_probability', 0.5),
                    -m.get('distance_km', 999)  # Prefer closer matches as tiebreaker
                ),
                reverse=True
            )
            
            # Limit to max_matches
            final_matches = sorted_matches[:max_matches]
            
            # Add ranking information
            for i, match in enumerate(final_matches):
                match['rank'] = i + 1
                match['total_candidates'] = len(matches)
            
            return final_matches
            
        except Exception as e:
            logger.error(f"Error ranking matches: {e}")
            return matches[:max_matches]
    
    async def _store_conflict_resolution(self, resolution: ConflictResolution, 
                                       db_session: Session):
        """Store conflict resolution for analytics"""
        try:
            # This would store conflict resolution data for analysis
            # For now, just log it
            logger.info(f"Conflict resolved for item {resolution.item_id}: "
                       f"{resolution.selected_user} chosen from {len(resolution.competing_users)} users "
                       f"using {resolution.resolution_method}")
        except Exception as e:
            logger.error(f"Error storing conflict resolution: {e}")
    
    def _update_processing_stats(self, result: MatchingResult):
        """Update processing statistics"""
        try:
            self.processing_stats['total_processed'] += 1
            
            if result.success:
                self.processing_stats['successful'] += 1
            else:
                self.processing_stats['failed'] += 1
            
            self.processing_stats['conflicts_resolved'] += result.conflicts_resolved
            
            # Update average processing time
            total = self.processing_stats['total_processed']
            current_avg = self.processing_stats['avg_processing_time']
            new_avg = ((current_avg * (total - 1)) + result.processing_time) / total
            self.processing_stats['avg_processing_time'] = new_avg
            
        except Exception as e:
            logger.error(f"Error updating stats: {e}")
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific job"""
        return self.active_jobs.get(job_id)
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get current processing statistics"""
        return self.processing_stats.copy()
    
    def clear_completed_jobs(self):
        """Clear completed job tracking"""
        completed_jobs = [
            job_id for job_id, status in self.active_jobs.items()
            if status.get('status') in ['completed', 'failed']
        ]
        
        for job_id in completed_jobs:
            del self.active_jobs[job_id]
        
        logger.info(f"Cleared {len(completed_jobs)} completed jobs")


# Export main class
__all__ = ['BatchMatchingSystem', 'MatchingJob', 'MatchingResult', 'MatchingPriority']