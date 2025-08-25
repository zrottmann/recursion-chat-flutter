#!/usr/bin/env python3
"""
Trading Post Deployment Readiness Verification
Checks if all components are ready for AppWrite deployment
"""

import os
import json
import sys
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

class DeploymentVerifier:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.ready = True

    def check_frontend_build(self):
        """Check if frontend is built and ready"""
        logger.info("🔍 Checking frontend build...")
        
        frontend_dist = Path("trading-app-frontend/dist")
        
        if not frontend_dist.exists():
            self.issues.append("Frontend not built - missing dist directory")
            self.ready = False
            return False
        
        # Check for essential files
        essential_files = ["index.html"]
        missing_files = []
        
        for file_name in essential_files:
            if not (frontend_dist / file_name).exists():
                missing_files.append(file_name)
        
        if missing_files:
            self.issues.append(f"Frontend build incomplete - missing: {', '.join(missing_files)}")
            self.ready = False
            return False
        
        # Count build files
        build_files = list(frontend_dist.glob("*"))
        logger.info(f"✅ Frontend build ready with {len(build_files)} files")
        return True

    def check_function_structure(self):
        """Check if AppWrite functions are properly structured"""
        logger.info("🔍 Checking function structure...")
        
        functions_dir = Path("functions")
        if not functions_dir.exists():
            self.issues.append("Functions directory not found")
            self.ready = False
            return False
        
        required_functions = [
            "ai-pricing",
            "ai-matching", 
            "trading-post-api"
        ]
        
        missing_functions = []
        incomplete_functions = []
        
        for func_name in required_functions:
            func_path = functions_dir / func_name
            
            if not func_path.exists():
                missing_functions.append(func_name)
                continue
            
            # Check for required files
            required_files = ["main.py", "requirements.txt"]
            missing_files = []
            
            for file_name in required_files:
                if not (func_path / file_name).exists():
                    missing_files.append(file_name)
            
            if missing_files:
                incomplete_functions.append(f"{func_name} (missing: {', '.join(missing_files)})")
        
        if missing_functions:
            self.issues.append(f"Missing functions: {', '.join(missing_functions)}")
            self.ready = False
        
        if incomplete_functions:
            self.issues.append(f"Incomplete functions: {', '.join(incomplete_functions)}")
            self.ready = False
        
        if not missing_functions and not incomplete_functions:
            logger.info(f"✅ All {len(required_functions)} functions properly structured")
            return True
        
        return False

    def check_appwrite_config(self):
        """Check AppWrite configuration file"""
        logger.info("🔍 Checking AppWrite configuration...")
        
        config_file = Path("appwrite.json")
        if not config_file.exists():
            self.issues.append("appwrite.json configuration file not found")
            self.ready = False
            return False
        
        try:
            with open(config_file) as f:
                config = json.load(f)
            
            # Verify required fields
            required_fields = ["projectId", "projectName", "functions", "collections", "buckets"]
            missing_fields = []
            
            for field in required_fields:
                if field not in config:
                    missing_fields.append(field)
            
            if missing_fields:
                self.issues.append(f"appwrite.json missing fields: {', '.join(missing_fields)}")
                self.ready = False
                return False
            
            # Check project ID
            expected_project_id = "689bdee000098bd9d55c"
            if config.get("projectId") != expected_project_id:
                self.warnings.append(f"Project ID mismatch: expected {expected_project_id}, found {config.get('projectId')}")
            
            # Check if AI functions are configured
            function_ids = [func.get("$id", "") for func in config.get("functions", [])]
            ai_functions = ["ai-pricing", "ai-matching"]
            
            missing_ai_functions = [func for func in ai_functions if func not in function_ids]
            if missing_ai_functions:
                self.issues.append(f"AI functions not configured: {', '.join(missing_ai_functions)}")
                self.ready = False
                return False
            
            logger.info("✅ AppWrite configuration valid")
            return True
            
        except json.JSONDecodeError:
            self.issues.append("appwrite.json is not valid JSON")
            self.ready = False
            return False
        except Exception as e:
            self.issues.append(f"Error reading appwrite.json: {str(e)}")
            self.ready = False
            return False

    def check_environment_requirements(self):
        """Check environment variable requirements"""
        logger.info("🔍 Checking environment requirements...")
        
        # Check for API key (required for deployment)
        if not os.getenv("APPWRITE_API_KEY"):
            self.warnings.append("APPWRITE_API_KEY not set - required for deployment")
        else:
            logger.info("✅ APPWRITE_API_KEY is configured")
        
        # Check for optional AI service keys
        if not os.getenv("OPENAI_API_KEY"):
            self.warnings.append("OPENAI_API_KEY not set - AI pricing will use mock mode")
        else:
            logger.info("✅ OPENAI_API_KEY configured for AI pricing")
        
        if not os.getenv("GROK_API_KEY"):
            self.warnings.append("GROK_API_KEY not set - AI matching will use basic algorithms")
        else:
            logger.info("✅ GROK_API_KEY configured for AI matching")
        
        return True

    def check_deployment_scripts(self):
        """Check if deployment scripts are available"""
        logger.info("🔍 Checking deployment scripts...")
        
        scripts = [
            "deploy-enhanced-trading-post.py",
            "deploy-frontend-to-sites.js"
        ]
        
        missing_scripts = []
        
        for script in scripts:
            if not Path(script).exists():
                missing_scripts.append(script)
        
        if missing_scripts:
            self.warnings.append(f"Deployment scripts missing: {', '.join(missing_scripts)}")
        else:
            logger.info("✅ Deployment scripts available")
        
        return True

    def generate_report(self):
        """Generate deployment readiness report"""
        logger.info("\n" + "="*60)
        logger.info("📋 TRADING POST DEPLOYMENT READINESS REPORT")
        logger.info("="*60)
        
        # Show project info
        logger.info("📊 Project Information:")
        logger.info("   Project ID: 689bdee000098bd9d55c")
        logger.info("   Endpoint: https://cloud.appwrite.io/v1") 
        logger.info("   Database: trading_post_db")
        
        # Show component status
        logger.info("\n🔧 Component Status:")
        logger.info(f"   Frontend Build: {'✅ Ready' if Path('trading-app-frontend/dist').exists() else '❌ Not Ready'}")
        logger.info(f"   AI Functions: {'✅ Ready' if Path('functions/ai-pricing').exists() and Path('functions/ai-matching').exists() else '❌ Not Ready'}")
        logger.info(f"   Configuration: {'✅ Ready' if Path('appwrite.json').exists() else '❌ Not Ready'}")
        
        # Show issues
        if self.issues:
            logger.error("\n❌ CRITICAL ISSUES:")
            for issue in self.issues:
                logger.error(f"   • {issue}")
        
        # Show warnings
        if self.warnings:
            logger.warning("\n⚠️  WARNINGS:")
            for warning in self.warnings:
                logger.warning(f"   • {warning}")
        
        # Show deployment status
        logger.info(f"\n🚀 DEPLOYMENT STATUS: {'✅ READY' if self.ready else '❌ NOT READY'}")
        
        if self.ready:
            logger.info("\n📝 Next Steps:")
            logger.info("   1. Set APPWRITE_API_KEY environment variable")
            logger.info("   2. Run: python deploy-enhanced-trading-post.py")
            logger.info("   3. Run: node deploy-frontend-to-sites.js")
            logger.info("   4. Test the deployment")
        else:
            logger.info("\n🔧 Fix Required Issues Before Deployment")
        
        logger.info("="*60)
        
        return self.ready

    def run_verification(self):
        """Run complete verification process"""
        logger.info("🚀 Starting Trading Post Deployment Verification...")
        
        self.check_frontend_build()
        self.check_function_structure() 
        self.check_appwrite_config()
        self.check_environment_requirements()
        self.check_deployment_scripts()
        
        return self.generate_report()

def main():
    verifier = DeploymentVerifier()
    ready = verifier.run_verification()
    
    if ready:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Issues found

if __name__ == "__main__":
    main()