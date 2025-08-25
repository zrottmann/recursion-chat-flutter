#!/usr/bin/env python3
"""
Performance Analysis and Optimization Script for Trading Post
Runs comprehensive performance analysis and applies optimizations
"""

import os
import sys
import asyncio
import logging
from datetime import datetime

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    """Main performance analysis and optimization routine"""
    logger.info("🚀 Starting Trading Post Performance Analysis...")
    logger.info("=" * 60)
    
    try:
        # Import performance optimizer
        from performance_optimizer import (
            performance_optimizer,
            analyze_performance,
            optimize_system,
            get_performance_report
        )
        
        logger.info("✅ Performance optimizer loaded successfully")
        
        # Step 1: Run comprehensive performance analysis
        logger.info("📊 Step 1: Running comprehensive performance analysis...")
        analysis_results = await analyze_performance()
        
        print("\n" + "="*60)
        print("🔍 PERFORMANCE ANALYSIS RESULTS")
        print("="*60)
        
        # Display system snapshot
        snapshot = analysis_results.get("system_snapshot", {})
        print(f"\n📈 SYSTEM SNAPSHOT:")
        print(f"   CPU Usage: {snapshot.get('cpu_percent', 0):.1f}%")
        print(f"   Memory Usage: {snapshot.get('memory_percent', 0):.1f}%")
        print(f"   Disk Usage: {snapshot.get('disk_usage_percent', 0):.1f}%")
        print(f"   Cache Hit Rate: {snapshot.get('cache_hit_rate', 0):.1f}%")
        print(f"   Average Response Time: {snapshot.get('avg_response_time', 0):.3f}s")
        print(f"   Slow Queries: {snapshot.get('slow_queries_count', 0)}")
        
        # Display bottlenecks
        bottlenecks = analysis_results.get("bottlenecks", [])
        print(f"\n⚠️  PERFORMANCE BOTTLENECKS FOUND: {len(bottlenecks)}")
        
        for i, bottleneck in enumerate(bottlenecks, 1):
            severity_emoji = {
                "critical": "🚨",
                "high": "⚠️",
                "medium": "🔶",
                "low": "ℹ️"
            }.get(bottleneck.get("severity", "low"), "ℹ️")
            
            print(f"\n   {i}. {severity_emoji} {bottleneck.get('severity', 'unknown').upper()}: {bottleneck.get('category', 'unknown')} issue")
            print(f"      Description: {bottleneck.get('description', 'No description')}")
            print(f"      Impact: {bottleneck.get('impact', 'Unknown impact')}")
            print(f"      Recommendation: {bottleneck.get('recommendation', 'No recommendation')}")
            print(f"      Value: {bottleneck.get('metric_value', 0):.2f} (Threshold: {bottleneck.get('threshold', 0):.2f})")
            if bottleneck.get('endpoint'):
                print(f"      Endpoint: {bottleneck.get('endpoint')}")
        
        # Display database analysis
        db_analysis = analysis_results.get("database_analysis", {})
        if db_analysis and not db_analysis.get("error"):
            print(f"\n🗄️  DATABASE ANALYSIS:")
            tables = db_analysis.get("tables", [])
            print(f"   Tables analyzed: {len(tables)}")
            
            for table in tables:
                if isinstance(table, dict) and not table.get("error"):
                    print(f"   • {table.get('table_name', 'Unknown')}: {table.get('row_count', 0)} rows, {table.get('index_count', 0)} indexes")
                    
        # Display recommendations
        recommendations = analysis_results.get("recommendations", [])
        print(f"\n💡 OPTIMIZATION RECOMMENDATIONS: {len(recommendations)}")
        
        for i, rec in enumerate(recommendations, 1):
            print(f"\n   {i}. {rec.get('table', 'System')} - {rec.get('optimization_type', 'general')}")
            print(f"      {rec.get('recommendation', 'No recommendation')}")
            print(f"      Estimated improvement: {rec.get('estimated_improvement', 'Unknown')}")
            if rec.get('sql_command'):
                print(f"      SQL: {rec.get('sql_command')}")
        
        # Step 2: Apply automatic optimizations
        logger.info("\n🔧 Step 2: Applying automatic optimizations...")
        optimization_results = await optimize_system()
        
        print("\n" + "="*60)
        print("🔧 AUTOMATIC OPTIMIZATIONS APPLIED")
        print("="*60)
        
        if optimization_results.get("optimizations_applied"):
            for opt in optimization_results["optimizations_applied"]:
                print(f"   ✅ {opt}")
        else:
            print("   ℹ️  No automatic optimizations were applied")
            
        if optimization_results.get("error"):
            print(f"   ❌ Error during optimization: {optimization_results['error']}")
        
        # Step 3: Generate comprehensive report
        logger.info("\n📋 Step 3: Generating comprehensive performance report...")
        performance_report = await get_performance_report()
        
        print("\n" + "="*60)
        print("📋 COMPREHENSIVE PERFORMANCE REPORT")
        print("="*60)
        print(performance_report)
        
        # Step 4: Save report to file
        report_filename = f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(report_filename, 'w', encoding='utf-8') as f:
            f.write(performance_report)
        
        print(f"\n💾 Report saved to: {report_filename}")
        
        # Summary
        print("\n" + "="*60)
        print("📊 PERFORMANCE ANALYSIS SUMMARY")
        print("="*60)
        print(f"   🔍 Bottlenecks identified: {len(bottlenecks)}")
        print(f"   💡 Recommendations generated: {len(recommendations)}")
        print(f"   🔧 Optimizations applied: {len(optimization_results.get('optimizations_applied', []))}")
        print(f"   📋 Report saved: {report_filename}")
        
        # Determine overall system status
        critical_issues = len([b for b in bottlenecks if b.get("severity") == "critical"])
        high_issues = len([b for b in bottlenecks if b.get("severity") == "high"])
        
        if critical_issues > 0:
            print("   🚨 System Status: CRITICAL - Immediate attention required!")
        elif high_issues > 0:
            print("   ⚠️  System Status: WARNING - Performance improvements recommended")
        elif len(bottlenecks) > 0:
            print("   🔶 System Status: GOOD - Minor optimizations available")
        else:
            print("   ✅ System Status: EXCELLENT - No major performance issues detected")
        
        print("\n🎯 Next Steps:")
        print("   1. Review the generated performance report")
        print("   2. Address critical and high-severity bottlenecks first")
        print("   3. Monitor system performance regularly")
        print("   4. Apply additional optimizations as needed")
        
        logger.info("✅ Performance analysis completed successfully!")
        
    except ImportError as e:
        logger.error(f"❌ Failed to import performance optimizer: {e}")
        logger.error("Make sure performance_optimizer.py is available and properly configured")
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"❌ Performance analysis failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

