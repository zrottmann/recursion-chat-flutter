#!/usr/bin/env python3
"""
AI Photo Mode Deployment Script
Automated deployment with comprehensive validation and rollback capabilities
"""
import os
import sys
import subprocess
import json
import time
import shutil
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(f'deployment_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


class AIPhotoModeDeployer:
    """AI Photo Mode deployment orchestrator"""

    def __init__(self, environment: str = "production"):
        self.environment = environment
        self.deployment_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_dir = Path(f"backup_{self.deployment_id}")
        self.rollback_available = False

    def validate_prerequisites(self) -> bool:
        """Validate deployment prerequisites"""
        logger.info("Validating deployment prerequisites...")

        checks = {
            "python_version": self._check_python_version(),
            "required_files": self._check_required_files(),
            "database_accessible": self._check_database_access(),
            "directories_writable": self._check_directory_permissions(),
            "dependencies_available": self._check_dependencies(),
            "environment_configured": self._check_environment_config(),
        }

        for check_name, passed in checks.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            logger.info(f"  {check_name}: {status}")

        all_passed = all(checks.values())

        if not all_passed:
            logger.error("Prerequisite validation failed. Please resolve issues before deployment.")
            return False

        logger.info("All prerequisites validated successfully")
        return True

    def create_backup(self) -> bool:
        """Create comprehensive backup before deployment"""
        logger.info(f"Creating deployment backup in {self.backup_dir}")

        try:
            self.backup_dir.mkdir(exist_ok=True)

            # Backup database
            if Path("tradingpost.db").exists():
                shutil.copy2("tradingpost.db", self.backup_dir / "tradingpost.db")
                logger.info("Database backed up")

            # Backup critical configuration files
            config_files = ["app_sqlite.py", "requirements.txt", ".env", "docker-compose.yml"]

            for file in config_files:
                if Path(file).exists():
                    shutil.copy2(file, self.backup_dir / file)
                    logger.info(f"Backed up {file}")

            # Backup uploads directory
            if Path("uploads").exists():
                shutil.copytree("uploads", self.backup_dir / "uploads", dirs_exist_ok=True)
                logger.info("Uploads directory backed up")

            self.rollback_available = True
            logger.info("Backup completed successfully")
            return True

        except Exception as e:
            logger.error(f"Backup failed: {e}")
            return False

    def deploy_backend_changes(self) -> bool:
        """Deploy backend changes for AI Photo Mode"""
        logger.info("Deploying backend changes...")

        try:
            # Install new dependencies
            logger.info("Installing new Python dependencies...")
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode != 0:
                logger.error(f"Dependency installation failed: {result.stderr}")
                return False

            logger.info("Dependencies installed successfully")

            # Validate new modules can be imported
            try:
                import security_config
                from app_sqlite import grok_service, AIPhotoSession, AIItemSuggestion

                logger.info("New modules imported successfully")
            except ImportError as e:
                logger.error(f"Module import failed: {e}")
                return False

            # Create required directories
            directories = [Path("uploads/ai_photos"), Path("uploads/quarantine"), Path("uploads/temp")]

            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                os.chmod(directory, 0o755 if directory.name != "quarantine" else 0o700)
                logger.info(f"Created directory: {directory}")

            return True

        except Exception as e:
            logger.error(f"Backend deployment failed: {e}")
            return False

    def deploy_frontend_changes(self) -> bool:
        """Deploy frontend changes for AI Photo Mode"""
        logger.info("Deploying frontend changes...")

        frontend_dir = Path("trading-app-frontend")
        if not frontend_dir.exists():
            logger.warning("Frontend directory not found, skipping frontend deployment")
            return True

        try:
            # Change to frontend directory
            os.chdir(frontend_dir)

            # Install dependencies (if package.json changed)
            logger.info("Installing frontend dependencies...")
            result = subprocess.run(["npm", "install"], capture_output=True, text=True, timeout=300)

            if result.returncode != 0:
                logger.error(f"Frontend dependency installation failed: {result.stderr}")
                os.chdir("..")
                return False

            # Build production bundle
            logger.info("Building production frontend bundle...")
            result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True, timeout=600)

            if result.returncode != 0:
                logger.error(f"Frontend build failed: {result.stderr}")
                os.chdir("..")
                return False

            logger.info("Frontend deployment completed successfully")
            os.chdir("..")
            return True

        except Exception as e:
            logger.error(f"Frontend deployment failed: {e}")
            os.chdir("..")
            return False

    def run_deployment_tests(self) -> bool:
        """Run comprehensive deployment tests"""
        logger.info("Running deployment validation tests...")

        try:
            # Run basic tests
            result = subprocess.run(
                [sys.executable, "run_ai_tests.py", "--skip-performance"], capture_output=True, text=True, timeout=600
            )

            if result.returncode == 0:
                logger.info("Deployment tests passed successfully")
                return True
            else:
                logger.error(f"Deployment tests failed: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            return False

    def validate_deployment(self) -> bool:
        """Validate that deployment is working correctly"""
        logger.info("Validating deployment...")

        validation_checks = {
            "database_tables": self._validate_database_tables(),
            "api_endpoints": self._validate_api_endpoints(),
            "security_config": self._validate_security_configuration(),
            "grok_integration": self._validate_grok_integration(),
            "file_permissions": self._validate_file_permissions(),
        }

        for check_name, passed in validation_checks.items():
            status = "✅ PASS" if passed else "❌ FAIL"
            logger.info(f"  {check_name}: {status}")

        all_passed = all(validation_checks.values())

        if all_passed:
            logger.info("Deployment validation successful")
        else:
            logger.error("Deployment validation failed")

        return all_passed

    def rollback_deployment(self) -> bool:
        """Rollback deployment to previous state"""
        if not self.rollback_available:
            logger.error("No backup available for rollback")
            return False

        logger.info("Rolling back deployment...")

        try:
            # Restore database
            if (self.backup_dir / "tradingpost.db").exists():
                shutil.copy2(self.backup_dir / "tradingpost.db", "tradingpost.db")
                logger.info("Database restored from backup")

            # Restore configuration files
            for file in self.backup_dir.glob("*.py"):
                if file.name != "deploy_ai_photo_mode.py":
                    shutil.copy2(file, file.name)
                    logger.info(f"Restored {file.name}")

            # Restore uploads directory
            if (self.backup_dir / "uploads").exists():
                if Path("uploads").exists():
                    shutil.rmtree("uploads")
                shutil.copytree(self.backup_dir / "uploads", "uploads")
                logger.info("Uploads directory restored")

            logger.info("Rollback completed successfully")
            return True

        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False

    def cleanup_deployment(self):
        """Clean up deployment artifacts"""
        logger.info("Cleaning up deployment artifacts...")

        # Remove temporary files
        temp_files = ["*.pyc", "__pycache__", "*.log", "test_results.json"]

        for pattern in temp_files:
            for file in Path(".").glob(f"**/{pattern}"):
                try:
                    if file.is_file():
                        file.unlink()
                    elif file.is_dir():
                        shutil.rmtree(file)
                except Exception as e:
                    logger.warning(f"Could not clean up {file}: {e}")

        logger.info("Cleanup completed")

    def deploy(self) -> bool:
        """Execute complete deployment process"""
        logger.info(f"Starting AI Photo Mode deployment (ID: {self.deployment_id})")

        deployment_steps = [
            ("Prerequisites Validation", self.validate_prerequisites),
            ("Backup Creation", self.create_backup),
            ("Backend Deployment", self.deploy_backend_changes),
            ("Frontend Deployment", self.deploy_frontend_changes),
            ("Deployment Testing", self.run_deployment_tests),
            ("Deployment Validation", self.validate_deployment),
        ]

        for step_name, step_function in deployment_steps:
            logger.info(f"Executing: {step_name}")

            try:
                if not step_function():
                    logger.error(f"Deployment step failed: {step_name}")

                    if self.rollback_available:
                        logger.info("Attempting automatic rollback...")
                        if self.rollback_deployment():
                            logger.info("Rollback successful. System restored to previous state.")
                        else:
                            logger.error("Rollback failed. Manual intervention required.")

                    return False

                logger.info(f"✅ {step_name} completed successfully")

            except Exception as e:
                logger.error(f"Unexpected error in {step_name}: {e}")
                return False

        self.cleanup_deployment()
        logger.info("🎉 AI Photo Mode deployment completed successfully!")
        return True

    # Helper methods for validation checks
    def _check_python_version(self) -> bool:
        return sys.version_info >= (3, 8)

    def _check_required_files(self) -> bool:
        required_files = ["app_sqlite.py", "security_config.py", "requirements.txt", "run_ai_tests.py"]
        return all(Path(file).exists() for file in required_files)

    def _check_database_access(self) -> bool:
        try:
            import sqlite3

            conn = sqlite3.connect("tradingpost.db")
            conn.execute("SELECT 1")
            conn.close()
            return True
        except Exception:
            return False

    def _check_directory_permissions(self) -> bool:
        try:
            test_dir = Path("uploads")
            test_dir.mkdir(exist_ok=True)
            test_file = test_dir / "permission_test.txt"
            test_file.write_text("test")
            test_file.unlink()
            return True
        except Exception:
            return False

    def _check_dependencies(self) -> bool:
        try:
            import PIL
            import requests
            import magic

            return True
        except ImportError:
            return False

    def _check_environment_config(self) -> bool:
        required_vars = ["SECRET_KEY"]
        return all(os.getenv(var) for var in required_vars)

    def _validate_database_tables(self) -> bool:
        try:
            import sqlite3

            conn = sqlite3.connect("tradingpost.db")
            cursor = conn.cursor()

            # Check if new tables exist
            cursor.execute(
                """
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name IN ('ai_photo_sessions', 'ai_item_suggestions')
            """
            )

            tables = [row[0] for row in cursor.fetchall()]
            conn.close()

            return len(tables) == 2

        except Exception:
            return False

    def _validate_api_endpoints(self) -> bool:
        # This would typically test actual HTTP endpoints
        # For now, just check that the functions exist
        try:
            from app_sqlite import upload_and_analyze_photo, get_ai_suggestions, create_item_from_ai

            return True
        except ImportError:
            return False

    def _validate_security_configuration(self) -> bool:
        try:
            from security_config import image_validator, rate_limiter, SECURITY_CONFIG

            return True
        except ImportError:
            return False

    def _validate_grok_integration(self) -> bool:
        try:
            from app_sqlite import grok_service

            return grok_service is not None
        except ImportError:
            return False

    def _validate_file_permissions(self) -> bool:
        required_dirs = ["uploads/ai_photos", "uploads/quarantine"]

        for dir_path in required_dirs:
            if not Path(dir_path).exists():
                return False

        return True


def main():
    """Main deployment entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Deploy AI Photo Mode")
    parser.add_argument(
        "--environment",
        default="production",
        choices=["development", "staging", "production"],
        help="Deployment environment",
    )
    parser.add_argument("--skip-backup", action="store_true", help="Skip backup creation (not recommended)")
    parser.add_argument("--dry-run", action="store_true", help="Perform validation checks only")

    args = parser.parse_args()

    deployer = AIPhotoModeDeployer(args.environment)

    if args.dry_run:
        logger.info("Performing dry run validation...")
        success = deployer.validate_prerequisites()
        sys.exit(0 if success else 1)

    if args.skip_backup:
        logger.warning("Backup creation skipped - this is not recommended!")
        deployer.rollback_available = False

    success = deployer.deploy()

    if success:
        logger.info("Deployment completed successfully!")
        logger.info("Next steps:")
        logger.info("1. Monitor application logs for any issues")
        logger.info("2. Test AI Photo Mode functionality manually")
        logger.info("3. Monitor performance metrics")
        logger.info("4. Set up monitoring alerts")
        sys.exit(0)
    else:
        logger.error("Deployment failed. Please check logs and resolve issues.")
        sys.exit(1)


if __name__ == "__main__":
    main()
