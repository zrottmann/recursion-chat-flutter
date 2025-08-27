import 'package:equatable/equatable.dart';

enum AgentStatus {
  active,
  busy,
  idle,
  error,
}

enum AgentType {
  codeGenerator,
  testGenerator,
  documentationGenerator,
  codeEnhancer,
  analyzer,
  deployer,
}

class AgentModel extends Equatable {
  final String id;
  final String name;
  final AgentType type;
  final AgentStatus status;
  final String description;
  final String? currentTask;
  final double progress; // 0.0 to 1.0
  final double performance; // 0.0 to 1.0
  final DateTime lastActivity;
  final int tasksCompleted;
  final double successRate; // 0.0 to 1.0
  final List<String> capabilities;
  final Map<String, dynamic> configuration;

  const AgentModel({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    required this.description,
    this.currentTask,
    required this.progress,
    required this.performance,
    required this.lastActivity,
    required this.tasksCompleted,
    required this.successRate,
    this.capabilities = const [],
    this.configuration = const {},
  });

  @override
  List<Object?> get props => [
        id,
        name,
        type,
        status,
        description,
        currentTask,
        progress,
        performance,
        lastActivity,
        tasksCompleted,
        successRate,
        capabilities,
        configuration,
      ];

  AgentModel copyWith({
    String? id,
    String? name,
    AgentType? type,
    AgentStatus? status,
    String? description,
    String? currentTask,
    double? progress,
    double? performance,
    DateTime? lastActivity,
    int? tasksCompleted,
    double? successRate,
    List<String>? capabilities,
    Map<String, dynamic>? configuration,
  }) {
    return AgentModel(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      status: status ?? this.status,
      description: description ?? this.description,
      currentTask: currentTask ?? this.currentTask,
      progress: progress ?? this.progress,
      performance: performance ?? this.performance,
      lastActivity: lastActivity ?? this.lastActivity,
      tasksCompleted: tasksCompleted ?? this.tasksCompleted,
      successRate: successRate ?? this.successRate,
      capabilities: capabilities ?? this.capabilities,
      configuration: configuration ?? this.configuration,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type.name,
      'status': status.name,
      'description': description,
      'currentTask': currentTask,
      'progress': progress,
      'performance': performance,
      'lastActivity': lastActivity.toIso8601String(),
      'tasksCompleted': tasksCompleted,
      'successRate': successRate,
      'capabilities': capabilities,
      'configuration': configuration,
    };
  }

  factory AgentModel.fromJson(Map<String, dynamic> json) {
    return AgentModel(
      id: json['id'],
      name: json['name'],
      type: AgentType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => AgentType.codeGenerator,
      ),
      status: AgentStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => AgentStatus.idle,
      ),
      description: json['description'],
      currentTask: json['currentTask'],
      progress: (json['progress'] as num).toDouble(),
      performance: (json['performance'] as num).toDouble(),
      lastActivity: DateTime.parse(json['lastActivity']),
      tasksCompleted: json['tasksCompleted'],
      successRate: (json['successRate'] as num).toDouble(),
      capabilities: List<String>.from(json['capabilities'] ?? []),
      configuration: Map<String, dynamic>.from(json['configuration'] ?? {}),
    );
  }

  /// Check if the agent is currently working
  bool get isWorking => status == AgentStatus.active || status == AgentStatus.busy;

  /// Check if the agent has an error
  bool get hasError => status == AgentStatus.error;

  /// Get the agent's efficiency rating
  String get efficiencyRating {
    if (performance >= 0.95) return 'Excellent';
    if (performance >= 0.85) return 'Good';
    if (performance >= 0.75) return 'Average';
    if (performance >= 0.60) return 'Below Average';
    return 'Poor';
  }

  /// Get the agent's reliability rating
  String get reliabilityRating {
    if (successRate >= 0.95) return 'Highly Reliable';
    if (successRate >= 0.85) return 'Reliable';
    if (successRate >= 0.75) return 'Moderately Reliable';
    if (successRate >= 0.60) return 'Somewhat Reliable';
    return 'Unreliable';
  }

  /// Calculate the estimated time remaining for current task
  Duration? get estimatedTimeRemaining {
    if (currentTask == null || progress >= 1.0) return null;
    
    // Simple estimation based on progress and average completion time
    final averageTaskTime = Duration(minutes: 30); // Base estimation
    final remainingProgress = 1.0 - progress;
    final estimatedMinutes = (averageTaskTime.inMinutes * remainingProgress).round();
    
    return Duration(minutes: estimatedMinutes);
  }

  /// Get status display text
  String get statusDisplayText {
    switch (status) {
      case AgentStatus.active:
        return 'Active';
      case AgentStatus.busy:
        return 'Busy';
      case AgentStatus.idle:
        return 'Idle';
      case AgentStatus.error:
        return 'Error';
    }
  }
}

