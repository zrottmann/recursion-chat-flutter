'use client';

import { useState } from 'react';

interface TaskInputProps {
  onSubmit: (task: any) => void;
  isLoading: boolean;
}

export default function TaskInput({ onSubmit, isLoading }: TaskInputProps) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectType, setProjectType] = useState('web');
  const [requirements, setRequirements] = useState('');
  const [constraints, setConstraints] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const task = {
      project: {
        name: projectName,
        description: projectDescription,
        type: projectType,
        requirements: requirements.split('\n').filter(r => r.trim()),
        constraints: constraints.split('\n').filter(c => c.trim())
      }
    };

    onSubmit(task);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New AI Project</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name *
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoading}
            placeholder="e.g., E-commerce Platform"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Description
          </label>
          <textarea
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
            placeholder="Describe what the project should do..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Type
          </label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="web">Web Application</option>
            <option value="mobile">Mobile App</option>
            <option value="api">API Service</option>
            <option value="desktop">Desktop Application</option>
            <option value="cli">CLI Tool</option>
            <option value="library">Library/Package</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requirements (one per line)
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            disabled={isLoading}
            placeholder="User authentication&#10;Product catalog&#10;Shopping cart&#10;Payment processing"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Constraints (optional, one per line)
          </label>
          <textarea
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isLoading}
            placeholder="Must use Next.js&#10;Budget: $5000&#10;Timeline: 2 weeks"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !projectName}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Start AI Development'
          )}
        </button>
      </form>
    </div>
  );
}