'use client';

import { useState } from 'react';

interface CodeArtifact {
  path: string;
  content: string;
  language: string;
  description: string;
}

interface ResultsViewerProps {
  analysis: any;
  artifacts: CodeArtifact[];
  deploymentInfo: any;
}

export default function ResultsViewer({ analysis, artifacts, deploymentInfo }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'code' | 'deployment'>('analysis');
  const [selectedFile, setSelectedFile] = useState<number>(0);

  const getLanguageClass = (language: string) => {
    const classes: Record<string, string> = {
      typescript: 'language-typescript',
      javascript: 'language-javascript',
      sql: 'language-sql',
      json: 'language-json',
      yaml: 'language-yaml',
      html: 'language-html',
      css: 'language-css'
    };
    return classes[language] || 'language-plaintext';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generated Code ({artifacts.length})
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`py-2 px-6 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'deployment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deployment
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Analysis Tab */}
        {activeTab === 'analysis' && analysis && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Project Analysis</h3>
              <p className="text-gray-600">{analysis.analysis}</p>
            </div>

            {analysis.architecture && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Architecture Overview</h4>
                <div className="space-y-2">
                  {Object.entries(analysis.architecture).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium text-gray-700 capitalize w-32">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className="text-gray-600">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.tasks && analysis.tasks.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  Development Tasks ({analysis.tasks.length})
                </h4>
                <div className="space-y-3">
                  {analysis.tasks.map((task: any) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-800">{task.title}</h5>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Type: {task.type}</span>
                        <span>Est: {task.estimatedHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <div className="flex h-[600px]">
            {/* File List */}
            <div className="w-64 border-r border-gray-200 pr-4 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Files</h4>
              <div className="space-y-1">
                {artifacts.map((artifact, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFile(index)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedFile === index
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium truncate">{artifact.path}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {artifact.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 pl-4 overflow-hidden">
              {artifacts[selectedFile] && (
                <div className="h-full flex flex-col">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                      {artifacts[selectedFile].path}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {artifacts[selectedFile].description}
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-900 rounded-lg p-4">
                    <pre className="text-sm text-gray-300">
                      <code className={getLanguageClass(artifacts[selectedFile].language)}>
                        {artifacts[selectedFile].content}
                      </code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deployment Tab */}
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            {deploymentInfo ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Deployment Status</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-green-800">
                        Successfully Deployed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">GitHub Repository</h4>
                    <a
                      href={deploymentInfo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {deploymentInfo.githubUrl}
                    </a>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Live URL</h4>
                    <a
                      href={deploymentInfo.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {deploymentInfo.liveUrl}
                    </a>
                  </div>
                </div>

                {deploymentInfo.functions && deploymentInfo.functions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Deployed Functions</h4>
                    <div className="space-y-2">
                      {deploymentInfo.functions.map((func: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded p-3">
                          <div className="font-medium text-sm">{func.name}</div>
                          <div className="text-xs text-gray-500">ID: {func.id}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>No deployment information yet.</p>
                <p className="text-sm mt-2">Deployment will begin after code generation is complete.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}