/// Task model for agent tasks
class AgentTask extends Equatable {
  final String id;
  final String title;
  final String description;
  final String agentId;
  final TaskStatus status;
  final TaskPriority priority;
  final DateTime createdAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final double progress;
  final Map<String, dynamic> parameters;
  final List<String> outputs;

  const AgentTask({
    required this.id,
    required this.title,
    required this.description,
    required this.agentId,
    required this.status,
    required this.priority,
    required this.createdAt,
    this.startedAt,
    this.completedAt,
    required this.progress,
    this.parameters = const {},
    this.outputs = const [],
  });

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        agentId,
        status,
        priority,
        createdAt,
        startedAt,
        completedAt,
        progress,
        parameters,
        outputs,
      ];

  AgentTask copyWith({
    String? id,
    String? title,
    String? description,
    String? agentId,
    TaskStatus? status,
    TaskPriority? priority,
    DateTime? createdAt,
    DateTime? startedAt,
    DateTime? completedAt,
    double? progress,
    Map<String, dynamic>? parameters,
    List<String>? outputs,
  }) {
    return AgentTask(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      agentId: agentId ?? this.agentId,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
      startedAt: startedAt ?? this.startedAt,
      completedAt: completedAt ?? this.completedAt,
      progress: progress ?? this.progress,
      parameters: parameters ?? this.parameters,
      outputs: outputs ?? this.outputs,
    );
  }

  /// Get the task duration
  Duration? get duration {
    if (startedAt == null) return null;
    final endTime = completedAt ?? DateTime.now();
    return endTime.difference(startedAt!);
  }

  /// Check if the task is completed
  bool get isCompleted => status == TaskStatus.completed;

  /// Check if the task is running
  bool get isRunning => status == TaskStatus.running;

  /// Check if the task has failed
  bool get hasFailed => status == TaskStatus.failed;
}

enum TaskStatus {
  queued,
  running,
  completed,
  failed,
  cancelled,
}

enum TaskPriority {
  low,
  medium,
  high,
  critical,
}

/// System metrics for the multi-agent platform
class SystemMetrics extends Equatable {
  final int totalAgents;
  final int activeAgents;
  final int busyAgents;
  final int idleAgents;
  final int errorAgents;
  final int totalTasks;
  final int runningTasks;
  final int queuedTasks;
  final int completedTasks;
  final int failedTasks;
  final double systemLoad; // 0.0 to 1.0
  final double memoryUsage; // 0.0 to 1.0
  final double cpuUsage; // 0.0 to 1.0
  final double networkLatency; // in milliseconds
  final DateTime lastUpdated;

  const SystemMetrics({
    required this.totalAgents,
    required this.activeAgents,
    required this.busyAgents,
    required this.idleAgents,
    required this.errorAgents,
    required this.totalTasks,
    required this.runningTasks,
    required this.queuedTasks,
    required this.completedTasks,
    required this.failedTasks,
    required this.systemLoad,
    required this.memoryUsage,
    required this.cpuUsage,
    required this.networkLatency,
    required this.lastUpdated,
  });

  @override
  List<Object?> get props => [
        totalAgents,
        activeAgents,
        busyAgents,
        idleAgents,
        errorAgents,
        totalTasks,
        runningTasks,
        queuedTasks,
        completedTasks,
        failedTasks,
        systemLoad,
        memoryUsage,
        cpuUsage,
        networkLatency,
        lastUpdated,
      ];

  /// Get the system health rating
  String get healthRating {
    final healthScore = (1.0 - systemLoad) * 0.4 + 
                       (1.0 - memoryUsage) * 0.3 + 
                       (1.0 - cpuUsage) * 0.3;
    
    if (healthScore >= 0.9) return 'Excellent';
    if (healthScore >= 0.8) return 'Good';
    if (healthScore >= 0.7) return 'Fair';
    if (healthScore >= 0.5) return 'Poor';
    return 'Critical';
  }

  /// Get overall success rate
  double get overallSuccessRate {
    final total = completedTasks + failedTasks;
    if (total == 0) return 1.0;
    return completedTasks / total;
  }
}