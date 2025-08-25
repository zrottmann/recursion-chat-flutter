"""
Performance Optimization System for Trading Post
Analyzes and optimizes system performance bottlenecks
"""

import os
import time
import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict
import psutil
import sqlite3
from contextlib import asynccontextmanager
from sqlalchemy import text, create_engine, inspect
from sqlalchemy.orm import sessionmaker
import cachetools
import hashlib
from functools import wraps
import threading
import gc

logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///trading_post.db")
CACHE_SIZE = int(os.getenv("CACHE_SIZE", "1000"))
CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes
SLOW_QUERY_THRESHOLD = float(os.getenv("SLOW_QUERY_THRESHOLD", "1.0"))  # 1 second
MEMORY_ALERT_THRESHOLD = float(os.getenv("MEMORY_ALERT_THRESHOLD", "80.0"))  # 80%
CPU_ALERT_THRESHOLD = float(os.getenv("CPU_ALERT_THRESHOLD", "70.0"))  # 70%

# Database connection for analysis
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# In-memory cache
cache = cachetools.TTLCache(maxsize=CACHE_SIZE, ttl=CACHE_TTL)
cache_lock = threading.RLock()


@dataclass
class PerformanceBottleneck:
    """Represents a identified performance bottleneck"""
    category: str  # database, memory, cpu, network, cache
    severity: str  # low, medium, high, critical
    description: str
    impact: str
    recommendation: str
    metric_value: float
    threshold: float
    endpoint: Optional[str] = None
    query: Optional[str] = None


@dataclass
class DatabaseOptimization:
    """Database optimization recommendation"""
    table: str
    optimization_type: str  # index, query_rewrite, normalization
    recommendation: str
    estimated_improvement: str
    sql_command: Optional[str] = None


@dataclass
class SystemPerformanceSnapshot:
    """Current system performance snapshot"""
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    active_connections: int
    cache_hit_rate: float
    slow_queries_count: int
    avg_response_time: float
    timestamp: datetime


