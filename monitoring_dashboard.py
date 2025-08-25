#!/usr/bin/env python3
"""
Trading Post Error Monitoring Dashboard
Simple command-line dashboard for monitoring system health and errors
"""

import asyncio
import time
import json
import os
from datetime import datetime
from typing import Dict, Any
import requests
import argparse

class MonitoringDashboard:
    """Simple command-line monitoring dashboard"""
    
    def __init__(self, base_url: str = "http://localhost:8000", api_token: str = None):
        self.base_url = base_url.rstrip('/')
        self.api_token = api_token
        self.session = requests.Session()
        
        if api_token:
            self.session.headers.update({'Authorization': f'Bearer {api_token}'})
    
    def get_endpoint(self, endpoint: str) -> Dict[str, Any]:
        """Make API request to monitoring endpoint"""
        try:
            url = f"{self.base_url}/api/monitoring{endpoint}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def format_number(self, num: float, unit: str = "") -> str:
        """Format numbers for display"""
        if num >= 1000:
            return f"{num/1000:.1f}k{unit}"
        elif num >= 1:
            return f"{num:.1f}{unit}"
        else:
            return f"{num:.3f}{unit}"
    
    def print_separator(self, title: str = None):
        """Print section separator"""
        if title:
            print(f"\n{'='*60}")
            print(f" {title.upper()}")
            print('='*60)
        else:
            print('-'*60)
    
    def display_system_health(self):
        """Display current system health"""
        self.print_separator("System Health")
        
        health_data = self.get_endpoint("/system/health")
        
        if not health_data.get("success"):
            print(f"❌ Failed to get system health: {health_data.get('error', 'Unknown error')}")
            return
        
        data = health_data["data"]
        status = data.get("status", "unknown")
        
        # Status indicator
        status_icon = "✅" if status == "healthy" else "⚠️" if status == "warning" else "❌"
        print(f"Status: {status_icon} {status.upper()}")
        
        # System metrics
        cpu = data.get("cpu_percent", 0)
        memory = data.get("memory_percent", 0)
        disk = data.get("disk_usage_percent", 0)
        
        print(f"CPU Usage:    {cpu:.1f}% {'⚠️' if cpu > 80 else '✅' if cpu < 50 else '⏳'}")
        print(f"Memory Usage: {memory:.1f}% {'⚠️' if memory > 80 else '✅' if memory < 50 else '⏳'}")
        print(f"Disk Usage:   {disk:.1f}% {'⚠️' if disk > 90 else '✅' if disk < 70 else '⏳'}")
        
        # Performance metrics
        error_rate = data.get("error_rate", 0)
        avg_response = data.get("avg_response_time", 0)
        connections = data.get("active_connections", 0)
        
        print(f"Error Rate:   {error_rate} errors/min {'⚠️' if error_rate > 5 else '✅'}")
        print(f"Avg Response: {avg_response:.3f}s {'⚠️' if avg_response > 2 else '✅'}")
        print(f"Connections:  {connections}")
        
        timestamp = data.get("timestamp", "")
        print(f"Last Updated: {timestamp}")
    
    def display_error_summary(self, hours: int = 24):
        """Display error summary"""
        self.print_separator(f"Error Summary (Last {hours}h)")
        
        error_data = self.get_endpoint(f"/errors/summary?hours={hours}")
        
        if not error_data.get("success"):
            print(f"❌ Failed to get error summary: {error_data.get('error', 'Unknown error')}")
            return
        
        data = error_data["data"]
        
        total_errors = data.get("total_errors", 0)
        unresolved = data.get("unresolved_count", 0)
        
        print(f"Total Errors:     {total_errors} {'⚠️' if total_errors > 50 else '✅' if total_errors == 0 else '⏳'}")
        print(f"Unresolved:       {unresolved} {'⚠️' if unresolved > 10 else '✅' if unresolved == 0 else '⏳'}")
        
        # Error types
        by_type = data.get("by_type", {})
        if by_type:
            print("\nError Types:")
            for error_type, count in sorted(by_type.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"  {error_type}: {count}")
        
        # Error levels
        by_level = data.get("by_level", {})
        if by_level:
            print("\nError Levels:")
            for level, count in by_level.items():
                icon = "🔴" if level == "CRITICAL" else "🟠" if level == "ERROR" else "🟡" if level == "WARNING" else "🔵"
                print(f"  {icon} {level}: {count}")
        
        # Recent errors
        recent = data.get("recent_errors", [])
        if recent:
            print("\nRecent Errors:")
            for error in recent[:3]:
                time_str = error.get("created_at", "")[:19]  # Remove microseconds
                print(f"  [{time_str}] {error.get('type', 'Unknown')}: {error.get('message', '')[:60]}...")
    
    def display_performance_summary(self, hours: int = 24):
        """Display performance summary"""
        self.print_separator(f"Performance Summary (Last {hours}h)")
        
        perf_data = self.get_endpoint(f"/performance/summary?hours={hours}")
        
        if not perf_data.get("success"):
            print(f"❌ Failed to get performance summary: {perf_data.get('error', 'Unknown error')}")
            return
        
        data = perf_data["data"]
        
        if data.get("message"):
            print(f"ℹ️ {data['message']}")
            return
        
        total_requests = data.get("total_requests", 0)
        avg_response = data.get("avg_response_time", 0)
        max_response = data.get("max_response_time", 0)
        slow_requests = data.get("slow_requests", 0)
        
        print(f"Total Requests:   {total_requests}")
        print(f"Avg Response:     {avg_response:.3f}s {'⚠️' if avg_response > 2 else '✅'}")
        print(f"Max Response:     {max_response:.3f}s {'⚠️' if max_response > 5 else '⏳'}")
        print(f"Slow Requests:    {slow_requests} {'⚠️' if slow_requests > 10 else '✅'}")
        
        # Top endpoints by response time
        by_endpoint = data.get("by_endpoint", {})
        if by_endpoint:
            print("\nSlowest Endpoints:")
            sorted_endpoints = sorted(
                by_endpoint.items(), 
                key=lambda x: x[1].get("avg_response_time", 0), 
                reverse=True
            )
            
            for endpoint, metrics in sorted_endpoints[:5]:
                avg_time = metrics.get("avg_response_time", 0)
                requests_count = metrics.get("requests", 0)
                slow_count = metrics.get("slow_requests", 0)
                
                icon = "⚠️" if avg_time > 2 else "⏳" if avg_time > 1 else "✅"
                print(f"  {icon} {endpoint}: {avg_time:.3f}s avg ({requests_count} req, {slow_count} slow)")
        
        # Status codes
        by_status = data.get("by_status_code", {})
        if by_status:
            print("\nStatus Codes:")
            for status, count in sorted(by_status.items()):
                icon = "✅" if status < 400 else "⚠️" if status < 500 else "❌"
                print(f"  {icon} {status}: {count}")
    
    def display_alerts(self, limit: int = 10):
        """Display recent alerts"""
        self.print_separator(f"Recent Alerts (Last {limit})")
        
        alerts_data = self.get_endpoint(f"/alerts/recent?limit={limit}")
        
        if not alerts_data.get("success"):
            print(f"❌ Failed to get alerts: {alerts_data.get('error', 'Unknown error')}")
            return
        
        alerts = alerts_data.get("data", [])
        
        if not alerts:
            print("✅ No recent alerts")
            return
        
        for alert in alerts:
            severity = alert.get("severity", "unknown")
            acknowledged = alert.get("acknowledged", False)
            
            # Icons
            severity_icon = "🔴" if severity == "critical" else "🟠" if severity == "high" else "🟡" if severity == "medium" else "🔵"
            ack_icon = "✅" if acknowledged else "❗"
            
            time_str = alert.get("created_at", "")[:19]
            title = alert.get("title", "Unknown Alert")
            
            print(f"{ack_icon} {severity_icon} [{time_str}] {title}")
            
            message = alert.get("message", "")
            if len(message) > 80:
                message = message[:77] + "..."
            print(f"    {message}")
    
    def display_dashboard(self, hours: int = 24):
        """Display complete monitoring dashboard"""
        print(f"\n🔍 Trading Post Monitoring Dashboard")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            self.display_system_health()
            self.display_error_summary(hours)
            self.display_performance_summary(hours)
            self.display_alerts()
            
        except KeyboardInterrupt:
            print("\n\n👋 Dashboard interrupted by user")
        except Exception as e:
            print(f"\n❌ Dashboard error: {e}")
    
    def run_continuous(self, interval: int = 30, hours: int = 24):
        """Run dashboard continuously with refresh"""
        print(f"🔄 Starting continuous monitoring (refresh every {interval}s)")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                # Clear screen (works on most terminals)
                os.system('clear' if os.name == 'posix' else 'cls')
                
                self.display_dashboard(hours)
                
                print(f"\n⏱️ Next refresh in {interval} seconds...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n\n👋 Continuous monitoring stopped")


