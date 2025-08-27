'use client';

import { useState } from 'react';
import TaskInput from './components/TaskInput';
import ProgressMonitor from './components/ProgressMonitor';
import ResultsViewer from './components/ResultsViewer';
import { claudeAgentPool } from './services/claude-agents';

export default function Home() {
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [deploymentInfo, setDeploymentInfo] = useState<any>(null);
  const [agents, setAgents] = useState(claudeAgentPool.getRemoteAgentStatus());
  const [error, setError] = useState<string | null>(null);

  const handleTaskSubmit = async (task: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock orchestrator response for static deployment
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const data = {
        taskId: `task_${Date.now()}`,
        analysis: {
          complexity: 'moderate',
          estimatedTime: '15-30 minutes',
          tasks: [
            {
              id: 'task_1',
              title: 'Setup project structure',
              description: `Initialize ${task.project.name} with proper directory structure`,
              type: 'setup',
              priority: 'high'
            },
            {
              id: 'task_2', 
              title: 'Implement core functionality',
              description: `Build main features for ${task.project.type} application`,
              type: 'implementation',
              priority: 'high'
            }
          ]
        }
      };

      // Set the current task ID for monitoring
      setCurrentTaskId(data.taskId);
      
      // Store the analysis results
      setAnalysis(data.analysis);
      
      // Update agent status (now includes remote agents)
      setAgents(claudeAgentPool.getRemoteAgentStatus());

      // Simulate code generation (in production, this would be real Claude API calls)
      if (data.analysis && data.analysis.tasks) {
        const generatedArtifacts: any[] = [];
        
        for (const task of data.analysis.tasks) {
          try {
            const taskArtifacts = await claudeAgentPool.executeWithClaude(task);
            generatedArtifacts.push(...taskArtifacts);
            
            // Update agent status after each task (includes remote agents)
            setAgents(claudeAgentPool.getRemoteAgentStatus());
          } catch (error) {
            console.error('Error executing task:', error);
          }
        }
        
        setArtifacts(generatedArtifacts);
      }

      // Simulate deployment (in production, this would be real GitHub/Appwrite API calls)
      setTimeout(() => {
        setDeploymentInfo({
          githubUrl: `https://github.com/zrottmann/${task.project.name.toLowerCase().replace(/\s+/g, '-')}`,
          liveUrl: `https://${task.project.name.toLowerCase().replace(/\s+/g, '-')}.appwrite.network`,
          functions: [
            { name: 'api-handler', id: 'func-123' },
            { name: 'auth-service', id: 'func-456' }
          ]
        });
      }, 5000);

    } catch (error: any) {
      console.error('Error submitting task:', error);
      setError(error.message || 'An error occurred while processing your request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Development Orchestrator</h1>
                <p className="text-sm text-gray-500">Powered by Grok & Claude Code</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Active Agents: 
                <span className="ml-2 font-semibold text-blue-600">
                  {agents.filter(a => a.status === 'working').length}/{agents.length}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-500"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div className="space-y-6">
            <TaskInput onSubmit={handleTaskSubmit} isLoading={isLoading} />
            
            {/* Quick Examples */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Examples</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const exampleTask = {
                      project: {
                        name: 'Task Manager App',
                        description: 'A simple task management application',
                        type: 'web',
                        requirements: ['User authentication', 'Create/edit/delete tasks', 'Task categories', 'Due dates'],
                        constraints: ['Use Next.js', 'Deploy to Appwrite']
                      }
                    };
                    handleTaskSubmit(exampleTask);
                  }}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm">Task Manager App</div>
                  <div className="text-xs text-gray-500">Web app with auth and CRUD operations</div>
                </button>
                
                <button
                  onClick={() => {
                    const exampleTask = {
                      project: {
                        name: 'Weather API Service',
                        description: 'RESTful API for weather data',
                        type: 'api',
                        requirements: ['Weather data endpoints', 'Caching', 'Rate limiting', 'API documentation'],
                        constraints: ['Express.js backend', 'OpenWeather API integration']
                      }
                    };
                    handleTaskSubmit(exampleTask);
                  }}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="font-medium text-sm">Weather API Service</div>
                  <div className="text-xs text-gray-500">RESTful API with caching and rate limiting</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Progress & Results */}
          <div className="space-y-6">
            <ProgressMonitor taskId={currentTaskId} agents={agents} />
          </div>
        </div>

        {/* Results Section */}
        {(analysis || artifacts.length > 0 || deploymentInfo) && (
          <div className="mt-8">
            <ResultsViewer 
              analysis={analysis}
              artifacts={artifacts}
              deploymentInfo={deploymentInfo}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2025 AI Development Orchestrator
            </div>
            <div className="flex items-center space-x-4">
              <span>Grok API: Connected</span>
              <span>•</span>
              <span>Appwrite: Connected</span>
              <span>•</span>
              <span>GitHub: Connected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}