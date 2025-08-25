"""
Comprehensive Error Monitoring and Alert System for Trading Post
Provides real-time error tracking, performance monitoring, and system health analysis
"""

import os
import json
import time
import asyncio
import logging
import traceback
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import threading
from contextlib import asynccontextmanager
import aiofiles
import psutil
from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///trading_post.db")
MONITORING_ENABLED = os.getenv("ERROR_MONITORING_ENABLED", "true").lower() == "true"
ALERT_EMAIL = os.getenv("ALERT_EMAIL", "admin@tradingpost.com")
SMTP_SERVER = os.getenv("SMTP_SERVER", "localhost")
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL", "")
MAX_ERROR_QUEUE_SIZE = 1000
CRITICAL_ERROR_THRESHOLD = 10  # errors per minute
PERFORMANCE_ALERT_THRESHOLD = 5.0  # seconds

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@dataclass
class ErrorContext:
    """Context information for error tracking"""
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    additional_data: Dict[str, Any] = None


@dataclass
class PerformanceMetrics:
    """Performance metrics data structure"""
    endpoint: str
    method: str
    response_time: float
    status_code: int
    memory_usage: float
    cpu_usage: float
    timestamp: datetime


@dataclass
class SystemHealthMetrics:
    """System health metrics"""
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    active_connections: int
    error_rate: float
    avg_response_time: float
    timestamp: datetime


# Database Models
class ErrorLog(Base):
    """Database model for error logging"""
    __tablename__ = "error_logs"

    id = Column(String, primary_key=True, index=True)
    error_type = Column(String, nullable=False)
    error_message = Column(Text, nullable=False)
    error_level = Column(String, default="ERROR")  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    stack_trace = Column(Text)
    context_data = Column(JSON)
    user_id = Column(Integer, nullable=True)
    session_id = Column(String, nullable=True)
    request_id = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    method = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class PerformanceLog(Base):
    """Database model for performance tracking"""
    __tablename__ = "performance_logs"

    id = Column(Integer, primary_key=True, index=True)
    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)
    response_time = Column(Float, nullable=False)
    status_code = Column(Integer, nullable=False)
    memory_usage_mb = Column(Float)
    cpu_usage_percent = Column(Float)
    request_size_bytes = Column(Integer)
    response_size_bytes = Column(Integer)
    user_id = Column(Integer, nullable=True)
    session_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemHealthLog(Base):
    """Database model for system health monitoring"""
    __tablename__ = "system_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    cpu_percent = Column(Float, nullable=False)
    memory_percent = Column(Float, nullable=False)
    disk_usage_percent = Column(Float, nullable=False)
    active_connections = Column(Integer, default=0)
    error_rate_per_minute = Column(Float, default=0.0)
    avg_response_time = Column(Float, default=0.0)
    alerts_triggered = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertLog(Base):
    """Database model for alert tracking"""
    __tablename__ = "alert_logs"

    id = Column(String, primary_key=True, index=True)
    alert_type = Column(String, nullable=False)  # 'error', 'performance', 'health'
    severity = Column(String, nullable=False)  # 'low', 'medium', 'high', 'critical'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    alert_data = Column(JSON)
    notification_sent = Column(Boolean, default=False)
    notification_channels = Column(JSON)  # ['email', 'slack', 'webhook']
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)


# Create tables
Base.metadata.create_all(bind=engine)