class PerformanceOptimizer:
    """Main performance optimization and analysis system"""
    
    def __init__(self):
        self.bottlenecks: List[PerformanceBottleneck] = []
        self.optimizations: List[DatabaseOptimization] = []
        self.baseline_metrics = None
        self.query_cache = {}
        self.slow_queries = []
        
        # Import error monitoring if available
        try:
            from error_monitoring import error_monitor
            self.error_monitor = error_monitor
            logger.info("✅ Performance optimizer integrated with error monitoring")
        except ImportError:
            self.error_monitor = None
            logger.warning("⚠️ Error monitoring not available for performance analysis")
    
    async def analyze_system_performance(self) -> Dict[str, Any]:
        """Comprehensive system performance analysis"""
        logger.info("🔍 Starting comprehensive performance analysis...")
        
        # Get current system snapshot
        snapshot = self._get_system_snapshot()
        
        # Analyze different performance aspects
        analysis_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "system_snapshot": asdict(snapshot),
            "database_analysis": await self._analyze_database_performance(),
            "endpoint_analysis": await self._analyze_endpoint_performance(),
            "memory_analysis": self._analyze_memory_usage(),
            "cpu_analysis": self._analyze_cpu_usage(),
            "cache_analysis": self._analyze_cache_performance(),
            "bottlenecks": [asdict(b) for b in self.bottlenecks],
            "recommendations": [asdict(o) for o in self.optimizations]
        }
        
        logger.info(f"📊 Performance analysis completed. Found {len(self.bottlenecks)} bottlenecks")
        return analysis_results
    
    def _get_system_snapshot(self) -> SystemPerformanceSnapshot:
        """Get current system performance snapshot"""
        try:
            # System metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_info = psutil.virtual_memory()
            disk_info = psutil.disk_usage('/')
            
            # Cache metrics
            with cache_lock:
                cache_info = cache.currsize
                cache_max = cache.maxsize
                cache_hit_rate = getattr(cache, 'hit_rate', 0.0)
            
            # Database connections (approximate)
            active_connections = self._count_db_connections()
            
            # Performance metrics from monitoring system
            avg_response_time = 0.0
            slow_queries_count = len(self.slow_queries)
            
            if self.error_monitor:
                try:
                    perf_summary = self.error_monitor.get_performance_summary(hours=1)
                    avg_response_time = perf_summary.get("avg_response_time", 0.0)
                except Exception as e:
                    logger.warning(f"Could not get performance summary: {e}")
            
            return SystemPerformanceSnapshot(
                cpu_percent=cpu_percent,
                memory_percent=memory_info.percent,
                disk_usage_percent=disk_info.percent,
                active_connections=active_connections,
                cache_hit_rate=cache_hit_rate,
                slow_queries_count=slow_queries_count,
                avg_response_time=avg_response_time,
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error getting system snapshot: {e}")
            return SystemPerformanceSnapshot(
                cpu_percent=0.0, memory_percent=0.0, disk_usage_percent=0.0,
                active_connections=0, cache_hit_rate=0.0, slow_queries_count=0,
                avg_response_time=0.0, timestamp=datetime.utcnow()
            )
    
    async def _analyze_database_performance(self) -> Dict[str, Any]:
        """Analyze database performance and identify slow queries"""
        logger.info("🗄️ Analyzing database performance...")
        
        try:
            db = SessionLocal()
            inspector = inspect(engine)
            
            analysis = {
                "tables": [],
                "indexes": [],
                "slow_queries": [],
                "recommendations": []
            }
            
            # Analyze each table
            for table_name in inspector.get_table_names():
                table_info = await self._analyze_table_performance(db, table_name)
                analysis["tables"].append(table_info)
                
                # Check for missing indexes
                if table_info["row_count"] > 1000 and not table_info["has_indexes"]:
                    self.optimizations.append(DatabaseOptimization(
                        table=table_name,
                        optimization_type="index",
                        recommendation=f"Add indexes to table '{table_name}' for better query performance",
                        estimated_improvement="50-80% faster queries",
                        sql_command=f"CREATE INDEX idx_{table_name}_id ON {table_name} (id);"
                    ))
            
            # Analyze query patterns
            slow_queries = self._identify_slow_queries()
            analysis["slow_queries"] = slow_queries
            
            db.close()
            return analysis
            
        except Exception as e:
            logger.error(f"Database analysis failed: {e}")
            return {"error": str(e)}
    
    async def _analyze_table_performance(self, db, table_name: str) -> Dict[str, Any]:
        """Analyze individual table performance"""
        try:
            # Get table row count
            result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            row_count = result.scalar()
            
            # Check for indexes
            inspector = inspect(engine)
            indexes = inspector.get_indexes(table_name)
            has_indexes = len(indexes) > 0
            
            # Estimate table size (simplified)
            table_size_query = f"SELECT COUNT(*) * AVG(LENGTH(CAST({table_name}.* AS TEXT))) FROM {table_name}"
            try:
                size_result = db.execute(text(table_size_query))
                estimated_size = size_result.scalar() or 0
            except:
                estimated_size = row_count * 100  # Rough estimate
            
            table_info = {
                "table_name": table_name,
                "row_count": row_count,
                "has_indexes": has_indexes,
                "index_count": len(indexes),
                "estimated_size_bytes": estimated_size,
                "indexes": [idx["name"] for idx in indexes]
            }
            
            # Add performance recommendations
            if row_count > 10000 and not has_indexes:
                self.bottlenecks.append(PerformanceBottleneck(
                    category="database",
                    severity="high",
                    description=f"Table '{table_name}' has {row_count} rows but no indexes",
                    impact="Slow query performance, full table scans",
                    recommendation=f"Add appropriate indexes to table '{table_name}'",
                    metric_value=row_count,
                    threshold=10000
                ))
            
            return table_info
            
        except Exception as e:
            logger.error(f"Error analyzing table {table_name}: {e}")
            return {"table_name": table_name, "error": str(e)}
    
    def _identify_slow_queries(self) -> List[Dict[str, Any]]:
        """Identify potentially slow queries"""
        # This is a simplified analysis - in production you'd analyze query logs
        slow_query_patterns = [
            {
                "pattern": "SELECT * FROM items WHERE",
                "issue": "Using SELECT * can be inefficient",
                "recommendation": "Select only needed columns"
            },
            {
                "pattern": "WHERE title LIKE '%",
                "issue": "Leading wildcard prevents index usage",
                "recommendation": "Use full-text search or avoid leading wildcards"
            },
            {
                "pattern": "ORDER BY created_at",
                "issue": "Sorting without index can be slow",
                "recommendation": "Add index on created_at column"
            }
        ]
        
        return slow_query_patterns
    
    async def _analyze_endpoint_performance(self) -> Dict[str, Any]:
        """Analyze API endpoint performance"""
        logger.info("🌐 Analyzing endpoint performance...")
        
        if not self.error_monitor:
            return {"message": "Error monitoring not available"}
        
        try:
            perf_summary = self.error_monitor.get_performance_summary(hours=24)
            
            analysis = {
                "total_requests": perf_summary.get("total_requests", 0),
                "avg_response_time": perf_summary.get("avg_response_time", 0),
                "slow_endpoints": [],
                "recommendations": []
            }
            
            # Identify slow endpoints
            endpoints = perf_summary.get("by_endpoint", {})
            for endpoint, metrics in endpoints.items():
                if metrics["avg_response_time"] > SLOW_QUERY_THRESHOLD:
                    analysis["slow_endpoints"].append({
                        "endpoint": endpoint,
                        "avg_response_time": metrics["avg_response_time"],
                        "requests": metrics["requests"],
                        "slow_requests": metrics.get("slow_requests", 0)
                    })
                    
                    # Add bottleneck
                    self.bottlenecks.append(PerformanceBottleneck(
                        category="network",
                        severity="medium" if metrics["avg_response_time"] < 3.0 else "high",
                        description=f"Endpoint '{endpoint}' has slow response time",
                        impact="Poor user experience, potential timeouts",
                        recommendation="Optimize endpoint logic, add caching, or database indexes",
                        metric_value=metrics["avg_response_time"],
                        threshold=SLOW_QUERY_THRESHOLD,
                        endpoint=endpoint
                    ))
            
            return analysis
            
        except Exception as e:
            logger.error(f"Endpoint analysis failed: {e}")
            return {"error": str(e)}
    
    def _analyze_memory_usage(self) -> Dict[str, Any]:
        """Analyze memory usage patterns"""
        logger.info("🧠 Analyzing memory usage...")
        
        try:
            memory_info = psutil.virtual_memory()
            process = psutil.Process()
            process_memory = process.memory_info()
            
            analysis = {
                "system_memory_percent": memory_info.percent,
                "process_memory_mb": process_memory.rss / 1024 / 1024,
                "available_memory_mb": memory_info.available / 1024 / 1024,
                "cache_memory_usage": len(cache) * 0.001,  # Rough estimate
                "recommendations": []
            }
            
            # Check for memory issues
            if memory_info.percent > MEMORY_ALERT_THRESHOLD:
                self.bottlenecks.append(PerformanceBottleneck(
                    category="memory",
                    severity="critical" if memory_info.percent > 90 else "high",
                    description=f"High memory usage: {memory_info.percent:.1f}%",
                    impact="System slowdown, potential crashes",
                    recommendation="Implement memory optimization, reduce cache size, or add garbage collection",
                    metric_value=memory_info.percent,
                    threshold=MEMORY_ALERT_THRESHOLD
                ))
                
                analysis["recommendations"].append("Consider increasing system memory or optimizing memory usage")
            
            # Force garbage collection to free up memory
            if memory_info.percent > 85:
                gc.collect()
                logger.info("🗑️ Performed garbage collection due to high memory usage")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Memory analysis failed: {e}")
            return {"error": str(e)}
    
    def _analyze_cpu_usage(self) -> Dict[str, Any]:
        """Analyze CPU usage patterns"""
        logger.info("⚙️ Analyzing CPU usage...")
        
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
            
            analysis = {
                "cpu_percent": cpu_percent,
                "cpu_count": cpu_count,
                "load_average": load_avg,
                "recommendations": []
            }
            
            # Check for CPU issues
            if cpu_percent > CPU_ALERT_THRESHOLD:
                self.bottlenecks.append(PerformanceBottleneck(
                    category="cpu",
                    severity="critical" if cpu_percent > 90 else "high",
                    description=f"High CPU usage: {cpu_percent:.1f}%",
                    impact="System slowdown, request timeouts",
                    recommendation="Optimize CPU-intensive operations, add caching, or scale horizontally",
                    metric_value=cpu_percent,
                    threshold=CPU_ALERT_THRESHOLD
                ))
                
                analysis["recommendations"].append("Consider optimizing algorithms or adding more CPU cores")
            
            return analysis
            
        except Exception as e:
            logger.error(f"CPU analysis failed: {e}")
            return {"error": str(e)}
    
    def _analyze_cache_performance(self) -> Dict[str, Any]:
        """Analyze cache performance and hit rates"""
        logger.info("💾 Analyzing cache performance...")
        
        try:
            with cache_lock:
                cache_info = {
                    "current_size": cache.currsize,
                    "max_size": cache.maxsize,
                    "usage_percent": (cache.currsize / cache.maxsize * 100) if cache.maxsize > 0 else 0,
                    "ttl": CACHE_TTL
                }
            
            analysis = {
                "cache_info": cache_info,
                "recommendations": []
            }
            
            # Cache recommendations
            if cache_info["usage_percent"] > 90:
                analysis["recommendations"].append("Consider increasing cache size or reducing TTL")
                
                self.bottlenecks.append(PerformanceBottleneck(
                    category="cache",
                    severity="medium",
                    description="Cache is nearly full",
                    impact="Cache evictions, reduced hit rate",
                    recommendation="Increase cache size or optimize cache usage",
                    metric_value=cache_info["usage_percent"],
                    threshold=90.0
                ))
            
            return analysis
            
        except Exception as e:
            logger.error(f"Cache analysis failed: {e}")
            return {"error": str(e)}
    
    def _count_db_connections(self) -> int:
        """Count active database connections"""
        try:
            # For SQLite, this is always 1 per process
            # For PostgreSQL/MySQL, you'd query system tables
            return 1
        except:
            return 0
    
    async def optimize_database_indexes(self) -> Dict[str, Any]:
        """Automatically optimize database indexes"""
        logger.info("🔧 Optimizing database indexes...")
        
        try:
            db = SessionLocal()
            optimizations_applied = []
            
            # Create common indexes for better performance
            index_recommendations = [
                {
                    "table": "items",
                    "columns": ["created_at"],
                    "sql": "CREATE INDEX IF NOT EXISTS idx_items_created_at ON items (created_at DESC);"
                },
                {
                    "table": "items", 
                    "columns": ["user_id"],
                    "sql": "CREATE INDEX IF NOT EXISTS idx_items_user_id ON items (user_id);"
                },
                {
                    "table": "items",
                    "columns": ["category"],
                    "sql": "CREATE INDEX IF NOT EXISTS idx_items_category ON items (category);"
                },
                {
                    "table": "trades",
                    "columns": ["status"],
                    "sql": "CREATE INDEX IF NOT EXISTS idx_trades_status ON trades (status);"
                },
                {
                    "table": "trades",
                    "columns": ["created_at"],
                    "sql": "CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades (created_at DESC);"
                }
            ]
            
            for idx in index_recommendations:
                try:
                    db.execute(text(idx["sql"]))
                    optimizations_applied.append(f"Created index on {idx['table']}({', '.join(idx['columns'])})")
                    logger.info(f"✅ Created index: {idx['sql']}")
                except Exception as e:
                    logger.warning(f"Could not create index: {e}")
            
            db.commit()
            db.close()
            
            return {
                "optimizations_applied": optimizations_applied,
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"Database optimization failed: {e}")
            return {"error": str(e)}
    
    def implement_caching_decorator(self):
        """Decorator for caching function results"""
        def cache_decorator(cache_key_func=None, ttl=CACHE_TTL):
            def decorator(func):
                @wraps(func)
                async def async_wrapper(*args, **kwargs):
                    # Generate cache key
                    if cache_key_func:
                        cache_key = cache_key_func(*args, **kwargs)
                    else:
                        cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
                    
                    # Check cache
                    with cache_lock:
                        if cache_key in cache:
                            logger.debug(f"Cache hit for {cache_key}")
                            return cache[cache_key]
                    
                    # Execute function and cache result
                    result = await func(*args, **kwargs)
                    
                    with cache_lock:
                        cache[cache_key] = result
                        logger.debug(f"Cached result for {cache_key}")
                    
                    return result
                
                @wraps(func)
                def sync_wrapper(*args, **kwargs):
                    # Generate cache key
                    if cache_key_func:
                        cache_key = cache_key_func(*args, **kwargs)
                    else:
                        cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
                    
                    # Check cache
                    with cache_lock:
                        if cache_key in cache:
                            logger.debug(f"Cache hit for {cache_key}")
                            return cache[cache_key]
                    
                    # Execute function and cache result
                    result = func(*args, **kwargs)
                    
                    with cache_lock:
                        cache[cache_key] = result
                        logger.debug(f"Cached result for {cache_key}")
                    
                    return result
                
                return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
            return decorator
        return cache_decorator
    
    async def generate_optimization_report(self) -> str:
        """Generate comprehensive optimization report"""
        analysis = await self.analyze_system_performance()
        
        report = f"""
# Trading Post Performance Optimization Report
Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

## System Overview
- CPU Usage: {analysis['system_snapshot']['cpu_percent']:.1f}%
- Memory Usage: {analysis['system_snapshot']['memory_percent']:.1f}%
- Disk Usage: {analysis['system_snapshot']['disk_usage_percent']:.1f}%
- Average Response Time: {analysis['system_snapshot']['avg_response_time']:.3f}s

## Performance Bottlenecks ({len(self.bottlenecks)} found)
"""
        
        for bottleneck in self.bottlenecks:
            severity_emoji = "🚨" if bottleneck.severity == "critical" else "⚠️" if bottleneck.severity == "high" else "ℹ️"
            report += f"""
{severity_emoji} **{bottleneck.severity.upper()}**: {bottleneck.description}
- Impact: {bottleneck.impact}
- Recommendation: {bottleneck.recommendation}
- Current Value: {bottleneck.metric_value:.2f} (Threshold: {bottleneck.threshold:.2f})
"""
        
        report += f"""

## Database Optimizations ({len(self.optimizations)} recommendations)
"""
        
        for opt in self.optimizations:
            report += f"""
- **{opt.table}** ({opt.optimization_type}): {opt.recommendation}
  - Estimated Improvement: {opt.estimated_improvement}
"""
            if opt.sql_command:
                report += f"  - SQL: `{opt.sql_command}`\n"
        
        report += """

## Next Steps
1. Apply recommended database indexes
2. Implement caching for frequently accessed data
3. Monitor system resources and set up alerts
4. Consider horizontal scaling if CPU/memory limits are reached
5. Optimize slow endpoints identified in the analysis

---
🤖 Generated by Trading Post Performance Optimizer
"""
        
        return report


# Global instance
performance_optimizer = PerformanceOptimizer()

# Export the cache decorator for use in other modules
cached = performance_optimizer.implement_caching_decorator()

# Helper functions for easy integration
async def analyze_performance():
    """Quick performance analysis"""
    return await performance_optimizer.analyze_system_performance()

async def optimize_system():
    """Apply automatic optimizations"""
    db_result = await performance_optimizer.optimize_database_indexes()
    return db_result

async def get_performance_report():
    """Get formatted performance report"""
    return await performance_optimizer.generate_optimization_report()

# Export everything
__all__ = [
    'PerformanceOptimizer',
    'PerformanceBottleneck', 
    'DatabaseOptimization',
    'SystemPerformanceSnapshot',
    'performance_optimizer',
    'cached',
    'analyze_performance',
    'optimize_system',
    'get_performance_report'
]