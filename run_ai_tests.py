#!/usr/bin/env python3
"""
AI Photo Mode Test Runner
Comprehensive testing for AI Photo Mode functionality
"""
import sys
import subprocess
import json
import time
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def run_unit_tests():
    """Run unit tests with pytest"""
    logger.info("Running unit tests...")

    try:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pytest",
                "test_ai_photo_mode.py",
                "-v",
                "--tb=short",
                "--cov=app_sqlite",
                "--cov=security_config",
                "--cov-report=html",
                "--cov-report=term-missing",
            ],
            capture_output=True,
            text=True,
            timeout=300,
        )

        print("UNIT TEST OUTPUT:")
        print(result.stdout)

        if result.stderr:
            print("UNIT TEST ERRORS:")
            print(result.stderr)

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        logger.error("Unit tests timed out after 5 minutes")
        return False
    except Exception as e:
        logger.error(f"Failed to run unit tests: {e}")
        return False


def run_performance_tests():
    """Run performance tests"""
    logger.info("Running performance tests...")

    try:
        result = subprocess.run([sys.executable, "performance_test_ai.py"], capture_output=True, text=True, timeout=600)

        print("PERFORMANCE TEST OUTPUT:")
        print(result.stdout)

        if result.stderr:
            print("PERFORMANCE TEST ERRORS:")
            print(result.stderr)

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        logger.error("Performance tests timed out after 10 minutes")
        return False
    except Exception as e:
        logger.error(f"Failed to run performance tests: {e}")
        return False


def run_security_tests():
    """Run security-specific tests"""
    logger.info("Running security tests...")

    try:
        # Run security-focused tests
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pytest",
                "test_ai_photo_mode.py::TestAIPhotoMode::test_security_validator_malicious_file",
                "test_ai_photo_mode.py::TestAIPhotoMode::test_ai_photo_upload_security_rejection",
                "test_ai_photo_mode.py::TestAIPhotoMode::test_ai_photo_rate_limiting",
                "test_ai_photo_mode.py::TestAIPhotoMode::test_filename_sanitization",
                "test_ai_photo_mode.py::TestAIPhotoMode::test_rate_limiter",
                "-v",
            ],
            capture_output=True,
            text=True,
            timeout=180,
        )

        print("SECURITY TEST OUTPUT:")
        print(result.stdout)

        if result.stderr:
            print("SECURITY TEST ERRORS:")
            print(result.stderr)

        return result.returncode == 0

    except Exception as e:
        logger.error(f"Failed to run security tests: {e}")
        return False


def validate_environment():
    """Validate test environment"""
    logger.info("Validating test environment...")

    required_files = [
        "app_sqlite.py",
        "security_config.py",
        "test_ai_photo_mode.py",
        "performance_test_ai.py",
        "requirements.txt",
    ]

    missing_files = []
    for file in required_files:
        if not Path(file).exists():
            missing_files.append(file)

    if missing_files:
        logger.error(f"Missing required files: {missing_files}")
        return False

    # Check if we can import key modules
    try:
        import pytest
        import requests
        import PIL

        logger.info("Required test dependencies available")
    except ImportError as e:
        logger.error(f"Missing required dependency: {e}")
        return False

    return True


def run_integration_test():
    """Run a simple integration test"""
    logger.info("Running integration test...")

    try:
        # Test that the main modules can be imported
        import app_sqlite
        import security_config

        # Test that security configuration is loaded
        assert hasattr(security_config, "SECURITY_CONFIG")
        assert hasattr(security_config, "ImageSecurityValidator")
        assert hasattr(security_config, "RateLimitTracker")

        # Test that AI service can be instantiated
        grok_service = app_sqlite.GrokAIService()
        assert grok_service is not None

        logger.info("Integration test passed")
        return True

    except Exception as e:
        logger.error(f"Integration test failed: {e}")
        return False


def generate_test_report(results):
    """Generate comprehensive test report"""
    report = {
        "timestamp": time.time(),
        "test_results": results,
        "summary": {
            "total_tests": len(results),
            "passed_tests": sum(1 for r in results.values() if r),
            "failed_tests": sum(1 for r in results.values() if not r),
            "success_rate": sum(1 for r in results.values() if r) / len(results) * 100,
        },
    }

    # Save detailed report
    with open("ai_photo_mode_test_report.json", "w") as f:
        json.dump(report, f, indent=2)

    # Print summary
    print("\n" + "=" * 60)
    print("AI PHOTO MODE TEST SUMMARY")
    print("=" * 60)

    for test_name, passed in results.items():
        status = "PASS" if passed else "FAIL"
        print(f"{test_name:30} {status:>10}")

    print("-" * 60)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Success Rate: {report['summary']['success_rate']:.1f}%")
    print("=" * 60)

    return report["summary"]["success_rate"] == 100.0


def main():
    """Main test runner"""
    logger.info("Starting AI Photo Mode comprehensive testing...")

    # Validate environment first
    if not validate_environment():
        logger.error("Environment validation failed. Exiting.")
        sys.exit(1)

    # Run all test suites
    test_results = {}

    # Integration test
    test_results["integration_test"] = run_integration_test()

    # Unit tests
    test_results["unit_tests"] = run_unit_tests()

    # Security tests
    test_results["security_tests"] = run_security_tests()

    # Performance tests (optional - can be skipped in CI)
    if "--skip-performance" not in sys.argv:
        test_results["performance_tests"] = run_performance_tests()
    else:
        logger.info("Skipping performance tests (--skip-performance flag used)")

    # Generate comprehensive report
    all_tests_passed = generate_test_report(test_results)

    if all_tests_passed:
        logger.info("All tests passed! AI Photo Mode is ready for deployment.")
        sys.exit(0)
    else:
        logger.error("Some tests failed. Please review the results before deployment.")
        sys.exit(1)


if __name__ == "__main__":
    main()
