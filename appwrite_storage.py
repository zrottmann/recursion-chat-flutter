"""
Appwrite Storage Service for Trading Post
Provides image upload, optimization, and CDN functionality
"""

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite_config import appwrite_config, BUCKETS
import logging
from typing import Optional, Dict, Any, List
import os
import io
from PIL import Image
import filetype

logger = logging.getLogger(__name__)


class AppwriteStorageService:
    """Handle storage operations with Appwrite"""

    def __init__(self):
        self.client = appwrite_config.client
        self.storage = appwrite_config.storage

    def _optimize_image(self, image_data: bytes, max_size: tuple = (1200, 1200), quality: int = 85) -> bytes:
        """Optimize image for web delivery"""
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if necessary
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Resize if larger than max_size
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Save optimized image
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=quality, optimize=True)
            output.seek(0)

            return output.getvalue()

        except Exception as e:
            logger.warning(f"Image optimization failed: {e}, using original")
            return image_data

    def _create_thumbnail(self, image_data: bytes, size: tuple = (300, 300)) -> bytes:
        """Create thumbnail from image"""
        try:
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if necessary
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)

            # Save thumbnail
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=85, optimize=True)
            output.seek(0)

            return output.getvalue()

        except Exception as e:
            logger.warning(f"Thumbnail creation failed: {e}")
            return None

    async def upload_item_image(
        self, image_data: bytes, filename: str, user_id: str, listing_id: str = None
    ) -> Dict[str, Any]:
        """Upload and optimize item image"""
        try:
            # Validate file type
            file_type = filetype.guess(image_data)
            if not file_type or not file_type.mime.startswith("image/"):
                return {"error": "Invalid image file type", "success": False}

            # Optimize main image
            optimized_data = self._optimize_image(image_data)

            # Create thumbnail
            thumbnail_data = self._create_thumbnail(image_data)

            # Generate unique file ID
            file_id = ID.unique()

            # Upload main image
            main_file = await self.storage.create_file(
                bucket_id=BUCKETS["item_images"], file_id=file_id, file=InputFile.from_bytes(optimized_data, filename)
            )

            # Upload thumbnail if created successfully
            thumbnail_file = None
            if thumbnail_data:
                thumbnail_id = f"{file_id}_thumb"
                thumbnail_filename = f"thumb_{filename}"

                try:
                    thumbnail_file = await self.storage.create_file(
                        bucket_id=BUCKETS["item_images"],
                        file_id=thumbnail_id,
                        file=InputFile.from_bytes(thumbnail_data, thumbnail_filename),
                    )
                except Exception as e:
                    logger.warning(f"Thumbnail upload failed: {e}")

            # Get file URLs
            main_url = f"{appwrite_config.endpoint}/storage/buckets/{BUCKETS['item_images']}/files/{file_id}/view"
            thumbnail_url = (
                f"{appwrite_config.endpoint}/storage/buckets/{BUCKETS['item_images']}/files/{thumbnail_id}/view"
                if thumbnail_file
                else main_url
            )

            result = {
                "file_id": file_id,
                "url": main_url,
                "thumbnail_url": thumbnail_url,
                "filename": filename,
                "size": len(optimized_data),
                "original_size": len(image_data),
                "mime_type": file_type.mime,
                "success": True,
            }

            logger.info(f"Item image uploaded: {file_id}")
            return result

        except AppwriteException as e:
            logger.error(f"Failed to upload item image: {e}")
            return {"error": str(e), "code": e.code, "success": False}
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return {"error": str(e), "success": False}

    async def upload_profile_image(self, image_data: bytes, filename: str, user_id: str) -> Dict[str, Any]:
        """Upload and optimize profile image"""
        try:
            # Validate file type
            file_type = filetype.guess(image_data)
            if not file_type or not file_type.mime.startswith("image/"):
                return {"error": "Invalid image file type", "success": False}

            # Optimize image (smaller size for profiles)
            optimized_data = self._optimize_image(image_data, max_size=(800, 800), quality=90)

            # Create profile thumbnail
            thumbnail_data = self._create_thumbnail(image_data, size=(150, 150))

            # Use user_id as file_id for profiles (allows easy replacement)
            file_id = f"profile_{user_id}"

            # Delete existing profile image if it exists
            try:
                await self.storage.delete_file(bucket_id=BUCKETS["profile_images"], file_id=file_id)
            except AppwriteException:
                # File doesn't exist, that's fine
                pass

            # Upload main profile image
            main_file = await self.storage.create_file(
                bucket_id=BUCKETS["profile_images"],
                file_id=file_id,
                file=InputFile.from_bytes(optimized_data, filename),
            )

            # Upload thumbnail
            thumbnail_file = None
            if thumbnail_data:
                thumbnail_id = f"{file_id}_thumb"

                try:
                    # Delete existing thumbnail
                    await self.storage.delete_file(bucket_id=BUCKETS["profile_images"], file_id=thumbnail_id)
                except AppwriteException:
                    pass

                thumbnail_file = await self.storage.create_file(
                    bucket_id=BUCKETS["profile_images"],
                    file_id=thumbnail_id,
                    file=InputFile.from_bytes(thumbnail_data, f"thumb_{filename}"),
                )

            # Get file URLs
            main_url = f"{appwrite_config.endpoint}/storage/buckets/{BUCKETS['profile_images']}/files/{file_id}/view"
            thumbnail_url = (
                f"{appwrite_config.endpoint}/storage/buckets/{BUCKETS['profile_images']}/files/{thumbnail_id}/view"
                if thumbnail_file
                else main_url
            )

            result = {
                "file_id": file_id,
                "url": main_url,
                "thumbnail_url": thumbnail_url,
                "filename": filename,
                "size": len(optimized_data),
                "original_size": len(image_data),
                "mime_type": file_type.mime,
                "success": True,
            }

            logger.info(f"Profile image uploaded: {user_id}")
            return result

        except AppwriteException as e:
            logger.error(f"Failed to upload profile image: {e}")
            return {"error": str(e), "code": e.code, "success": False}
        except Exception as e:
            logger.error(f"Profile image processing error: {e}")
            return {"error": str(e), "success": False}

    async def delete_file(self, bucket_id: str, file_id: str) -> Dict[str, Any]:
        """Delete a file from storage"""
        try:
            await self.storage.delete_file(bucket_id=bucket_id, file_id=file_id)

            logger.info(f"File deleted: {file_id}")
            return {"success": True}

        except AppwriteException as e:
            logger.error(f"Failed to delete file {file_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def delete_item_images(self, file_ids: List[str]) -> Dict[str, Any]:
        """Delete multiple item images"""
        deleted_count = 0
        errors = []

        for file_id in file_ids:
            # Delete main image
            result = await self.delete_file(BUCKETS["item_images"], file_id)
            if result.get("success"):
                deleted_count += 1
            else:
                errors.append(f"Failed to delete {file_id}: {result.get('error')}")

            # Delete thumbnail
            thumbnail_id = f"{file_id}_thumb"
            await self.delete_file(BUCKETS["item_images"], thumbnail_id)

        return {"deleted_count": deleted_count, "errors": errors, "success": deleted_count > 0}

    async def get_file_info(self, bucket_id: str, file_id: str) -> Dict[str, Any]:
        """Get file information"""
        try:
            file_info = await self.storage.get_file(bucket_id=bucket_id, file_id=file_id)

            return {"file_info": file_info, "success": True}

        except AppwriteException as e:
            logger.error(f"Failed to get file info {file_id}: {e}")
            return {"error": str(e), "code": e.code, "success": False}

    async def get_file_preview(
        self, bucket_id: str, file_id: str, width: int = None, height: int = None, quality: int = None
    ) -> str:
        """Get optimized file preview URL"""
        try:
            preview_url = f"{appwrite_config.endpoint}/storage/buckets/{bucket_id}/files/{file_id}/preview"

            params = []
            if width:
                params.append(f"width={width}")
            if height:
                params.append(f"height={height}")
            if quality:
                params.append(f"quality={quality}")

            if params:
                preview_url += "?" + "&".join(params)

            return preview_url

        except Exception as e:
            logger.error(f"Failed to generate preview URL: {e}")
            return ""

    async def get_file_download_url(self, bucket_id: str, file_id: str) -> str:
        """Get file download URL"""
        return f"{appwrite_config.endpoint}/storage/buckets/{bucket_id}/files/{file_id}/download"

    async def list_user_files(self, user_id: str, bucket_id: str = None) -> Dict[str, Any]:
        """List files for a specific user"""
        try:
            buckets_to_check = [bucket_id] if bucket_id else list(BUCKETS.values())
            all_files = []

            for bucket in buckets_to_check:
                try:
                    files = await self.storage.list_files(bucket_id=bucket)

                    # Filter files that belong to this user (based on naming convention)
                    user_files = []
                    for file in files["files"]:
                        # Check if file belongs to user based on metadata or naming
                        if (
                            file["name"].startswith(f"user_{user_id}_")
                            or file["$id"].startswith(f"profile_{user_id}")
                            or user_id in file.get("metadata", {}).get("user_id", "")
                        ):
                            user_files.append(
                                {
                                    **file,
                                    "bucket_id": bucket,
                                    "url": f"{appwrite_config.endpoint}/storage/buckets/{bucket}/files/{file['$id']}/view",
                                }
                            )

                    all_files.extend(user_files)

                except AppwriteException as e:
                    logger.warning(f"Failed to list files in bucket {bucket}: {e}")

            return {"files": all_files, "success": True}

        except Exception as e:
            logger.error(f"Failed to list user files: {e}")
            return {"error": str(e), "success": False}

    async def get_storage_usage(self, user_id: str) -> Dict[str, Any]:
        """Get storage usage stats for user"""
        try:
            user_files_result = await self.list_user_files(user_id)

            if not user_files_result.get("success"):
                return user_files_result

            files = user_files_result["files"]

            usage_stats = {
                "total_files": len(files),
                "total_size_bytes": sum(file.get("sizeOriginal", 0) for file in files),
                "profile_images": len([f for f in files if "profile_images" in f.get("bucket_id", "")]),
                "item_images": len([f for f in files if "item_images" in f.get("bucket_id", "")]),
                "total_size_mb": sum(file.get("sizeOriginal", 0) for file in files) / 1024 / 1024,
            }

            return {"usage": usage_stats, "success": True}

        except Exception as e:
            logger.error(f"Failed to get storage usage: {e}")
            return {"error": str(e), "success": False}


# Global instance
appwrite_storage = AppwriteStorageService()
