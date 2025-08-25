#!/usr/bin/env python3
"""
Production Setup Script for Trading Post with Firebase
Updates app.yaml with actual Firebase credentials for deployment
"""

import json
import os
import sys
import secrets
import base64
from pathlib import Path


def generate_jwt_secret():
    """Generate a secure JWT secret key"""
    return secrets.token_urlsafe(48)


def read_firebase_service_account():
    """Read Firebase service account JSON file"""
    service_account_path = "firebase-service-account.json"

    if not os.path.exists(service_account_path):
        print(f"❌ Firebase service account file not found: {service_account_path}")
        print("   Please download it from Firebase Console → Project Settings → Service Accounts")
        return None

    try:
        with open(service_account_path, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error reading Firebase service account file: {e}")
        return None


def escape_private_key(private_key):
    """Escape private key for YAML"""
    # Replace actual newlines with \n for YAML
    return private_key.replace("\n", "\\n")


def update_app_yaml(firebase_config):
    """Update app.yaml with Firebase configuration"""
    app_yaml_path = "app.yaml"

    if not os.path.exists(app_yaml_path):
        print(f"❌ app.yaml not found: {app_yaml_path}")
        return False

    # Read current app.yaml
    with open(app_yaml_path, "r") as f:
        content = f.read()

    # Generate new JWT secret
    jwt_secret = generate_jwt_secret()

    # Replace placeholder values
    replacements = {
        "your-firebase-project-id": firebase_config["project_id"],
        "your-private-key-id": firebase_config["private_key_id"],
        "-----BEGIN PRIVATE KEY-----\\nyour-private-key-here\\n-----END PRIVATE KEY-----": escape_private_key(
            firebase_config["private_key"]
        ),
        "your-service-account@your-project.iam.gserviceaccount.com": firebase_config["client_email"],
        "your-client-id": firebase_config["client_id"],
        "your-client-cert-url": firebase_config["client_x509_cert_url"],
        "your-production-jwt-secret-key-minimum-32-characters-long": jwt_secret,
    }

    # Apply replacements
    for placeholder, actual_value in replacements.items():
        content = content.replace(placeholder, actual_value)

    # Create backup
    backup_path = f"{app_yaml_path}.backup"
    with open(backup_path, "w") as f:
        f.write(content)

    # Write updated app.yaml
    with open(app_yaml_path, "w") as f:
        f.write(content)

    print(f"✅ Updated app.yaml with Firebase configuration")
    print(f"📋 Backup created at: {backup_path}")
    return True


def create_frontend_production_env():
    """Create production environment file for frontend"""
    frontend_dir = "trading-app-frontend"
    if not os.path.exists(frontend_dir):
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return False

    # Read example env file
    example_env_path = os.path.join(frontend_dir, ".env.example")
    if not os.path.exists(example_env_path):
        print(f"❌ Frontend .env.example not found")
        return False

    with open(example_env_path, "r") as f:
        env_content = f.read()

    # Create production env (user needs to fill Firebase config)
    production_env_content = env_content.replace(
        "REACT_APP_API_URL=http://localhost:3000", "REACT_APP_API_URL=https://your-app-domain.ondigitalocean.app"
    ).replace("REACT_APP_ENV=development", "REACT_APP_ENV=production")

    prod_env_path = os.path.join(frontend_dir, ".env.production")
    with open(prod_env_path, "w") as f:
        f.write(production_env_content)

    print(f"✅ Created frontend production environment file: {prod_env_path}")
    print("   📝 You need to update Firebase configuration in this file")
    return True


def validate_configuration():
    """Validate the configuration before deployment"""
    issues = []

    # Check Firebase service account
    if not os.path.exists("firebase-service-account.json"):
        issues.append("Firebase service account JSON file missing")

    # Check if app.yaml has been updated
    with open("app.yaml", "r") as f:
        content = f.read()
        if "your-firebase-project-id" in content:
            issues.append("app.yaml still contains placeholder Firebase values")

    # Check frontend production env
    frontend_env = "trading-app-frontend/.env.production"
    if not os.path.exists(frontend_env):
        issues.append("Frontend production environment file missing")
    else:
        with open(frontend_env, "r") as f:
            env_content = f.read()
            if "your-api-key-here" in env_content:
                issues.append("Frontend environment contains placeholder Firebase values")

    return issues


def deploy_to_digitalocean():
    """Deploy to DigitalOcean using doctl"""
    print("\n🚀 Deploying to DigitalOcean...")

    # Check if doctl is available
    if not os.system("doctl version > nul 2>&1") == 0:
        print("❌ doctl command not found. Please install DigitalOcean CLI.")
        return False

    # Get existing app ID (from previous deployments)
    app_id = "9c593cbc-5e59-48a3-b265-692f404027a8"  # Trading Post app ID

    print(f"📱 Updating app: {app_id}")

    # Update the app with new configuration
    result = os.system(f"doctl apps update {app_id} --spec app.yaml")

    if result == 0:
        print("✅ Deployment initiated successfully!")
        print(f"📊 Check deployment status: doctl apps get-deployment {app_id} <deployment-id>")
        print(f"📱 View app: https://cloud.digitalocean.com/apps/{app_id}")
        return True
    else:
        print("❌ Deployment failed. Check the error messages above.")
        return False


def main():
    """Main setup function"""
    print("🔥 Trading Post Firebase Production Setup")
    print("=" * 50)

    # Check current directory
    if not os.path.exists("app.yaml"):
        print("❌ Please run this script from the trading-post directory")
        sys.exit(1)

    # Read Firebase configuration
    print("\n📋 Reading Firebase service account configuration...")
    firebase_config = read_firebase_service_account()

    if not firebase_config:
        print("\n📝 To get Firebase service account:")
        print("   1. Go to Firebase Console → Project Settings → Service Accounts")
        print("   2. Click 'Generate new private key'")
        print("   3. Save as 'firebase-service-account.json' in this directory")
        sys.exit(1)

    print(f"✅ Firebase project: {firebase_config.get('project_id')}")

    # Update app.yaml
    print("\n🔧 Updating app.yaml with Firebase configuration...")
    if not update_app_yaml(firebase_config):
        sys.exit(1)

    # Create frontend production environment
    print("\n🌐 Setting up frontend production environment...")
    create_frontend_production_env()

    # Validate configuration
    print("\n🔍 Validating configuration...")
    issues = validate_configuration()

    if issues:
        print("❌ Configuration issues found:")
        for issue in issues:
            print(f"   - {issue}")
        print("\n📝 Please fix these issues before deploying")
        return

    print("✅ Configuration validation passed!")

    # Ask for deployment confirmation
    print("\n" + "=" * 50)
    print("🚀 Ready to deploy to DigitalOcean!")
    print("=" * 50)
    print("   App ID: 9c593cbc-5e59-48a3-b265-692f404027a8")
    print("   Backend: Python/FastAPI with Firebase SSO")
    print("   Frontend: React with Firebase Auth")
    print("   Features: Google, Facebook, Apple SSO + Email/Password")

    confirm = input("\nDeploy now? (y/N): ").strip().lower()

    if confirm == "y":
        success = deploy_to_digitalocean()
        if success:
            print("\n🎉 Deployment completed!")
            print("\n📝 Next steps:")
            print("   1. Update Firebase authorized domains with your production URL")
            print("   2. Test SSO functionality on production")
            print("   3. Monitor logs for any issues")
        else:
            print("\n❌ Deployment failed. Check the errors above.")
    else:
        print("👍 Deployment cancelled. Run this script again when ready.")
        print("\n📝 Manual deployment:")
        print("   doctl apps update 9c593cbc-5e59-48a3-b265-692f404027a8 --spec app.yaml")


if __name__ == "__main__":
    main()
