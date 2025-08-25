import React, { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';

const OAuthRedirectInfo = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleTestSession = async () => {
    // Test if OAuth worked by checking session in console
    const testCode = `
// Check if OAuth created a session
const { Client, Account } = Appwrite;
const client = new Client();
client.setEndpoint('https://nyc.cloud.appwrite.io/v1')
      .setProject('689bdee000098bd9d55c');
const account = new Account(client);
account.get().then(user => {
  console.log('✅ Logged in as:', user.email);
  alert('Success! You are logged in as: ' + user.email);
}).catch(err => {
  console.log('❌ Not logged in yet');
  alert('Not logged in yet. Please try OAuth again.');
});`;
    
    console.log('Copy this code to console to test session:');
    console.log(testCode);
    alert('Check browser console for session test code');
  };

  return (
    <div className="mt-3">
      <Alert variant="warning">
        <Alert.Heading>⚠️ OAuth Platform Issue</Alert.Heading>
        <p className="mb-2">
          <strong>Platform registration has reverted to localhost-only.</strong> This causes CORS errors.
        </p>
        <p>
          OAuth still works, but requires a workaround:
        </p>
        
        <Button 
          variant="link" 
          onClick={() => setShowInstructions(!showInstructions)}
          className="p-0"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </Button>
        
        {showInstructions && (
          <div className="mt-3">
            <h6>OAuth Workaround Steps:</h6>
            <ol>
              <li>Click "Continue with Google"</li>
              <li>Complete Google authentication</li>
              <li>You'll see a blank "Powered by Appwrite" page</li>
              <li><strong>Open a NEW tab</strong> and go to: <code>https://tradingpost.appwrite.network</code></li>
              <li>You should now be logged in!</li>
            </ol>
            
            <hr />
            
            <h6>Alternative: Use Localhost</h6>
            <p>OAuth works perfectly on localhost. To use it:</p>
            <ol>
              <li>Clone the repo locally</li>
              <li>Run <code>npm install && npm start</code></li>
              <li>Access at <code>http://localhost:5173</code></li>
              <li>OAuth will work without issues</li>
            </ol>
            
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={handleTestSession}
              className="mt-2"
            >
              Test If Session Exists
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};

export default OAuthRedirectInfo;