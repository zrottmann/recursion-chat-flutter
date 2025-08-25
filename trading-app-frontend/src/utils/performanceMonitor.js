/**
 * Performance Monitoring and Optimization Utilities
 * 
 * Comprehensive performance monitoring system for the AI matching engine
 * that tracks response times, success rates, and system health metrics.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = {
      matchingResponseTime: 5000, // 5 seconds max
      acceptanceRate: 0.85, // 85% minimum
      userSatisfaction: 4.5, // 4.5/5 minimum
      errorRate: 0.05, // 5% maximum
      cacheHitRate: 0.80, // 80% minimum
      memoryUsage: 0.80, // 80% maximum
      cpuUsage: 0.70 // 70% maximum
    };
    
    this.startMonitoring();
  }

  /**
   * Start background performance monitoring
   */
  startMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
      this.analyzePerformance();
      this.checkThresholds();
    }, 30000);

    // Detailed analysis every 5 minutes
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000);
  }

  /**
   * Track AI matching performance
   */
  trackMatchingPerformance(operation, duration, success = true, metadata = {}) {
    const timestamp = Date.now();
    const metric = {
      operation,
      duration,
      success,
      timestamp,
      metadata
    };

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    this.metrics.get(operation).push(metric);

    // Keep only last 1000 entries per operation
    const operationMetrics = this.metrics.get(operation);
    if (operationMetrics.length > 1000) {
      operationMetrics.splice(0, operationMetrics.length - 1000);
    }

    // Real-time alerting for critical issues
    if (duration > this.thresholds.matchingResponseTime) {
      this.addAlert('performance', `Slow ${operation}: ${duration}ms`, 'warning');
    }

    if (!success) {
      this.addAlert('error', `Failed ${operation}`, 'error');
    }
  }

  /**
   * Track user interaction metrics
   */
  trackUserInteraction(userId, interactionType, outcome, metadata = {}) {
    const timestamp = Date.now();
    const interaction = {
      userId,
      interactionType,
      outcome,
      timestamp,
      metadata
    };

    const key = 'user_interactions';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key).push(interaction);
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(cacheType, hit = true) {
    const key = `cache_${cacheType}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, { hits: 0, misses: 0 });
    }

    const cacheMetrics = this.metrics.get(key);
    if (hit) {
      cacheMetrics.hits++;
    } else {
      cacheMetrics.misses++;
    }
  }

  /**
   * Collect system resource metrics
   */
  collectSystemMetrics() {
    try {
      // Memory usage (if available)
      if (performance.memory) {
        const memoryUsage = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };

        if (!this.metrics.has('memory_usage')) {
          this.metrics.set('memory_usage', []);
        }
        this.metrics.get('memory_usage').push(memoryUsage);
      }

      // Performance timing
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const timing = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          timestamp: Date.now()
        };

        if (!this.metrics.has('page_timing')) {
          this.metrics.set('page_timing', []);
        }
        this.metrics.get('page_timing').push(timing);
      }
    } catch (error) {
      console.warn('Error collecting system metrics:', error);
    }
  }

  /**
   * Analyze performance trends
   */
  analyzePerformance() {
    const analysis = {
      timestamp: Date.now(),
      matching: this.analyzeMatchingPerformance(),
      userBehavior: this.analyzeUserBehavior(),
      systemHealth: this.analyzeSystemHealth(),
      recommendations: []
    };

    // Generate optimization recommendations
    analysis.recommendations = this.generateOptimizationRecommendations(analysis);

    if (!this.metrics.has('performance_analysis')) {
      this.metrics.set('performance_analysis', []);
    }
    this.metrics.get('performance_analysis').push(analysis);

    return analysis;
  }

  /**
   * Analyze AI matching performance
   */
  analyzeMatchingPerformance() {
    const matchingMetrics = this.metrics.get('ai_matching') || [];
    const recentMetrics = matchingMetrics.filter(m => 
      Date.now() - m.timestamp < 3600000 // Last hour
    );

    if (recentMetrics.length === 0) {
      return { avgResponseTime: 0, successRate: 1, throughput: 0 };
    }

    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const successfulOperations = recentMetrics.filter(m => m.success).length;
    const successRate = successfulOperations / recentMetrics.length;
    const throughput = recentMetrics.length / 60; // Operations per minute

    return {
      avgResponseTime,
      successRate,
      throughput,
      totalOperations: recentMetrics.length
    };
  }

  /**
   * Analyze user behavior patterns
   */
  analyzeUserBehavior() {
    const interactions = this.metrics.get('user_interactions') || [];
    const recentInteractions = interactions.filter(i => 
      Date.now() - i.timestamp < 86400000 // Last 24 hours
    );

    if (recentInteractions.length === 0) {
      return { acceptanceRate: 0, engagementRate: 0, satisfactionScore: 0 };
    }

    const acceptedMatches = recentInteractions.filter(i => 
      i.interactionType === 'match_accepted'
    ).length;
    const declinedMatches = recentInteractions.filter(i => 
      i.interactionType === 'match_declined'
    ).length;
    const totalMatchInteractions = acceptedMatches + declinedMatches;
    
    const acceptanceRate = totalMatchInteractions > 0 ? 
      acceptedMatches / totalMatchInteractions : 0;

    // Calculate engagement rate (interactions per active user)
    const activeUsers = new Set(recentInteractions.map(i => i.userId)).size;
    const engagementRate = activeUsers > 0 ? recentInteractions.length / activeUsers : 0;

    // Mock satisfaction score (would be calculated from user feedback)
    const satisfactionScore = 4.5; // This would come from actual user ratings

    return {
      acceptanceRate,
      engagementRate,
      satisfactionScore,
      totalInteractions: recentInteractions.length,
      activeUsers
    };
  }

  /**
   * Analyze system health metrics
   */
  analyzeSystemHealth() {
    const health = {
      memoryUsage: 0,
      cacheEfficiency: {},
      errorRate: 0,
      alertCount: this.alerts.length
    };

    // Memory usage analysis
    const memoryMetrics = this.metrics.get('memory_usage') || [];
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      health.memoryUsage = latestMemory.used / latestMemory.limit;
    }

    // Cache efficiency analysis
    for (const [key, value] of this.metrics.entries()) {
      if (key.startsWith('cache_')) {
        const cacheType = key.replace('cache_', '');
        const total = value.hits + value.misses;
        health.cacheEfficiency[cacheType] = total > 0 ? value.hits / total : 0;
      }
    }

    // Error rate calculation
    const allOperations = Array.from(this.metrics.values())
      .flat()
      .filter(m => Object.prototype.hasOwnProperty.call(m, 'success') && Date.now() - m.timestamp < 3600000);
    
    if (allOperations.length > 0) {
      const failures = allOperations.filter(m => !m.success).length;
      health.errorRate = failures / allOperations.length;
    }

    return health;
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(analysis) {
    const recommendations = [];

    // Performance recommendations
    if (analysis.matching.avgResponseTime > this.thresholds.matchingResponseTime) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize AI Matching Speed',
        description: `Average response time is ${analysis.matching.avgResponseTime}ms, exceeding ${this.thresholds.matchingResponseTime}ms threshold`,
        suggestions: [
          'Implement result caching',
          'Optimize database queries',
          'Consider parallel processing',
          'Review algorithm complexity'
        ]
      });
    }

    // User behavior recommendations
    if (analysis.userBehavior.acceptanceRate < this.thresholds.acceptanceRate) {
      recommendations.push({
        type: 'user_experience',
        priority: 'high',
        title: 'Improve Match Quality',
        description: `Match acceptance rate is ${(analysis.userBehavior.acceptanceRate * 100).toFixed(1)}%, below target of ${(this.thresholds.acceptanceRate * 100)}%`,
        suggestions: [
          'Enhance ML algorithms',
          'Improve user preference learning',
          'Add more filtering options',
          'Provide better match explanations'
        ]
      });
    }

    // System health recommendations
    if (analysis.systemHealth.memoryUsage > this.thresholds.memoryUsage) {
      recommendations.push({
        type: 'system',
        priority: 'medium',
        title: 'Memory Usage Optimization',
        description: `Memory usage at ${(analysis.systemHealth.memoryUsage * 100).toFixed(1)}%`,
        suggestions: [
          'Implement better caching strategies',
          'Clear unused data structures',
          'Optimize data retention policies'
        ]
      });
    }

    // Cache efficiency recommendations
    if (analysis?.systemHealth?.cacheEfficiency && typeof analysis.systemHealth.cacheEfficiency === 'object') {
      Object.entries(analysis.systemHealth.cacheEfficiency).forEach(([cacheType, efficiency]) => {
        if (efficiency < this.thresholds.cacheHitRate) {
          recommendations.push({
            type: 'caching',
            priority: 'medium',
            title: `Improve ${cacheType} Cache`,
            description: `Cache hit rate for ${cacheType} is ${(efficiency * 100).toFixed(1)}%`,
          suggestions: [
            'Review cache invalidation strategy',
            'Increase cache size if memory allows',
            'Optimize cache key generation'
          ]
        });
      }
      });
    }

    return recommendations;
  }

  /**
   * Check performance thresholds and generate alerts
   */
  checkThresholds() {
    const analysis = this.analyzePerformance();

    // Check matching performance
    if (analysis.matching.avgResponseTime > this.thresholds.matchingResponseTime) {
      this.addAlert('performance', 
        `Slow AI matching: ${analysis.matching.avgResponseTime}ms`, 
        'warning'
      );
    }

    if (analysis.matching.successRate < 0.95) {
      this.addAlert('reliability', 
        `Low success rate: ${(analysis.matching.successRate * 100).toFixed(1)}%`, 
        'error'
      );
    }

    // Check user behavior
    if (analysis.userBehavior.acceptanceRate < this.thresholds.acceptanceRate) {
      this.addAlert('user_experience', 
        `Low acceptance rate: ${(analysis.userBehavior.acceptanceRate * 100).toFixed(1)}%`, 
        'warning'
      );
    }

    // Check system health
    if (analysis.systemHealth.memoryUsage > this.thresholds.memoryUsage) {
      this.addAlert('system', 
        `High memory usage: ${(analysis.systemHealth.memoryUsage * 100).toFixed(1)}%`, 
        'warning'
      );
    }

    if (analysis.systemHealth.errorRate > this.thresholds.errorRate) {
      this.addAlert('reliability', 
        `High error rate: ${(analysis.systemHealth.errorRate * 100).toFixed(1)}%`, 
        'error'
      );
    }
  }

  /**
   * Add performance alert
   */
  addAlert(category, message, severity = 'info') {
    const alert = {
      id: Date.now().toString(),
      category,
      message,
      severity,
      timestamp: Date.now(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.splice(0, this.alerts.length - 100);
    }

    // Log critical alerts
    if (severity === 'error') {
      console.error(`Performance Alert: ${message}`);
    } else if (severity === 'warning') {
      console.warn(`Performance Warning: ${message}`);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      period: '24h',
      summary: this.analyzePerformance(),
      alerts: this.alerts.filter(a => !a.acknowledged),
      trends: this.calculateTrends(),
      recommendations: []
    };

    // Add recommendations based on current analysis
    report.recommendations = this.generateOptimizationRecommendations(report.summary);

    console.log('Performance Report Generated:', report);
    return report;
  }

  /**
   * Calculate performance trends
   */
  calculateTrends() {
    const analysisHistory = this.metrics.get('performance_analysis') || [];
    const recentAnalysis = analysisHistory.filter(a => 
      Date.now() - a.timestamp < 86400000 // Last 24 hours
    );

    if (recentAnalysis.length < 2) {
      return { trends: 'insufficient_data' };
    }

    const latest = recentAnalysis[recentAnalysis.length - 1];
    const previous = recentAnalysis[recentAnalysis.length - 2];

    return {
      responseTime: this.calculateTrend(
        previous.matching.avgResponseTime, 
        latest.matching.avgResponseTime
      ),
      acceptanceRate: this.calculateTrend(
        previous.userBehavior.acceptanceRate,
        latest.userBehavior.acceptanceRate
      ),
      throughput: this.calculateTrend(
        previous.matching.throughput,
        latest.matching.throughput
      ),
      memoryUsage: this.calculateTrend(
        previous.systemHealth.memoryUsage,
        latest.systemHealth.memoryUsage
      )
    };
  }

  /**
   * Calculate trend direction and magnitude
   */
  calculateTrend(previous, current) {
    if (previous === 0) return { direction: 'stable', change: 0 };
    
    const change = ((current - previous) / previous) * 100;
    let direction = 'stable';
    
    if (Math.abs(change) > 5) {
      direction = change > 0 ? 'increasing' : 'decreasing';
    }

    return { direction, change: change.toFixed(2) };
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics() {
    return {
      analysis: this.analyzePerformance(),
      alerts: this.alerts.filter(a => !a.acknowledged),
      uptime: Date.now() - this.startTime,
      lastUpdate: Date.now()
    };
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Clear old metrics
   */
  cleanup() {
    const cutoff = Date.now() - 604800000; // 7 days

    for (const [key, metrics] of this.metrics.entries()) {
      if (Array.isArray(metrics)) {
        const filtered = metrics.filter(m => m.timestamp > cutoff);
        this.metrics.set(key, filtered);
      }
    }

    // Clear old alerts
    this.alerts = this.alerts.filter(a => 
      Date.now() - a.timestamp < 604800000 // 7 days
    );
  }

  /**
   * Export performance data for analysis
   */
  exportMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      alerts: this.alerts,
      thresholds: this.thresholds,
      exportTime: Date.now()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;