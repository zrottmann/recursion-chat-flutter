"""
Security configuration and utilities for AI Photo Mode
"""

import os
import filetype
import hashlib
from typing import Optional, Dict, List
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Security Configuration
SECURITY_CONFIG = {
    # File validation
    "MAX_FILE_SIZE": 10 * 1024 * 1024,  # 10MB
    "ALLOWED_MIME_TYPES": {"image/jpeg", "image/png", "image/webp"},
    "ALLOWED_FILE_EXTENSIONS": {".jpg", ".jpeg", ".png", ".webp"},
    # Rate limiting
    "MAX_UPLOAD_PER_USER_PER_HOUR": 20,
    "MAX_UPLOAD_PER_IP_PER_HOUR": 50,
    "MAX_ANALYSIS_PER_USER_PER_DAY": 100,
    # Storage security
    "QUARANTINE_DIR": "uploads/quarantine",
    "AI_PHOTOS_DIR": "uploads/ai_photos",
    "ALLOWED_STORAGE_LOCATIONS": {"uploads/ai_photos"},
    # API security
    "MAX_SESSION_DURATION_HOURS": 24,
    "CLEANUP_INTERVAL_HOURS": 6,
    "MIN_CONFIDENCE_THRESHOLD": 0.1,
    # Content filtering
    "BLOCKED_IMAGE_HASHES": set(),  # Can be populated with known malicious image hashes
    "SUSPICIOUS_KEYWORDS": {"malware", "virus", "exploit", "payload", "shell", "injection"},
}


class ImageSecurityValidator:
    """Comprehensive image security validation"""

    def __init__(self):
        pass  # filetype doesn't require initialization

    def validate_file_security(self, file_path: str, original_filename: str = None) -> Dict[str, any]:
        """
        Comprehensive file security validation
        Returns: {'is_safe': bool, 'violations': list, 'metadata': dict}
        """
        violations = []
        metadata = {}

        try:
            file_path = Path(file_path)

            # 1. File existence and size check
            if not file_path.exists():
                violations.append("File does not exist")
                return {"is_safe": False, "violations": violations, "metadata": metadata}

            file_size = file_path.stat().st_size
            metadata["file_size"] = file_size

            if file_size > SECURITY_CONFIG["MAX_FILE_SIZE"]:
                violations.append(f"File too large: {file_size} bytes")

            if file_size == 0:
                violations.append("Empty file detected")

            # 2. MIME type validation using filetype
            kind = filetype.guess(str(file_path))
            if kind is not None:
                detected_mime = kind.mime
                metadata["detected_mime_type"] = detected_mime
                metadata["detected_extension"] = kind.extension

                if detected_mime not in SECURITY_CONFIG["ALLOWED_MIME_TYPES"]:
                    violations.append(f"Invalid MIME type: {detected_mime}")
            else:
                violations.append("Unable to detect file type - potentially invalid or corrupted file")
                metadata["detected_mime_type"] = "unknown"

            # 3. File extension validation
            if original_filename:
                file_ext = Path(original_filename).suffix.lower()
                metadata["original_extension"] = file_ext

                if file_ext not in SECURITY_CONFIG["ALLOWED_FILE_EXTENSIONS"]:
                    violations.append(f"Invalid file extension: {file_ext}")

            # 4. File hash check against known malicious files
            file_hash = self._calculate_file_hash(file_path)
            metadata["file_hash"] = file_hash

            if file_hash in SECURITY_CONFIG["BLOCKED_IMAGE_HASHES"]:
                violations.append("File matches known malicious hash")

            # 5. Basic malware detection (file structure analysis)
            malware_indicators = self._detect_malware_indicators(file_path)
            if malware_indicators:
                violations.extend(malware_indicators)

            # 6. Image header validation
            if "detected_mime_type" in metadata and metadata["detected_mime_type"] != "unknown":
                header_violations = self._validate_image_headers(file_path, metadata["detected_mime_type"])
                violations.extend(header_violations)

        except Exception as e:
            logger.error(f"Security validation failed for {file_path}: {e}")
            violations.append(f"Validation error: {str(e)}")

        return {"is_safe": len(violations) == 0, "violations": violations, "metadata": metadata}

    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

    def _detect_malware_indicators(self, file_path: Path) -> List[str]:
        """Basic malware detection"""
        violations = []

        try:
            # Check for suspicious file patterns
            with open(file_path, "rb") as f:
                first_1024 = f.read(1024)

                # Look for executable signatures in image files
                exe_signatures = [
                    b"MZ",  # PE executable
                    b"\x7fELF",  # ELF executable
                    b"\xca\xfe\xba\xbe",  # Java class file
                    b"PK\x03\x04",  # ZIP file (could contain executable)
                ]

                for sig in exe_signatures:
                    if sig in first_1024:
                        violations.append(f"Suspicious executable signature detected: {sig.hex()}")

                # Check for script-like content
                suspicious_strings = [b"<script", b"javascript:", b"eval(", b"<?php", b"<%", b"#!/bin"]

                for suspicious in suspicious_strings:
                    if suspicious.lower() in first_1024.lower():
                        violations.append(f"Suspicious script content detected")
                        break

        except Exception as e:
            logger.warning(f"Malware detection failed for {file_path}: {e}")

        return violations

    def _validate_image_headers(self, file_path: Path, mime_type: str) -> List[str]:
        """Validate image file headers match expected format"""
        violations = []

        try:
            with open(file_path, "rb") as f:
                header = f.read(16)

                # Validate common image format headers
                if mime_type == "image/jpeg":
                    if not header.startswith(b"\xff\xd8\xff"):
                        violations.append("Invalid JPEG header")
                elif mime_type == "image/png":
                    if not header.startswith(b"\x89PNG\r\n\x1a\n"):
                        violations.append("Invalid PNG header")
                elif mime_type == "image/webp":
                    if b"WEBP" not in header:
                        violations.append("Invalid WebP header")

        except Exception as e:
            logger.warning(f"Header validation failed for {file_path}: {e}")

        return violations