class ErrorMonitor:
    """Central error monitoring and tracking system"""
    
    def __init__(self):
        self.error_queue = deque(maxlen=MAX_ERROR_QUEUE_SIZE)
        self.performance_queue = deque(maxlen=MAX_ERROR_QUEUE_SIZE)
        self.error_counts = defaultdict(int)
        self.performance_data = defaultdict(list)
        self.alert_cooldowns = {}  # Prevent spam alerts
        self.monitoring_active = MONITORING_ENABLED
        self.startup_time = datetime.utcnow()
        
        # Start background monitoring
        if self.monitoring_active:
            self._start_background_monitoring()
    
    def log_error(self, 
                  error: Exception, 
                  context: ErrorContext = None,
                  level: str = "ERROR",
                  additional_data: Dict = None) -> str:
        """Log error with comprehensive context"""
        
        if not self.monitoring_active:
            return None
            
        try:
            error_id = str(uuid.uuid4())
            context = context or ErrorContext()
            
            # Extract error information
            error_type = type(error).__name__
            error_message = str(error)
            stack_trace = traceback.format_exc() if hasattr(error, '__traceback__') else ""
            
            # Create comprehensive context data
            context_data = {
                "error_id": error_id,
                "timestamp": datetime.utcnow().isoformat(),
                "additional_data": additional_data or {},
                "system_info": self._get_system_info()
            }
            
            if context.additional_data:
                context_data["context"] = context.additional_data
            
            # Store in database
            self._store_error_in_db(
                error_id, error_type, error_message, level, 
                stack_trace, context_data, context
            )
            
            # Add to in-memory queue for real-time monitoring
            error_entry = {
                "id": error_id,
                "type": error_type,
                "message": error_message,
                "level": level,
                "timestamp": datetime.utcnow(),
                "context": asdict(context) if context else {}
            }
            self.error_queue.append(error_entry)
            
            # Update error counts for rate monitoring
            minute_key = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
            self.error_counts[minute_key] += 1
            
            # Check for critical error rate
            if self._check_critical_error_rate():
                self._trigger_critical_alert(error_entry)
            
            # Check for specific error patterns
            self._check_error_patterns(error_entry)
            
            logger.error(f"Error logged: {error_id} - {error_type}: {error_message}")
            return error_id
            
        except Exception as monitoring_error:
            # Never let monitoring errors break the application
            logger.error(f"Error monitoring failed: {monitoring_error}")
            return None
    
    def log_performance(self, metrics: PerformanceMetrics) -> None:
        """Log performance metrics"""
        
        if not self.monitoring_active:
            return
            
        try:
            # Store in database
            self._store_performance_in_db(metrics)
            
            # Add to in-memory queue
            self.performance_queue.append(asdict(metrics))
            
            # Track performance by endpoint
            endpoint_key = f"{metrics.method}:{metrics.endpoint}"
            self.performance_data[endpoint_key].append(metrics.response_time)
            
            # Keep only recent data (last 100 requests per endpoint)
            if len(self.performance_data[endpoint_key]) > 100:
                self.performance_data[endpoint_key] = self.performance_data[endpoint_key][-100:]
            
            # Check for performance alerts
            if metrics.response_time > PERFORMANCE_ALERT_THRESHOLD:
                self._trigger_performance_alert(metrics)
                
        except Exception as e:
            logger.error(f"Performance logging failed: {e}")
    
    def get_error_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get error summary for specified time period"""
        
        try:
            db = SessionLocal()
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            # Get error counts by type
            errors = db.query(ErrorLog).filter(ErrorLog.created_at >= cutoff_time).all()
            
            summary = {
                "total_errors": len(errors),
                "period_hours": hours,
                "by_type": defaultdict(int),
                "by_level": defaultdict(int),
                "by_endpoint": defaultdict(int),
                "unresolved_count": 0,
                "recent_errors": []
            }
            
            for error in errors:
                summary["by_type"][error.error_type] += 1
                summary["by_level"][error.error_level] += 1
                if error.endpoint:
                    summary["by_endpoint"][error.endpoint] += 1
                if not error.resolved:
                    summary["unresolved_count"] += 1
            
            # Get recent errors (last 10)
            recent_errors = db.query(ErrorLog)\
                           .filter(ErrorLog.created_at >= cutoff_time)\
                           .order_by(ErrorLog.created_at.desc())\
                           .limit(10).all()
            
            summary["recent_errors"] = [
                {
                    "id": err.id,
                    "type": err.error_type,
                    "message": err.error_message[:100] + "..." if len(err.error_message) > 100 else err.error_message,
                    "level": err.error_level,
                    "endpoint": err.endpoint,
                    "created_at": err.created_at.isoformat()
                }
                for err in recent_errors
            ]
            
            db.close()
            return dict(summary)
            
        except Exception as e:
            logger.error(f"Failed to get error summary: {e}")
            return {"error": str(e)}
    
    def get_performance_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get performance summary for specified time period"""
        
        try:
            db = SessionLocal()
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)
            
            performance_logs = db.query(PerformanceLog)\
                             .filter(PerformanceLog.created_at >= cutoff_time)\
                             .all()
            
            if not performance_logs:
                return {"message": "No performance data available"}
            
            # Calculate metrics
            response_times = [log.response_time for log in performance_logs]
            
            summary = {
                "period_hours": hours,
                "total_requests": len(performance_logs),
                "avg_response_time": sum(response_times) / len(response_times),
                "max_response_time": max(response_times),
                "min_response_time": min(response_times),
                "slow_requests": len([rt for rt in response_times if rt > PERFORMANCE_ALERT_THRESHOLD]),
                "by_endpoint": {},
                "by_status_code": defaultdict(int)
            }
            
            # Group by endpoint
            endpoint_data = defaultdict(list)
            for log in performance_logs:
                endpoint_key = f"{log.method} {log.endpoint}"
                endpoint_data[endpoint_key].append(log.response_time)
                summary["by_status_code"][log.status_code] += 1
            
            # Calculate per-endpoint metrics
            for endpoint, times in endpoint_data.items():
                summary["by_endpoint"][endpoint] = {
                    "requests": len(times),
                    "avg_response_time": sum(times) / len(times),
                    "max_response_time": max(times),
                    "slow_requests": len([t for t in times if t > PERFORMANCE_ALERT_THRESHOLD])
                }
            
            db.close()
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get performance summary: {e}")
            return {"error": str(e)}
    
    def get_system_health(self) -> SystemHealthMetrics:
        """Get current system health metrics"""
        
        try:
            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Calculate error rate (errors per minute)
            current_minute = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
            error_rate = self.error_counts.get(current_minute, 0)
            
            # Calculate average response time
            recent_times = []
            for times_list in list(self.performance_data.values()):
                recent_times.extend(times_list[-10:])  # Last 10 requests per endpoint
            
            avg_response_time = sum(recent_times) / len(recent_times) if recent_times else 0.0
            
            return SystemHealthMetrics(
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                disk_usage_percent=(disk.used / disk.total) * 100,
                active_connections=len(self.performance_queue),  # Approximate
                error_rate=error_rate,
                avg_response_time=avg_response_time,
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Failed to get system health: {e}")
            return SystemHealthMetrics(
                cpu_percent=0, memory_percent=0, disk_usage_percent=0,
                active_connections=0, error_rate=0, avg_response_time=0,
                timestamp=datetime.utcnow()
            )
    
    def _store_error_in_db(self, error_id: str, error_type: str, error_message: str,
                          level: str, stack_trace: str, context_data: Dict, context: ErrorContext):
        """Store error in database"""
        
        try:
            db = SessionLocal()
            
            error_log = ErrorLog(
                id=error_id,
                error_type=error_type,
                error_message=error_message,
                error_level=level,
                stack_trace=stack_trace,
                context_data=context_data,
                user_id=context.user_id if context else None,
                session_id=context.session_id if context else None,
                request_id=context.request_id if context else None,
                endpoint=context.endpoint if context else None,
                method=context.method if context else None,
                ip_address=context.ip_address if context else None,
                user_agent=context.user_agent if context else None
            )
            
            db.add(error_log)
            db.commit()
            db.close()
            
        except Exception as e:
            logger.error(f"Failed to store error in database: {e}")
    
    def _store_performance_in_db(self, metrics: PerformanceMetrics):
        """Store performance metrics in database"""
        
        try:
            db = SessionLocal()
            
            perf_log = PerformanceLog(
                endpoint=metrics.endpoint,
                method=metrics.method,
                response_time=metrics.response_time,
                status_code=metrics.status_code,
                memory_usage_mb=metrics.memory_usage,
                cpu_usage_percent=metrics.cpu_usage
            )
            
            db.add(perf_log)
            db.commit()
            db.close()
            
        except Exception as e:
            logger.error(f"Failed to store performance data: {e}")
    
    def _check_critical_error_rate(self) -> bool:
        """Check if error rate exceeds critical threshold"""
        
        current_minute = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
        error_count = self.error_counts.get(current_minute, 0)
        
        return error_count >= CRITICAL_ERROR_THRESHOLD
    
    def _check_error_patterns(self, error_entry: Dict):
        """Check for specific error patterns that need immediate attention"""
        
        critical_patterns = [
            "database connection",
            "authentication failed",
            "payment processing",
            "security violation",
            "data corruption"
        ]
        
        error_message = error_entry.get("message", "").lower()
        
        for pattern in critical_patterns:
            if pattern in error_message:
                self._trigger_pattern_alert(error_entry, pattern)
                break
    
    def _trigger_critical_alert(self, error_entry: Dict):
        """Trigger alert for critical error rate"""
        
        alert_id = f"critical_rate_{int(time.time())}"
        
        # Check cooldown (don't spam alerts)
        if alert_id in self.alert_cooldowns:
            return
        
        self.alert_cooldowns[alert_id] = time.time()
        
        alert_data = {
            "alert_id": alert_id,
            "type": "critical_error_rate",
            "threshold": CRITICAL_ERROR_THRESHOLD,
            "current_rate": self.error_counts.get(datetime.utcnow().strftime("%Y-%m-%d %H:%M"), 0),
            "recent_error": error_entry
        }
        
        self._send_alert("Critical Error Rate", f"Error rate exceeded {CRITICAL_ERROR_THRESHOLD} errors/minute", "critical", alert_data)
    
    def _trigger_performance_alert(self, metrics: PerformanceMetrics):
        """Trigger alert for slow performance"""
        
        alert_id = f"slow_response_{metrics.endpoint}_{int(time.time())}"
        
        # Check cooldown (5 minutes)
        cooldown_key = f"slow_response_{metrics.endpoint}"
        if cooldown_key in self.alert_cooldowns and time.time() - self.alert_cooldowns[cooldown_key] < 300:
            return
        
        self.alert_cooldowns[cooldown_key] = time.time()
        
        alert_data = {
            "endpoint": metrics.endpoint,
            "method": metrics.method,
            "response_time": metrics.response_time,
            "threshold": PERFORMANCE_ALERT_THRESHOLD
        }
        
        self._send_alert(
            "Slow Response Time", 
            f"Endpoint {metrics.endpoint} responded in {metrics.response_time:.2f}s (threshold: {PERFORMANCE_ALERT_THRESHOLD}s)",
            "medium",
            alert_data
        )
    
    def _trigger_pattern_alert(self, error_entry: Dict, pattern: str):
        """Trigger alert for specific error pattern"""
        
        alert_id = f"pattern_{pattern}_{int(time.time())}"
        
        # Check cooldown (10 minutes for pattern alerts)
        cooldown_key = f"pattern_{pattern}"
        if cooldown_key in self.alert_cooldowns and time.time() - self.alert_cooldowns[cooldown_key] < 600:
            return
        
        self.alert_cooldowns[cooldown_key] = time.time()
        
        alert_data = {
            "pattern": pattern,
            "error_entry": error_entry
        }
        
        self._send_alert(
            f"Critical Error Pattern: {pattern}",
            f"Detected critical error pattern '{pattern}' in: {error_entry.get('message', '')[:100]}",
            "high",
            alert_data
        )
    
    def _send_alert(self, title: str, message: str, severity: str, alert_data: Dict):
        """Send alert through configured channels"""
        
        try:
            alert_id = str(uuid.uuid4())
            
            # Store alert in database
            db = SessionLocal()
            alert_log = AlertLog(
                id=alert_id,
                alert_type="error",
                severity=severity,
                title=title,
                message=message,
                alert_data=alert_data
            )
            db.add(alert_log)
            db.commit()
            db.close()
            
            # Send notifications (async)
            asyncio.create_task(self._send_notifications(alert_id, title, message, severity, alert_data))
            
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
    
    async def _send_notifications(self, alert_id: str, title: str, message: str, severity: str, alert_data: Dict):
        """Send notifications through various channels"""
        
        notifications_sent = []
        
        try:
            # Email notification
            if ALERT_EMAIL and severity in ["high", "critical"]:
                await self._send_email_alert(title, message, alert_data)
                notifications_sent.append("email")
            
            # Slack notification
            if SLACK_WEBHOOK and severity in ["medium", "high", "critical"]:
                await self._send_slack_alert(title, message, severity, alert_data)
                notifications_sent.append("slack")
            
            # Update alert log with notification status
            db = SessionLocal()
            alert = db.query(AlertLog).filter(AlertLog.id == alert_id).first()
            if alert:
                alert.notification_sent = len(notifications_sent) > 0
                alert.notification_channels = notifications_sent
                db.commit()
            db.close()
            
        except Exception as e:
            logger.error(f"Failed to send notifications: {e}")
    
    async def _send_email_alert(self, title: str, message: str, alert_data: Dict):
        """Send email alert"""
        
        try:
            msg = MIMEMultipart()
            msg['From'] = "alerts@tradingpost.com"
            msg['To'] = ALERT_EMAIL
            msg['Subject'] = f"[Trading Post Alert] {title}"
            
            body = f"""
            Trading Post Alert
            
            Title: {title}
            Message: {message}
            Time: {datetime.utcnow().isoformat()}
            
            Alert Data:
            {json.dumps(alert_data, indent=2)}
            
            ---
            Trading Post Error Monitoring System
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(SMTP_SERVER, 587)
            server.starttls()
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email alert sent: {title}")
            
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
    
    async def _send_slack_alert(self, title: str, message: str, severity: str, alert_data: Dict):
        """Send Slack alert"""
        
        try:
            color_map = {
                "low": "#36a64f",      # Green
                "medium": "#ff9500",    # Orange  
                "high": "#ff0000",      # Red
                "critical": "#8B0000"   # Dark Red
            }
            
            payload = {
                "attachments": [
                    {
                        "color": color_map.get(severity, "#ff9500"),
                        "title": f"🚨 {title}",
                        "text": message,
                        "fields": [
                            {
                                "title": "Severity",
                                "value": severity.upper(),
                                "short": True
                            },
                            {
                                "title": "Time",
                                "value": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                                "short": True
                            }
                        ],
                        "footer": "Trading Post Error Monitoring",
                        "ts": int(time.time())
                    }
                ]
            }
            
            async with aiofiles.open("/tmp/slack_payload.json", "w") as f:
                await f.write(json.dumps(payload))
            
            # Send to Slack (would use requests.post in real implementation)
            logger.info(f"Slack alert prepared: {title}")
            
        except Exception as e:
            logger.error(f"Failed to send Slack alert: {e}")
    
    def _get_system_info(self) -> Dict[str, Any]:
        """Get current system information"""
        
        try:
            return {
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage_percent": psutil.disk_usage('/').percent,
                "uptime_seconds": (datetime.utcnow() - self.startup_time).total_seconds()
            }
        except Exception:
            return {}
    
    def _start_background_monitoring(self):
        """Start background monitoring tasks"""
        
        def background_health_check():
            """Background task for health monitoring"""
            while True:
                try:
                    health = self.get_system_health()
                    
                    # Store in database
                    db = SessionLocal()
                    health_log = SystemHealthLog(
                        cpu_percent=health.cpu_percent,
                        memory_percent=health.memory_percent,
                        disk_usage_percent=health.disk_usage_percent,
                        active_connections=health.active_connections,
                        error_rate_per_minute=health.error_rate,
                        avg_response_time=health.avg_response_time
                    )
                    db.add(health_log)
                    db.commit()
                    db.close()
                    
                    # Check for health alerts
                    if health.cpu_percent > 90:
                        self._send_alert("High CPU Usage", f"CPU usage at {health.cpu_percent}%", "high", {"cpu_percent": health.cpu_percent})
                    
                    if health.memory_percent > 90:
                        self._send_alert("High Memory Usage", f"Memory usage at {health.memory_percent}%", "high", {"memory_percent": health.memory_percent})
                    
                    time.sleep(300)  # Check every 5 minutes
                    
                except Exception as e:
                    logger.error(f"Background health check failed: {e}")
                    time.sleep(60)  # Retry in 1 minute
        
        # Start background thread
        health_thread = threading.Thread(target=background_health_check, daemon=True)
        health_thread.start()


# Global monitor instance
error_monitor = ErrorMonitor()


class ErrorMonitoringMiddleware(BaseHTTPMiddleware):
    """Middleware for automatic error and performance monitoring"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        # Get initial system metrics
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        initial_cpu = process.cpu_percent()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate metrics
            processing_time = time.time() - start_time
            final_memory = process.memory_info().rss / 1024 / 1024
            final_cpu = process.cpu_percent()
            
            # Log performance
            metrics = PerformanceMetrics(
                endpoint=str(request.url.path),
                method=request.method,
                response_time=processing_time,
                status_code=response.status_code,
                memory_usage=final_memory - initial_memory,
                cpu_usage=final_cpu - initial_cpu,
                timestamp=datetime.utcnow()
            )
            
            error_monitor.log_performance(metrics)
            
            return response
            
        except Exception as e:
            # Log error with context
            context = ErrorContext(
                request_id=request_id,
                endpoint=str(request.url.path),
                method=request.method,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None,
                additional_data={
                    "query_params": dict(request.query_params),
                    "headers": dict(request.headers)
                }
            )
            
            error_monitor.log_error(e, context, "CRITICAL")
            
            # Re-raise the exception
            raise


@asynccontextmanager
async def error_tracking_context(operation_name: str, user_id: int = None, additional_data: Dict = None):
    """Context manager for tracking errors in specific operations"""
    
    start_time = time.time()
    context = ErrorContext(
        user_id=user_id,
        additional_data=additional_data or {}
    )
    
    try:
        yield context
    except Exception as e:
        # Log the error with operation context
        context.additional_data.update({
            "operation": operation_name,
            "duration": time.time() - start_time
        })
        
        error_monitor.log_error(e, context, "ERROR")
        raise


# Decorator for automatic error tracking
def monitor_errors(operation_name: str = None):
    """Decorator for automatic error monitoring"""
    
    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                context = ErrorContext(
                    additional_data={
                        "function": op_name,
                        "args": str(args)[:200],  # Limit size
                        "kwargs": str(kwargs)[:200]
                    }
                )
                
                error_monitor.log_error(e, context, "ERROR")
                raise
        
        def sync_wrapper(*args, **kwargs):
            op_name = operation_name or f"{func.__module__}.{func.__name__}"
            
            try:
                return func(*args, **kwargs)
            except Exception as e:
                context = ErrorContext(
                    additional_data={
                        "function": op_name,
                        "args": str(args)[:200],
                        "kwargs": str(kwargs)[:200]
                    }
                )
                
                error_monitor.log_error(e, context, "ERROR")
                raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


# Export monitoring components
__all__ = [
    'ErrorMonitor',
    'error_monitor',
    'ErrorMonitoringMiddleware',
    'error_tracking_context',
    'monitor_errors',
    'ErrorContext',
    'PerformanceMetrics',
    'SystemHealthMetrics'
]