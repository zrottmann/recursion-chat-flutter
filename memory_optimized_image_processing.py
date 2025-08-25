"""
Memory-optimized image processing for AI pricing system
Fixes memory leaks and optimizes image handling for better performance
"""

import os
import gc
import logging
import asyncio
import tempfile
import base64
from typing import Optional, Dict, Any, Tuple
from PIL import Image, ImageEnhance
import aiofiles
from contextlib import contextmanager
import psutil
import weakref

logger = logging.getLogger(__name__)

class MemoryManager:
    """Memory management utilities for image processing"""
    
    def __init__(self):
        self.temp_files = weakref.WeakSet()
        self.max_memory_mb = 500  # Maximum memory usage for image processing
        
    def get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    def check_memory_limit(self):
        """Check if memory usage is within limits"""
        current_memory = self.get_memory_usage()
        if current_memory > self.max_memory_mb:
            logger.warning(f"High memory usage: {current_memory:.1f}MB, forcing garbage collection")
            gc.collect()
            
    def register_temp_file(self, filepath: str):
        """Register temporary file for cleanup"""
        self.temp_files.add(filepath)
    
    def cleanup_temp_files(self):
        """Clean up temporary files"""
        for filepath in list(self.temp_files):
            try:
                if os.path.exists(filepath):
                    os.unlink(filepath)
                    logger.debug(f"Cleaned up temp file: {filepath}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {filepath}: {e}")


# Global memory manager instance
memory_manager = MemoryManager()


@contextmanager
def memory_safe_image_processing():
    """Context manager for memory-safe image processing"""
    initial_memory = memory_manager.get_memory_usage()
    
    try:
        yield
    finally:
        # Force garbage collection
        gc.collect()
        
        # Check memory after processing
        final_memory = memory_manager.get_memory_usage()
        memory_increase = final_memory - initial_memory
        
        if memory_increase > 50:  # More than 50MB increase
            logger.warning(f"Memory increased by {memory_increase:.1f}MB during image processing")
        
        logger.debug(f"Memory usage: {initial_memory:.1f}MB -> {final_memory:.1f}MB")