class RateLimitTracker:
    """Track upload and analysis rate limits"""

    def __init__(self):
        self._user_uploads = {}  # {user_id: [(timestamp, count), ...]}
        self._ip_uploads = {}  # {ip: [(timestamp, count), ...]}
        self._user_analysis = {}  # {user_id: [(timestamp, count), ...]}

    def check_upload_rate_limit(self, user_id: int, ip_address: str) -> Dict[str, any]:
        """Check if user/IP has exceeded upload rate limits"""
        import time

        current_time = time.time()
        one_hour_ago = current_time - 3600

        # Check user rate limit
        user_uploads = self._user_uploads.get(user_id, [])
        recent_user_uploads = sum(count for timestamp, count in user_uploads if timestamp > one_hour_ago)

        if recent_user_uploads >= SECURITY_CONFIG["MAX_UPLOAD_PER_USER_PER_HOUR"]:
            return {
                "allowed": False,
                "reason": f"User upload limit exceeded ({recent_user_uploads}/{SECURITY_CONFIG['MAX_UPLOAD_PER_USER_PER_HOUR']} per hour)",
            }

        # Check IP rate limit
        ip_uploads = self._ip_uploads.get(ip_address, [])
        recent_ip_uploads = sum(count for timestamp, count in ip_uploads if timestamp > one_hour_ago)

        if recent_ip_uploads >= SECURITY_CONFIG["MAX_UPLOAD_PER_IP_PER_HOUR"]:
            return {
                "allowed": False,
                "reason": f"IP upload limit exceeded ({recent_ip_uploads}/{SECURITY_CONFIG['MAX_UPLOAD_PER_IP_PER_HOUR']} per hour)",
            }

        return {"allowed": True, "reason": None}

    def record_upload(self, user_id: int, ip_address: str):
        """Record an upload event"""
        import time

        current_time = time.time()

        # Record user upload
        if user_id not in self._user_uploads:
            self._user_uploads[user_id] = []
        self._user_uploads[user_id].append((current_time, 1))

        # Record IP upload
        if ip_address not in self._ip_uploads:
            self._ip_uploads[ip_address] = []
        self._ip_uploads[ip_address].append((current_time, 1))

        # Cleanup old records (keep last 24 hours)
        self._cleanup_old_records()

    def check_analysis_rate_limit(self, user_id: int) -> Dict[str, any]:
        """Check if user has exceeded analysis rate limits"""
        import time

        current_time = time.time()
        one_day_ago = current_time - 86400  # 24 hours

        user_analysis = self._user_analysis.get(user_id, [])
        recent_analysis = sum(count for timestamp, count in user_analysis if timestamp > one_day_ago)

        if recent_analysis >= SECURITY_CONFIG["MAX_ANALYSIS_PER_USER_PER_DAY"]:
            return {
                "allowed": False,
                "reason": f"Analysis limit exceeded ({recent_analysis}/{SECURITY_CONFIG['MAX_ANALYSIS_PER_USER_PER_DAY']} per day)",
            }

        return {"allowed": True, "reason": None}

    def record_analysis(self, user_id: int):
        """Record an analysis event"""
        import time

        current_time = time.time()

        if user_id not in self._user_analysis:
            self._user_analysis[user_id] = []
        self._user_analysis[user_id].append((current_time, 1))

    def _cleanup_old_records(self):
        """Remove records older than 24 hours"""
        import time

        cutoff_time = time.time() - 86400

        for user_id in list(self._user_uploads.keys()):
            self._user_uploads[user_id] = [record for record in self._user_uploads[user_id] if record[0] > cutoff_time]
            if not self._user_uploads[user_id]:
                del self._user_uploads[user_id]

        for ip in list(self._ip_uploads.keys()):
            self._ip_uploads[ip] = [record for record in self._ip_uploads[ip] if record[0] > cutoff_time]
            if not self._ip_uploads[ip]:
                del self._ip_uploads[ip]

        for user_id in list(self._user_analysis.keys()):
            self._user_analysis[user_id] = [
                record for record in self._user_analysis[user_id] if record[0] > cutoff_time
            ]
            if not self._user_analysis[user_id]:
                del self._user_analysis[user_id]