def run_quick_health_check():
    """Run a quick system health check without full analysis"""
    try:
        import psutil
        
        print("🏥 QUICK SYSTEM HEALTH CHECK")
        print("="*40)
        
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_status = "🟢" if cpu_percent < 70 else "🟡" if cpu_percent < 85 else "🔴"
        print(f"   CPU Usage: {cpu_percent:.1f}% {cpu_status}")
        
        # Memory
        memory = psutil.virtual_memory()
        memory_status = "🟢" if memory.percent < 80 else "🟡" if memory.percent < 90 else "🔴"
        print(f"   Memory Usage: {memory.percent:.1f}% {memory_status}")
        
        # Disk
        disk = psutil.disk_usage('/')
        disk_status = "🟢" if disk.percent < 80 else "🟡" if disk.percent < 90 else "🔴"
        print(f"   Disk Usage: {disk.percent:.1f}% {disk_status}")
        
        # Load average (if available)
        if hasattr(os, 'getloadavg'):
            load_avg = os.getloadavg()
            print(f"   Load Average: {load_avg[0]:.2f}, {load_avg[1]:.2f}, {load_avg[2]:.2f}")
        
        print("\nFor detailed analysis, run: python run_performance_analysis.py")
        
    except Exception as e:
        print(f"❌ Health check failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        run_quick_health_check()
    else:
        asyncio.run(main())