class OptimizedImageProcessor:
    """Memory-optimized image processor"""
    
    def __init__(self):
        self.max_dimension = 2048
        self.jpeg_quality = 85
        self.max_file_size_mb = 10
    
    async def validate_and_get_image_info(self, file_path: str) -> Dict[str, Any]:
        """Validate image and get basic info without loading full image"""
        try:
            with Image.open(file_path) as img:
                # Get image info without loading into memory
                info = {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format,
                    "mode": img.mode,
                    "size_mb": os.path.getsize(file_path) / (1024 * 1024)
                }
                
                # Check file size
                if info["size_mb"] > self.max_file_size_mb:
                    raise ValueError(f"Image too large: {info['size_mb']:.1f}MB (max: {self.max_file_size_mb}MB)")
                
                return info
                
        except Exception as e:
            logger.error(f"Image validation failed for {file_path}: {e}")
            raise
    
    async def create_optimized_copy(self, input_path: str, output_path: str) -> str:
        """Create memory-optimized copy of image"""
        with memory_safe_image_processing():
            try:
                with Image.open(input_path) as img:
                    # Convert to RGB if necessary (more memory efficient than keeping other modes)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Calculate optimal size
                    original_size = (img.width, img.height)
                    if max(original_size) > self.max_dimension:
                        # Calculate new dimensions maintaining aspect ratio
                        ratio = self.max_dimension / max(original_size)
                        new_size = (int(img.width * ratio), int(img.height * ratio))
                        
                        # Resize using high-quality resampling
                        img = img.resize(new_size, Image.Resampling.LANCZOS)
                        logger.info(f"Resized image from {original_size} to {new_size}")
                    
                    # Save optimized image
                    img.save(output_path, 'JPEG', quality=self.jpeg_quality, optimize=True)
                    
                    memory_manager.register_temp_file(output_path)
                    return output_path
                    
            except Exception as e:
                logger.error(f"Failed to create optimized copy: {e}")
                raise
    
    async def enhance_image_for_ai(self, input_path: str) -> str:
        """Create enhanced version for AI analysis with memory optimization"""
        with memory_safe_image_processing():
            try:
                # Create temporary file for enhanced image
                temp_dir = tempfile.gettempdir()
                enhanced_path = os.path.join(temp_dir, f"enhanced_{os.path.basename(input_path)}")
                
                with Image.open(input_path) as img:
                    # Ensure RGB mode
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Apply enhancements sequentially to reduce memory usage
                    # Enhance sharpness
                    enhancer = ImageEnhance.Sharpness(img)
                    img = enhancer.enhance(1.2)
                    
                    # Force garbage collection after each enhancement
                    del enhancer
                    gc.collect()
                    
                    # Enhance contrast
                    enhancer = ImageEnhance.Contrast(img)
                    img = enhancer.enhance(1.1)
                    
                    del enhancer
                    gc.collect()
                    
                    # Save enhanced image
                    img.save(enhanced_path, 'JPEG', quality=95, optimize=True)
                
                memory_manager.register_temp_file(enhanced_path)
                logger.info(f"Created enhanced image: {enhanced_path}")
                return enhanced_path
                
            except Exception as e:
                logger.error(f"Image enhancement failed: {e}")
                return input_path  # Return original if enhancement fails
    
    async def create_base64_efficiently(self, image_path: str, max_size: Tuple[int, int] = (1024, 1024)) -> str:
        """Create base64 encoding with memory optimization"""
        with memory_safe_image_processing():
            try:
                # Create a temporary resized version for base64 encoding
                temp_dir = tempfile.gettempdir()
                temp_path = os.path.join(temp_dir, f"b64_{os.path.basename(image_path)}")
                
                with Image.open(image_path) as img:
                    # Convert to RGB
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Resize for base64 (smaller size for API efficiency)
                    if img.width > max_size[0] or img.height > max_size[1]:
                        img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    
                    # Save to temporary file with compression
                    img.save(temp_path, 'JPEG', quality=80, optimize=True)
                
                # Read file in chunks for base64 encoding
                base64_data = await self._read_file_as_base64_chunked(temp_path)
                
                # Cleanup temporary file immediately
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    logger.warning(f"Failed to cleanup temp file {temp_path}: {e}")
                
                return base64_data
                
            except Exception as e:
                logger.error(f"Base64 encoding failed: {e}")
                raise
    
    async def _read_file_as_base64_chunked(self, file_path: str, chunk_size: int = 8192) -> str:
        """Read file as base64 in chunks to reduce memory usage"""
        import base64
        
        try:
            async with aiofiles.open(file_path, 'rb') as f:
                # Read in chunks and encode
                encoded_chunks = []
                while True:
                    chunk = await f.read(chunk_size)
                    if not chunk:
                        break
                    encoded_chunks.append(base64.b64encode(chunk))
                
                # Join all chunks
                return b''.join(encoded_chunks).decode('utf-8')
                
        except Exception as e:
            logger.error(f"Chunked base64 encoding failed: {e}")
            raise