# Global instances
image_validator = ImageSecurityValidator()
rate_limiter = RateLimitTracker()


def quarantine_file(file_path: str, reason: str) -> str:
    """Move suspicious file to quarantine directory"""
    try:
        file_path = Path(file_path)
        quarantine_dir = Path(SECURITY_CONFIG["QUARANTINE_DIR"])
        quarantine_dir.mkdir(parents=True, exist_ok=True)

        # Create quarantine filename with timestamp and reason
        import time

        timestamp = int(time.time())
        quarantine_filename = f"{timestamp}_{reason}_{file_path.name}"
        quarantine_path = quarantine_dir / quarantine_filename

        # Move file to quarantine
        import shutil

        shutil.move(str(file_path), str(quarantine_path))

        logger.warning(f"File quarantined: {file_path} -> {quarantine_path} (Reason: {reason})")
        return str(quarantine_path)

    except Exception as e:
        logger.error(f"Failed to quarantine file {file_path}: {e}")
        # If quarantine fails, delete the file as a safety measure
        try:
            Path(file_path).unlink()
            logger.warning(f"Deleted suspicious file after quarantine failure: {file_path}")
        except Exception as del_error:
            logger.error(f"Failed to delete suspicious file: {del_error}")
        return None


def validate_storage_location(file_path: str) -> bool:
    """Ensure file is stored in an allowed location"""
    file_path = Path(file_path).resolve()

    for allowed_location in SECURITY_CONFIG["ALLOWED_STORAGE_LOCATIONS"]:
        allowed_path = Path(allowed_location).resolve()
        try:
            file_path.relative_to(allowed_path)
            return True
        except ValueError:
            continue

    logger.warning(f"File in disallowed location: {file_path}")
    return False


def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filename to prevent path traversal"""
    import re

    # Remove any path components
    filename = Path(filename).name

    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', "", filename)

    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[: 255 - len(ext)] + ext

    # Ensure it's not empty
    if not filename:
        filename = "uploaded_file"

    return filename