def main():
    """Main function with CLI argument parsing"""
    parser = argparse.ArgumentParser(description="Trading Post Monitoring Dashboard")
    
    parser.add_argument(
        "--url", 
        default="http://localhost:8000",
        help="Base URL of the Trading Post API (default: http://localhost:8000)"
    )
    
    parser.add_argument(
        "--token",
        help="API authentication token (if required)"
    )
    
    parser.add_argument(
        "--hours",
        type=int,
        default=24,
        help="Time period for summaries in hours (default: 24)"
    )
    
    parser.add_argument(
        "--continuous",
        action="store_true",
        help="Run dashboard continuously with auto-refresh"
    )
    
    parser.add_argument(
        "--interval",
        type=int,
        default=30,
        help="Refresh interval in seconds for continuous mode (default: 30)"
    )
    
    parser.add_argument(
        "--alerts-only",
        action="store_true",
        help="Show only alerts"
    )
    
    parser.add_argument(
        "--health-only",
        action="store_true",
        help="Show only system health"
    )
    
    args = parser.parse_args()
    
    # Create dashboard instance
    dashboard = MonitoringDashboard(
        base_url=args.url,
        api_token=args.token
    )
    
    try:
        if args.alerts_only:
            dashboard.display_alerts()
        elif args.health_only:
            dashboard.display_system_health()
        elif args.continuous:
            dashboard.run_continuous(args.interval, args.hours)
        else:
            dashboard.display_dashboard(args.hours)
            
    except Exception as e:
        print(f"❌ Dashboard failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())