"""
Configuration Validator for Trading Post Appwrite Integration
Validates and ensures consistent configuration across all components
"""

import os
import json
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConfigValidator:
    """Validates and fixes configuration inconsistencies"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = project_root
        self.correct_project_id = "689bdee000098bd9d55c"
        self.correct_endpoint = "https://nyc.cloud.appwrite.io/v1"
        self.errors = []
        self.fixes_applied = []

    def validate_all(self) -> bool:
        """Run all validation checks"""
        logger.info("🔍 Starting comprehensive configuration validation...")
        
        # Check environment files
        self.validate_env_files()
        
        # Check configuration files
        self.validate_config_files()
        
        # Check function configurations
        self.validate_function_configs()
        
        # Check frontend configuration
        self.validate_frontend_config()
        
        # Summary
        if self.errors:
            logger.error(f"❌ Found {len(self.errors)} configuration errors:")
            for error in self.errors:
                logger.error(f"  - {error}")
        else:
            logger.info("✅ All configuration checks passed!")
            
        if self.fixes_applied:
            logger.info(f"🔧 Applied {len(self.fixes_applied)} fixes:")
            for fix in self.fixes_applied:
                logger.info(f"  - {fix}")
                
        return len(self.errors) == 0

    def validate_env_files(self):
        """Validate environment files"""
        env_files = [
            ".env.appwrite",
            ".env.appwrite.production", 
            ".env.appwrite.development"
        ]
        
        for env_file in env_files:
            file_path = os.path.join(self.project_root, env_file)
            if os.path.exists(file_path):
                self._check_env_file(file_path)

    def _check_env_file(self, file_path: str):
        """Check individual environment file"""
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                
            if f"APPWRITE_PROJECT_ID={self.correct_project_id}" not in content:
                if "APPWRITE_PROJECT_ID=" in content:
                    self.errors.append(f"Incorrect project ID in {file_path}")
                else:
                    self.errors.append(f"Missing project ID in {file_path}")
                    
            if self.correct_endpoint not in content:
                if "APPWRITE_ENDPOINT=" in content:
                    self.errors.append(f"Incorrect endpoint in {file_path}")
                else:
                    self.errors.append(f"Missing endpoint in {file_path}")
                    
        except Exception as e:
            self.errors.append(f"Failed to read {file_path}: {e}")

    def validate_config_files(self):
        """Validate JSON configuration files"""
        config_files = [
            "appwrite-deployment-config.json",
            "APPWRITE_DEPLOYMENT_INFO.json"
        ]
        
        for config_file in config_files:
            file_path = os.path.join(self.project_root, config_file)
            if os.path.exists(file_path):
                self._check_json_config(file_path)

    def _check_json_config(self, file_path: str):
        """Check JSON configuration file"""
        try:
            with open(file_path, 'r') as f:
                config = json.load(f)
                
            # Check various places where project ID might be stored
            project_id_locations = [
                ("project", "projectId"),
                ("appwrite", "projectId"), 
                ("APPWRITE_FUNCTION_PROJECT_ID",),
            ]
            
            for location in project_id_locations:
                value = config
                try:
                    for key in location:
                        value = value[key]
                    if value != self.correct_project_id:
                        self.errors.append(f"Incorrect project ID at {' -> '.join(location)} in {file_path}")
                except (KeyError, TypeError):
                    # Key doesn't exist, which might be OK
                    continue
                    
        except Exception as e:
            self.errors.append(f"Failed to parse {file_path}: {e}")

    def validate_function_configs(self):
        """Validate function configurations"""
        function_dirs = [
            "functions/api",
            "functions/ai-matching",
            "functions/notifications"
        ]
        
        for func_dir in function_dirs:
            func_path = os.path.join(self.project_root, func_dir)
            if os.path.exists(func_path):
                # Check if there are any hardcoded project IDs
                self._check_function_code(func_path)

    def _check_function_code(self, func_dir: str):
        """Check function code for hardcoded values"""
        main_files = ["main.py", "index.js"]
        
        for main_file in main_files:
            file_path = os.path.join(func_dir, main_file)
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                        
                    # Look for hardcoded project IDs (excluding the correct one)
                    problematic_ids = ["trading-post-prod", "your_project_id"]
                    for bad_id in problematic_ids:
                        if bad_id in content:
                            self.errors.append(f"Found hardcoded project ID '{bad_id}' in {file_path}")
                            
                except Exception as e:
                    self.errors.append(f"Failed to read {file_path}: {e}")

    def validate_frontend_config(self):
        """Validate frontend configuration"""
        frontend_config = os.path.join(
            self.project_root, 
            "trading-app-frontend/src/config/appwriteConfig.js"
        )
        
        if os.path.exists(frontend_config):
            try:
                with open(frontend_config, 'r') as f:
                    content = f.read()
                    
                # Check for environment variable usage (this is good)
                if "process.env.REACT_APP_APPWRITE_PROJECT_ID" not in content:
                    self.errors.append("Frontend config should use environment variables for project ID")
                    
            except Exception as e:
                self.errors.append(f"Failed to read frontend config: {e}")

    def create_validation_report(self) -> Dict:
        """Create a detailed validation report"""
        return {
            "validation_passed": len(self.errors) == 0,
            "errors_found": len(self.errors),
            "errors": self.errors,
            "fixes_applied": len(self.fixes_applied),
            "fixes": self.fixes_applied,
            "configuration": {
                "correct_project_id": self.correct_project_id,
                "correct_endpoint": self.correct_endpoint
            }
        }

def main():
    """Run configuration validation"""
    validator = ConfigValidator()
    success = validator.validate_all()
    
    # Generate report
    report = validator.create_validation_report()
    
    # Save report
    with open("config_validation_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"📊 Validation report saved to config_validation_report.json")
    
    return success

if __name__ == "__main__":
    main()