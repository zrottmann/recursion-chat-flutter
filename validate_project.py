#!/usr/bin/env python3
"""
Flutter Recursion Chat Project Validator
Validates project structure and dependencies without requiring Flutter SDK
"""

import os
import json
import re
import yaml

def validate_flutter_project():
    """Validate Flutter project structure and dependencies"""
    print("🔍 Validating Flutter Recursion Chat Project...")
    print("=" * 50)
    
    errors = []
    warnings = []
    
    # Check essential files
    essential_files = [
        'pubspec.yaml',
        'lib/main.dart',
        'lib/services/auth_service.dart',
        'lib/services/appwrite_service.dart',
        'lib/models/user_model.dart',
        'web/index.html',
        'web/manifest.json'
    ]
    
    print("📁 Checking essential files...")
    for file in essential_files:
        if os.path.exists(file):
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file}")
            errors.append(f"Missing essential file: {file}")
    
    # Validate pubspec.yaml
    print("\n📦 Validating pubspec.yaml...")
    try:
        with open('pubspec.yaml', 'r') as f:
            pubspec = yaml.safe_load(f)
        
        # Check Flutter SDK version
        sdk_constraint = pubspec.get('environment', {}).get('sdk', '')
        print(f"  📌 SDK Constraint: {sdk_constraint}")
        
        # Check dependencies
        deps = pubspec.get('dependencies', {})
        required_deps = ['flutter', 'provider', 'appwrite', 'http']
        
        for dep in required_deps:
            if dep in deps:
                print(f"  ✅ {dep}: {deps.get(dep, 'N/A')}")
            else:
                print(f"  ⚠️  {dep}: Missing")
                warnings.append(f"Missing recommended dependency: {dep}")
                
    except Exception as e:
        print(f"  ❌ Error reading pubspec.yaml: {e}")
        errors.append("Invalid pubspec.yaml")
    
    # Check Dart syntax in main files
    print("\n🎯 Validating Dart syntax...")
    dart_files = [
        'lib/main.dart',
        'lib/services/auth_service.dart',
        'lib/services/appwrite_service.dart'
    ]
    
    for dart_file in dart_files:
        if os.path.exists(dart_file):
            try:
                with open(dart_file, 'r') as f:
                    content = f.read()
                
                # Basic syntax checks
                if 'import ' in content and 'class ' in content:
                    print(f"  ✅ {dart_file}: Basic syntax OK")
                else:
                    print(f"  ⚠️  {dart_file}: Minimal Dart structure")
                    warnings.append(f"Minimal Dart structure in {dart_file}")
                    
            except Exception as e:
                print(f"  ❌ {dart_file}: Error reading - {e}")
                errors.append(f"Cannot read {dart_file}")
        else:
            print(f"  ❌ {dart_file}: Not found")
            errors.append(f"Missing Dart file: {dart_file}")
    
    # Check web configuration
    print("\n🌐 Validating web configuration...")
    if os.path.exists('web/index.html'):
        with open('web/index.html', 'r') as f:
            html_content = f.read()
        
        if 'flutter' in html_content.lower():
            print("  ✅ web/index.html: Flutter web configuration detected")
        else:
            print("  ⚠️  web/index.html: No Flutter configuration found")
            warnings.append("web/index.html missing Flutter configuration")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 VALIDATION SUMMARY")
    print("=" * 50)
    
    if not errors and not warnings:
        print("🎉 PROJECT VALIDATION SUCCESSFUL!")
        print("✅ All essential files present")
        print("✅ Dependencies properly configured")
        print("✅ Dart syntax appears valid")
        print("✅ Web configuration ready")
        print("\n🚀 Project ready for Flutter development!")
        return True
    
    if errors:
        print(f"❌ ERRORS FOUND ({len(errors)}):")
        for error in errors:
            print(f"  • {error}")
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for warning in warnings:
            print(f"  • {warning}")
    
    if not errors:
        print("\n✅ No critical errors - project should work with Flutter SDK")
        return True
    else:
        print("\n❌ Critical errors found - please fix before running Flutter")
        return False

if __name__ == "__main__":
    try:
        success = validate_flutter_project()
        exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Validation script error: {e}")
        exit(1)