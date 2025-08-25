"""
Performance and Load Testing for AI Photo Mode
"""

import asyncio
import time
import concurrent.futures
import statistics
from typing import List, Dict
import requests
import io
from PIL import Image
import tempfile
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIPhotoModePerformanceTester:
    """Performance testing for AI Photo Mode endpoints"""

    def __init__(self, base_url: str = "http://localhost:8000", auth_token: str = None):
        self.base_url = base_url
        self.auth_token = auth_token
        self.headers = {"Authorization": f"Bearer {auth_token}"} if auth_token else {}

    def create_test_image(self, size: tuple = (800, 600), color: str = "red") -> io.BytesIO:
        """Create test image for upload"""
        image = Image.new("RGB", size, color=color)
        img_buffer = io.BytesIO()
        image.save(img_buffer, format="JPEG", quality=85)
        img_buffer.seek(0)
        return img_buffer

    def measure_upload_performance(self, num_requests: int = 10) -> Dict:
        """Measure upload endpoint performance"""
        logger.info(f"Testing upload performance with {num_requests} requests")

        upload_times = []
        success_count = 0
        error_count = 0

        for i in range(num_requests):
            start_time = time.time()

            try:
                # Create test image
                test_image = self.create_test_image()

                # Make upload request
                files = {"photo": ("test.jpg", test_image, "image/jpeg")}
                response = requests.post(
                    f"{self.base_url}/api/items/analyze-photo", files=files, headers=self.headers, timeout=30
                )

                upload_time = time.time() - start_time
                upload_times.append(upload_time)

                if response.status_code == 200:
                    success_count += 1
                else:
                    error_count += 1
                    logger.warning(f"Request {i+1} failed: {response.status_code} - {response.text}")

            except Exception as e:
                error_count += 1
                logger.error(f"Request {i+1} error: {e}")
                upload_times.append(time.time() - start_time)

        # Calculate statistics
        return {
            "total_requests": num_requests,
            "successful_requests": success_count,
            "failed_requests": error_count,
            "success_rate": success_count / num_requests * 100,
            "average_response_time": statistics.mean(upload_times),
            "median_response_time": statistics.median(upload_times),
            "min_response_time": min(upload_times),
            "max_response_time": max(upload_times),
            "std_dev_response_time": statistics.stdev(upload_times) if len(upload_times) > 1 else 0,
        }

    def measure_concurrent_uploads(self, concurrent_users: int = 5, requests_per_user: int = 3) -> Dict:
        """Measure performance under concurrent load"""
        logger.info(f"Testing concurrent performance: {concurrent_users} users, {requests_per_user} requests each")

        def user_upload_session(user_id: int) -> List[float]:
            """Simulate user upload session"""
            session_times = []

            for req_num in range(requests_per_user):
                start_time = time.time()

                try:
                    test_image = self.create_test_image(color=f"rgb({user_id*50 % 255}, {req_num*80 % 255}, 100)")
                    files = {"photo": (f"user{user_id}_req{req_num}.jpg", test_image, "image/jpeg")}

                    response = requests.post(
                        f"{self.base_url}/api/items/analyze-photo", files=files, headers=self.headers, timeout=30
                    )

                    session_times.append(time.time() - start_time)

                except Exception as e:
                    logger.error(f"User {user_id}, Request {req_num} failed: {e}")
                    session_times.append(time.time() - start_time)

            return session_times

        # Execute concurrent sessions
        start_time = time.time()
        all_times = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            future_to_user = {
                executor.submit(user_upload_session, user_id): user_id for user_id in range(concurrent_users)
            }

            for future in concurrent.futures.as_completed(future_to_user):
                user_id = future_to_user[future]
                try:
                    user_times = future.result()
                    all_times.extend(user_times)
                except Exception as e:
                    logger.error(f"User {user_id} session failed: {e}")

        total_time = time.time() - start_time

        return {
            "concurrent_users": concurrent_users,
            "requests_per_user": requests_per_user,
            "total_requests": len(all_times),
            "total_execution_time": total_time,
            "requests_per_second": len(all_times) / total_time,
            "average_response_time": statistics.mean(all_times) if all_times else 0,
            "median_response_time": statistics.median(all_times) if all_times else 0,
            "p95_response_time": self._percentile(all_times, 95) if all_times else 0,
            "p99_response_time": self._percentile(all_times, 99) if all_times else 0,
        }

    def test_rate_limiting(self) -> Dict:
        """Test rate limiting behavior"""
        logger.info("Testing rate limiting behavior")

        # Rapidly send requests to trigger rate limiting
        rapid_requests = 25  # Should exceed typical rate limits
        results = []

        for i in range(rapid_requests):
            try:
                test_image = self.create_test_image()
                files = {"photo": (f"rapid_test_{i}.jpg", test_image, "image/jpeg")}

                start_time = time.time()
                response = requests.post(
                    f"{self.base_url}/api/items/analyze-photo", files=files, headers=self.headers, timeout=10
                )
                response_time = time.time() - start_time

                results.append(
                    {
                        "request_num": i + 1,
                        "status_code": response.status_code,
                        "response_time": response_time,
                        "rate_limited": response.status_code == 429,
                    }
                )

                if response.status_code == 429:
                    logger.info(f"Rate limiting triggered at request {i + 1}")
                    break

            except Exception as e:
                logger.error(f"Rate limiting test request {i + 1} failed: {e}")

        rate_limited_count = sum(1 for r in results if r["rate_limited"])
        successful_count = sum(1 for r in results if r["status_code"] == 200)

        return {
            "total_requests": len(results),
            "successful_requests": successful_count,
            "rate_limited_requests": rate_limited_count,
            "rate_limiting_triggered": rate_limited_count > 0,
            "requests_before_rate_limit": successful_count,
        }

    def test_large_file_handling(self) -> Dict:
        """Test handling of various file sizes"""
        logger.info("Testing large file handling")

        # Test different file sizes
        test_sizes = [
            (400, 300),  # Small
            (1200, 800),  # Medium
            (2400, 1600),  # Large
            (3200, 2400),  # Very large
        ]

        results = []

        for width, height in test_sizes:
            try:
                file_size_mb = (width * height * 3) / (1024 * 1024)  # Rough estimate

                if file_size_mb > 10:  # Skip if larger than 10MB limit
                    continue

                logger.info(f"Testing {width}x{height} image (~{file_size_mb:.1f}MB)")

                test_image = self.create_test_image((width, height))
                files = {"photo": (f"size_test_{width}x{height}.jpg", test_image, "image/jpeg")}

                start_time = time.time()
                response = requests.post(
                    f"{self.base_url}/api/items/analyze-photo", files=files, headers=self.headers, timeout=60
                )
                response_time = time.time() - start_time

                results.append(
                    {
                        "dimensions": f"{width}x{height}",
                        "estimated_size_mb": file_size_mb,
                        "status_code": response.status_code,
                        "response_time": response_time,
                        "success": response.status_code == 200,
                    }
                )

            except Exception as e:
                logger.error(f"Large file test {width}x{height} failed: {e}")
                results.append(
                    {
                        "dimensions": f"{width}x{height}",
                        "estimated_size_mb": file_size_mb,
                        "status_code": 500,
                        "response_time": 0,
                        "success": False,
                        "error": str(e),
                    }
                )

        return {
            "test_cases": results,
            "successful_uploads": sum(1 for r in results if r["success"]),
            "failed_uploads": sum(1 for r in results if not r["success"]),
            "average_response_time": statistics.mean([r["response_time"] for r in results if r["response_time"] > 0]),
        }

    def test_memory_usage_patterns(self, num_sequential_uploads: int = 20) -> Dict:
        """Test memory usage patterns with sequential uploads"""
        logger.info(f"Testing memory usage with {num_sequential_uploads} sequential uploads")

        import psutil
        import os

        process = psutil.Process(os.getpid())
        memory_usage = []

        for i in range(num_sequential_uploads):
            # Record memory before upload
            mem_before = process.memory_info().rss / 1024 / 1024  # MB

            try:
                # Create larger test image to stress memory
                test_image = self.create_test_image((1600, 1200))
                files = {"photo": (f"memory_test_{i}.jpg", test_image, "image/jpeg")}

                response = requests.post(
                    f"{self.base_url}/api/items/analyze-photo", files=files, headers=self.headers, timeout=30
                )

                # Record memory after upload
                mem_after = process.memory_info().rss / 1024 / 1024  # MB

                memory_usage.append(
                    {
                        "upload_num": i + 1,
                        "memory_before_mb": mem_before,
                        "memory_after_mb": mem_after,
                        "memory_delta_mb": mem_after - mem_before,
                        "success": response.status_code == 200,
                    }
                )

                # Small delay to allow garbage collection
                time.sleep(0.1)

            except Exception as e:
                logger.error(f"Memory test upload {i + 1} failed: {e}")

        if memory_usage:
            total_memory_growth = memory_usage[-1]["memory_after_mb"] - memory_usage[0]["memory_before_mb"]
            avg_memory_per_upload = statistics.mean([m["memory_delta_mb"] for m in memory_usage])

            return {
                "total_uploads": len(memory_usage),
                "total_memory_growth_mb": total_memory_growth,
                "average_memory_per_upload_mb": avg_memory_per_upload,
                "peak_memory_mb": max(m["memory_after_mb"] for m in memory_usage),
                "memory_leak_suspected": total_memory_growth
                > (num_sequential_uploads * 5),  # >5MB per upload suggests leak
                "memory_samples": memory_usage,
            }

        return {"error": "No memory data collected"}

    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile of data"""
        if not data:
            return 0

        sorted_data = sorted(data)
        index = (percentile / 100) * (len(sorted_data) - 1)

        if index.is_integer():
            return sorted_data[int(index)]
        else:
            lower = sorted_data[int(index)]
            upper = sorted_data[int(index) + 1]
            return lower + (upper - lower) * (index - int(index))

    def run_full_performance_suite(self) -> Dict:
        """Run complete performance testing suite"""
        logger.info("Starting full performance testing suite")

        results = {"test_start_time": time.time(), "tests": {}}

        try:
            # Basic upload performance
            results["tests"]["upload_performance"] = self.measure_upload_performance(10)

            # Concurrent load testing
            results["tests"]["concurrent_load"] = self.measure_concurrent_uploads(3, 2)  # Reduced for testing

            # Rate limiting
            results["tests"]["rate_limiting"] = self.test_rate_limiting()

            # Large file handling
            results["tests"]["large_files"] = self.test_large_file_handling()

            # Memory usage patterns
            results["tests"]["memory_usage"] = self.test_memory_usage_patterns(10)

        except Exception as e:
            logger.error(f"Performance testing suite failed: {e}")
            results["error"] = str(e)

        results["test_end_time"] = time.time()
        results["total_test_duration"] = results["test_end_time"] - results["test_start_time"]

        return results

    def generate_performance_report(self, results: Dict) -> str:
        """Generate human-readable performance report"""
        report = []
        report.append("=" * 60)
        report.append("AI PHOTO MODE PERFORMANCE TEST REPORT")
        report.append("=" * 60)
        report.append(f"Total Test Duration: {results.get('total_test_duration', 0):.2f} seconds")
        report.append("")

        for test_name, test_results in results.get("tests", {}).items():
            report.append(f"--- {test_name.replace('_', ' ').title()} ---")

            if test_name == "upload_performance":
                report.append(f"  Total Requests: {test_results['total_requests']}")
                report.append(f"  Success Rate: {test_results['success_rate']:.1f}%")
                report.append(f"  Average Response Time: {test_results['average_response_time']:.3f}s")
                report.append(f"  Median Response Time: {test_results['median_response_time']:.3f}s")
                report.append(
                    f"  Min/Max Response Time: {test_results['min_response_time']:.3f}s / {test_results['max_response_time']:.3f}s"
                )

            elif test_name == "concurrent_load":
                report.append(f"  Concurrent Users: {test_results['concurrent_users']}")
                report.append(f"  Total Requests: {test_results['total_requests']}")
                report.append(f"  Requests/Second: {test_results['requests_per_second']:.2f}")
                report.append(f"  Average Response Time: {test_results['average_response_time']:.3f}s")
                report.append(f"  95th Percentile: {test_results['p95_response_time']:.3f}s")
                report.append(f"  99th Percentile: {test_results['p99_response_time']:.3f}s")

            elif test_name == "rate_limiting":
                report.append(
                    f"  Rate Limiting Triggered: {'Yes' if test_results['rate_limiting_triggered'] else 'No'}"
                )
                report.append(f"  Requests Before Rate Limit: {test_results['requests_before_rate_limit']}")
                report.append(f"  Rate Limited Requests: {test_results['rate_limited_requests']}")

            elif test_name == "memory_usage":
                if "error" not in test_results:
                    report.append(f"  Total Memory Growth: {test_results['total_memory_growth_mb']:.2f}MB")
                    report.append(f"  Average Memory per Upload: {test_results['average_memory_per_upload_mb']:.2f}MB")
                    report.append(f"  Peak Memory: {test_results['peak_memory_mb']:.2f}MB")
                    report.append(
                        f"  Memory Leak Suspected: {'Yes' if test_results['memory_leak_suspected'] else 'No'}"
                    )
                else:
                    report.append(f"  Error: {test_results['error']}")

            report.append("")

        return "\n".join(report)


def main():
    """Run performance tests"""
    # Configuration
    BASE_URL = "http://localhost:8000"
    AUTH_TOKEN = None  # Add your test token here

    # Create tester
    tester = AIPhotoModePerformanceTester(BASE_URL, AUTH_TOKEN)

    # Run tests
    logger.info("Starting AI Photo Mode performance tests...")
    results = tester.run_full_performance_suite()

    # Generate and save report
    report = tester.generate_performance_report(results)
    print(report)

    # Save detailed results to file
    with open("ai_photo_mode_performance_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)

    logger.info("Performance testing completed. Results saved to ai_photo_mode_performance_results.json")


if __name__ == "__main__":
    main()