class MemoryEfficientAIProcessor:
    """Memory-efficient AI processing wrapper"""
    
    def __init__(self):
        self.image_processor = OptimizedImageProcessor()
        
    async def preprocess_image_for_ai(self, original_path: str) -> str:
        """Preprocess image for AI analysis with memory optimization"""
        memory_manager.check_memory_limit()
        
        try:
            # Validate image first
            image_info = await self.image_processor.validate_and_get_image_info(original_path)
            logger.info(f"Processing image: {image_info['width']}x{image_info['height']}, {image_info['size_mb']:.1f}MB")
            
            # Create optimized copy if needed
            if image_info['size_mb'] > 2 or max(image_info['width'], image_info['height']) > 2048:
                temp_dir = tempfile.gettempdir()
                optimized_path = os.path.join(temp_dir, f"opt_{os.path.basename(original_path)}")
                
                processed_path = await self.image_processor.create_optimized_copy(original_path, optimized_path)
                logger.info("Created optimized copy for AI processing")
            else:
                processed_path = original_path
            
            # Enhance for better AI analysis
            enhanced_path = await self.image_processor.enhance_image_for_ai(processed_path)
            
            return enhanced_path
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            return original_path
    
    async def create_ai_ready_base64(self, image_path: str) -> str:
        """Create base64 encoding optimized for AI APIs"""
        memory_manager.check_memory_limit()
        
        try:
            # Use smaller dimensions for AI APIs to reduce costs and memory
            base64_data = await self.image_processor.create_base64_efficiently(
                image_path, 
                max_size=(1024, 1024)  # Good balance between quality and efficiency
            )
            
            logger.info(f"Created base64 encoding, size: {len(base64_data) / 1024:.1f}KB")
            return base64_data
            
        except Exception as e:
            logger.error(f"AI base64 creation failed: {e}")
            raise
    
    async def cleanup_processing_files(self, session_id: str):
        """Clean up temporary files created during processing"""
        try:
            memory_manager.cleanup_temp_files()
            gc.collect()  # Force garbage collection
            
            final_memory = memory_manager.get_memory_usage()
            logger.info(f"Cleanup completed for session {session_id}, memory usage: {final_memory:.1f}MB")
            
        except Exception as e:
            logger.error(f"Cleanup failed for session {session_id}: {e}")


# Global processor instance
ai_processor = MemoryEfficientAIProcessor()


async def memory_safe_vision_analysis(image_path: str, openai_client, item_prompt: str) -> Dict[str, Any]:
    """Memory-safe wrapper for OpenAI vision analysis"""
    
    with memory_safe_image_processing():
        try:
            # Create memory-optimized base64 encoding
            base64_image = await ai_processor.create_ai_ready_base64(image_path)
            
            # Call OpenAI API
            response = await asyncio.to_thread(
                openai_client.chat.completions.create,
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": item_prompt},
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
            
            # Clean up base64 data from memory immediately
            del base64_image
            gc.collect()
            
            # Parse and return response
            import json
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Memory-safe vision analysis failed: {e}")
            raise


def get_memory_stats() -> Dict[str, Any]:
    """Get current memory statistics"""
    try:
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            "memory_usage_mb": memory_info.rss / 1024 / 1024,
            "memory_percent": process.memory_percent(),
            "temp_files_tracked": len(memory_manager.temp_files),
            "gc_stats": {
                "collections": gc.get_stats(),
                "objects": len(gc.get_objects())
            }
        }
    except Exception as e:
        logger.error(f"Failed to get memory stats: {e}")
        return {"error": str(e)}


# Background cleanup task
async def periodic_memory_cleanup():
    """Periodic cleanup task to prevent memory leaks"""
    while True:
        try:
            await asyncio.sleep(300)  # Run every 5 minutes
            
            memory_usage = memory_manager.get_memory_usage()
            if memory_usage > 300:  # More than 300MB
                logger.info(f"Running periodic cleanup, memory usage: {memory_usage:.1f}MB")
                memory_manager.cleanup_temp_files()
                gc.collect()
                
                new_memory = memory_manager.get_memory_usage()
                logger.info(f"Cleanup completed, memory usage: {new_memory:.1f}MB")
                
        except Exception as e:
            logger.error(f"Periodic cleanup failed: {e}")


# Export the optimized functions
__all__ = [
    'MemoryEfficientAIProcessor',
    'memory_safe_vision_analysis', 
    'ai_processor',
    'get_memory_stats',
    'periodic_memory_cleanup'
]