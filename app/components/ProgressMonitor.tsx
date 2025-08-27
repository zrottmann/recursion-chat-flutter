'use client';

import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  specialization: string;
  status: string;
  taskTitle?: string;
  taskDescription?: string;
  endpoint?: string;
  lastHeartbeat?: Date;
  capabilities?: string[];
  isRemote?: boolean;
  performance?: {
    successRate: number;
    avgExecutionTime: number;
    totalTasks: number;
  };
}

interface RemoteAgentStatus {
  totalAgents: number;
  connectedAgents: number;
  busyAgents: number;
  errorAgents: number;
  queuedTasks: number;
}

interface ProgressMonitorProps {
  taskId: string | null;
  agents: Agent[];
}

export default function ProgressMonitor({ taskId, agents }: ProgressMonitorProps) {
  const [taskStatus, setTaskStatus] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<RemoteAgentStatus>({
    totalAgents: 0,
    connectedAgents: 0,
    busyAgents: 0,
    errorAgents: 0,
    queuedTasks: 0
  });
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = () => {
          console.log('Connected to Claude Code WebSocket server');
          setWsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('Disconnected from WebSocket server');
          setWsConnected(false);
          
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setTimeout(connectWebSocket, 5000);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'agentStatusUpdate':
        // Update remote agent status
        setRemoteStatus(prev => ({
          ...prev,
          ...message.status
        }));
        break;
        
      case 'taskProgress':
        // Update task progress
        if (message.taskId === taskId) {
          setActivities(prev => [
            {
              id: `progress_${Date.now()}`,
              type: 'progress',
              taskId: message.taskId,
              agentId: message.agentId,
              progress: message.progress,
              timestamp: message.timestamp,
              action: `Task progress: ${message.progress}%`
            },
            ...prev
          ]);
        }
        break;
        
      case 'taskComplete':
        if (message.taskId === taskId) {
          setActivities(prev => [
            {
              id: `complete_${Date.now()}`,
              type: 'completion',
              taskId: message.taskId,
              agentId: message.agentId,
              timestamp: message.timestamp,
              action: 'Task completed',
              success: message.response?.success
            },
            ...prev
          ]);
        }
        break;
    }
  };

  useEffect(() => {
    if (!taskId) return;

    const fetchTaskStatus = async () => {
      try {
        // Mock task status for static deployment
        const data = {
          success: true,
          task: {
            id: taskId,
            status: Math.random() > 0.7 ? 'completed' : 'in_progress',
            progress: Math.min(100, Math.floor(Math.random() * 100) + 20)
          },
          activities: [
            { id: 1, message: 'Analyzing project requirements...', timestamp: new Date().toISOString(), type: 'info' },
            { id: 2, message: 'Setting up development environment...', timestamp: new Date().toISOString(), type: 'progress' }
          ]
        };
        
        if (data.success) {
          setTaskStatus(data.task);
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Error fetching task status:', error);
      }
    };

    // Fetch remote agent status
    const fetchRemoteStatus = async () => {
      try {
        const response = await fetch('/api/remote-agents/status');
        const data = await response.json();
        
        if (data.success) {
          setRemoteStatus(data.status);
        }
      } catch (error) {
        console.error('Error fetching remote status:', error);
      }
    };

    // Initial fetch
    fetchTaskStatus();
    fetchRemoteStatus();

    // Poll for updates every 3 seconds (fallback if WebSocket fails)
    const interval = setInterval(() => {
      fetchTaskStatus();
      if (!wsConnected) {
        fetchRemoteStatus();
      }
    }, 3000);
    
    setIsPolling(true);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [taskId, wsConnected]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'working':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
      case 'working':
        return '🔄';
      case 'error':
        return '❌';
      case 'blocked':
        return '⚠️';
      case 'idle':
        return '⏳';
      default:
        return '⏸️';
    }
  };

  if (!taskId) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
        <p>No active task. Submit a project to start development.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Status Card */}
      {taskStatus && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {taskStatus.projectName}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(taskStatus.status)}`}>
              {getStatusIcon(taskStatus.status)} {taskStatus.status}
            </span>
          </div>
          
          {taskStatus.projectDescription && (
            <p className="text-gray-600 mb-4">{taskStatus.projectDescription}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 font-medium">{taskStatus.projectType}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 font-medium">
                {new Date(taskStatus.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {isPolling && (
            <div className="mt-4 text-xs text-gray-500 flex items-center">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Live updating...
            </div>
          )}
        </div>
      )}

      {/* Remote Agent Connection Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Remote Agent Network</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{remoteStatus.totalAgents}</div>
            <div className="text-xs text-gray-500">Total Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{remoteStatus.connectedAgents}</div>
            <div className="text-xs text-gray-500">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{remoteStatus.busyAgents}</div>
            <div className="text-xs text-gray-500">Working</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{remoteStatus.errorAgents}</div>
            <div className="text-xs text-gray-500">Error</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{remoteStatus.queuedTasks}</div>
            <div className="text-xs text-gray-500">Queued Tasks</div>
          </div>
        </div>

        {/* Connection Health Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Network Health</span>
            <span>
              {remoteStatus.totalAgents > 0 
                ? Math.round((remoteStatus.connectedAgents / remoteStatus.totalAgents) * 100)
                : 0
              }%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                remoteStatus.totalAgents === 0 ? 'bg-gray-400' :
                (remoteStatus.connectedAgents / remoteStatus.totalAgents) > 0.8 ? 'bg-green-500' :
                (remoteStatus.connectedAgents / remoteStatus.totalAgents) > 0.5 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{
                width: `${remoteStatus.totalAgents > 0 
                  ? (remoteStatus.connectedAgents / remoteStatus.totalAgents) * 100 
                  : 0}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          AI Agent Details
          {agents.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({agents.filter(a => a.status === 'working').length} active)
            </span>
          )}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`border rounded-lg p-4 relative ${
                agent.status === 'working' ? 'border-blue-400 bg-blue-50' : 
                agent.status === 'error' ? 'border-red-400 bg-red-50' :
                'border-gray-200'
              }`}
            >
              {/* Remote indicator */}
              {agent.isRemote && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" 
                     title="Remote agent"></div>
              )}
              
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm truncate pr-2">
                  {agent.id}
                  {agent.isRemote && (
                    <span className="ml-1 text-xs text-green-600">●</span>
                  )}
                </span>
                <span className={`text-2xl`}>{getStatusIcon(agent.status)}</span>
              </div>
              
              <div className="text-xs text-gray-500 mb-1">
                {agent.specialization}
                {agent.endpoint && (
                  <div className="text-xs text-gray-400 mt-1">
                    {agent.endpoint}
                  </div>
                )}
              </div>

              {/* Capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((cap, index) => (
                      <span
                        key={index}
                        className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{agent.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Performance metrics for remote agents */}
              {agent.performance && agent.isRemote && (
                <div className="mb-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Success Rate:</span>
                    <span className={`font-medium ${
                      agent.performance.successRate > 0.9 ? 'text-green-600' :
                      agent.performance.successRate > 0.7 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(agent.performance.successRate * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Time:</span>
                    <span className="font-medium">
                      {Math.round(agent.performance.avgExecutionTime / 1000)}s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Tasks:</span>
                    <span className="font-medium">{agent.performance.totalTasks}</span>
                  </div>
                </div>
              )}

              {/* Last heartbeat for remote agents */}
              {agent.lastHeartbeat && agent.isRemote && (
                <div className="mb-2 text-xs text-gray-500">
                  Last seen: {new Date(agent.lastHeartbeat).toLocaleTimeString()}
                </div>
              )}
              
              {agent.taskTitle && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    {agent.taskTitle}
                  </p>
                  {agent.taskDescription && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {agent.taskDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Timeline</h3>
          
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity, index) => (
              <div key={activity.$id || index} className="flex items-start space-x-3">
                <div className={`mt-1 w-2 h-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'assigned' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">
                      {activity.taskTitle || activity.action}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.assignedAt || activity.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1">
                    Agent: {activity.agentId} ({activity.specialization})
                  </p>
                  
                  {activity.estimatedHours && (
                    <p className="text-xs text-gray-500 mt-1">
                      Est. {activity.estimatedHours} hours
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}