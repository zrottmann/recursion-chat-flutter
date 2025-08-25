import { useState, useEffect } from 'react';
import { Client, Account } from 'appwrite';

const AppwriteConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [error, setError] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔧 Testing Appwrite connection...');
        console.log('Environment variables:', {
          endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
          projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
          projectName: import.meta.env.VITE_APPWRITE_PROJECT_NAME
        });

        // Initialize Appwrite client
        const client = new Client();
        const account = new Account(client);

        client
          .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
          .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '689bdee000098bd9d55c');

        // Test connection by getting account info (will fail if not logged in, but connection works)
        try {
          const user = await account.get();
          setProjectInfo({ 
            connected: true, 
            user: user.name || user.email,
            userId: user.$id 
          });
          setConnectionStatus('connected');
        } catch (authError) {
          // This is expected if user isn't logged in
          if (authError.code === 401) {
            setProjectInfo({ 
              connected: true, 
              message: 'Connection successful (not authenticated)' 
            });
            setConnectionStatus('connected');
          } else {
            throw authError;
          }
        }
      } catch (err) {
        console.error('❌ Appwrite connection failed:', err);
        setError(err.message);
        setConnectionStatus('failed');
      }
    };

    testConnection();
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'testing': return 'warning';
      case 'connected': return 'success';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing': return '🔄';
      case 'connected': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className={`alert alert-${getStatusColor()} mb-3`}>
      <h6>{getStatusIcon()} Appwrite Connection Status</h6>
      
      <div><strong>Status:</strong> {connectionStatus}</div>
      <div><strong>Endpoint:</strong> {import.meta.env.VITE_APPWRITE_ENDPOINT}</div>
      <div><strong>Project ID:</strong> {import.meta.env.VITE_APPWRITE_PROJECT_ID}</div>
      <div><strong>Project Name:</strong> {import.meta.env.VITE_APPWRITE_PROJECT_NAME}</div>
      
      {projectInfo && (
        <div className="mt-2">
          <strong>Connection:</strong> {projectInfo.message || 'Active'}
          {projectInfo.user && <div><strong>User:</strong> {projectInfo.user}</div>}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-danger">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {connectionStatus === 'connected' && (
        <div className="mt-2 text-success">
          <small>✅ Appwrite is properly configured and accessible!</small>
        </div>
      )}
    </div>
  );
};

export default AppwriteConnectionTest;