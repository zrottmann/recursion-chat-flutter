// Ultra-Diagnostic Logging System
// Systematic diagnosis of CLI integration failures

export class DiagnosticLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
    this.checkpoints = new Map();
  }

  // High-precision checkpoint logging
  checkpoint(name, metadata = {}) {
    const timestamp = Date.now();
    const elapsed = timestamp - this.startTime;
    
    const logEntry = {
      type: 'CHECKPOINT',
      name,
      timestamp,
      elapsed,
      metadata,
      memory: this.getMemoryUsage(),
      stack: this.getCallStack()
    };
    
    this.logs.push(logEntry);
    this.checkpoints.set(name, logEntry);
    
    console.log(`🔍 [${elapsed}ms] CHECKPOINT: ${name}`, metadata);
    return logEntry;
  }

  // Error tracking with full context
  error(error, context = {}) {
    const timestamp = Date.now();
    const elapsed = timestamp - this.startTime;
    
    const logEntry = {
      type: 'ERROR',
      error: error.message,
      stack: error.stack,
      timestamp,
      elapsed,
      context,
      memory: this.getMemoryUsage(),
      lastCheckpoint: Array.from(this.checkpoints.keys()).pop()
    };
    
    this.logs.push(logEntry);
    console.error(`❌ [${elapsed}ms] ERROR: ${error.message}`, context);
    return logEntry;
  }

  // CLI component timing
  async timeCliCall(cliName, operation, fn) {
    const startTime = Date.now();
    this.checkpoint(`CLI_START_${cliName.toUpperCase()}`, { operation });
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.checkpoint(`CLI_COMPLETE_${cliName.toUpperCase()}`, { 
        operation, 
        duration,
        success: true,
        resultType: typeof result
      });
      
      return { success: true, data: result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(error, { 
        cliName, 
        operation, 
        duration,
        phase: 'CLI_EXECUTION'
      });
      
      return { success: false, error: error.message, duration };
    }
  }

  // Memory usage tracking
  getMemoryUsage() {
    try {
      const usage = process.memoryUsage();
      return {
        heap: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100
      };
    } catch {
      return { heap: 0, total: 0, external: 0 };
    }
  }

  // Call stack capture
  getCallStack() {
    try {
      const stack = new Error().stack;
      return stack?.split('\n').slice(2, 5).map(line => line.trim()) || [];
    } catch {
      return [];
    }
  }

  // Performance bottleneck analysis
  analyzeBottlenecks() {
    const analysis = {
      totalDuration: Date.now() - this.startTime,
      checkpoints: [],
      slowestOperations: [],
      errorPattern: [],
      memoryPattern: []
    };

    // Checkpoint timing analysis
    const checkpointArray = Array.from(this.checkpoints.values());
    for (let i = 1; i < checkpointArray.length; i++) {
      const prev = checkpointArray[i - 1];
      const curr = checkpointArray[i];
      const duration = curr.elapsed - prev.elapsed;
      
      analysis.checkpoints.push({
        from: prev.name,
        to: curr.name,
        duration,
        memoryDelta: curr.memory.heap - prev.memory.heap
      });
    }

    // Sort by duration to find bottlenecks
    analysis.slowestOperations = analysis.checkpoints
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    // Error pattern analysis
    const errors = this.logs.filter(log => log.type === 'ERROR');
    analysis.errorPattern = errors.map(error => ({
      message: error.error,
      elapsed: error.elapsed,
      context: error.context,
      lastCheckpoint: error.lastCheckpoint
    }));

    // Memory usage pattern
    analysis.memoryPattern = this.logs
      .filter(log => log.memory)
      .map(log => ({
        name: log.name,
        elapsed: log.elapsed,
        heap: log.memory.heap
      }));

    return analysis;
  }

  // Generate diagnostic report
  generateReport() {
    const analysis = this.analyzeBottlenecks();
    
    console.log('\n🔬 ULTRATHINK DIAGNOSTIC REPORT');
    console.log('=====================================');
    console.log(`Total Duration: ${analysis.totalDuration}ms`);
    
    if (analysis.slowestOperations.length > 0) {
      console.log('\n⚠️ PERFORMANCE BOTTLENECKS:');
      analysis.slowestOperations.forEach(op => {
        console.log(`   ${op.from} → ${op.to}: ${op.duration}ms`);
      });
    }
    
    if (analysis.errorPattern.length > 0) {
      console.log('\n❌ ERROR PATTERN:');
      analysis.errorPattern.forEach(error => {
        console.log(`   [${error.elapsed}ms] ${error.message}`);
        console.log(`   Last successful: ${error.lastCheckpoint}`);
      });
    }
    
    console.log('\n📊 MEMORY USAGE:');
    const memoryTrend = analysis.memoryPattern.slice(-3);
    memoryTrend.forEach(mem => {
      console.log(`   ${mem.name}: ${mem.heap}MB`);
    });
    
    return analysis;
  }

  // Export logs for further analysis
  exportLogs() {
    return {
      startTime: this.startTime,
      totalDuration: Date.now() - this.startTime,
      logs: this.logs,
      analysis: this.analyzeBottlenecks()
    };
  }
}

// Global diagnostic instance
export const diagnosticLogger = new DiagnosticLogger();