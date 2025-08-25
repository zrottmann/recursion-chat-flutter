import { Button, Alert } from 'react-bootstrap';

const LocalhostOAuthButton = () => {
  const handleLocalhostOAuth = () => {
    // Provide instructions for using localhost where OAuth works
    const instructions = `
OAuth Works Perfectly on Localhost!

Since the production platform registration is broken, here's how to use OAuth:

1. Clone the repository locally:
   git clone https://github.com/zrottmann/tradingpost.git

2. Install and run:
   cd tradingpost/trading-app-frontend
   npm install
   npm run dev

3. Open http://localhost:5173 in your browser

4. OAuth will work without any issues!

The platform registration for localhost is working correctly,
so all OAuth providers will function normally.
    `;
    
    alert(instructions);
    console.log(instructions);
  };

  return (
    <Alert variant="info" className="mt-3">
      <Alert.Heading>🚀 OAuth Alternative</Alert.Heading>
      <p>
        OAuth is fully functional on <strong>localhost</strong>. 
        The platform registration issue only affects the production domain.
      </p>
      <Button 
        variant="outline-primary" 
        onClick={handleLocalhostOAuth}
        className="mt-2"
      >
        Get Localhost Instructions
      </Button>
      <hr />
      <p className="mb-0 small">
        <strong>Quick Start:</strong> Run <code>npm run dev</code> locally and access at <code>http://localhost:5173</code>
      </p>
    </Alert>
  );
};

export default LocalhostOAuthButton;