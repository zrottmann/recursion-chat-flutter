import { getEnabledProviders } from '../config/appwriteConfig';

const SSODebug = () => {
  const enabledProviders = getEnabledProviders();
  
  console.log('🐛 SSO Debug Info:', {
    enabledProviders,
    env: {
      REACT_APP_ENABLE_SSO: import.meta.env.VITE_ENABLE_SSO,
      REACT_APP_ENABLE_OAUTH: import.meta.env.VITE_ENABLE_OAUTH,
      REACT_APP_OAUTH_PROVIDERS: import.meta.env.VITE_OAUTH_PROVIDERS,
      NODE_ENV: process.env.NODE_ENV
    }
  });

  return (
    <div className="p-4 border rounded bg-light mb-3">
      <h5>🐛 SSO Debug Panel</h5>
      <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      <p><strong>SSO Enabled:</strong> {import.meta.env.VITE_ENABLE_SSO}</p>
      <p><strong>OAuth Enabled:</strong> {import.meta.env.VITE_ENABLE_OAUTH}</p>
      <p><strong>OAuth Providers:</strong> {import.meta.env.VITE_OAUTH_PROVIDERS}</p>
      <p><strong>Enabled Providers Count:</strong> {enabledProviders.length}</p>
      
      <div className="mt-3">
        <h6>Available SSO Buttons:</h6>
        {enabledProviders.map(provider => (
          <div key={provider.id} className="p-2 border rounded mb-2" style={{ backgroundColor: provider.color + '20' }}>
            <strong>{provider.name}</strong> - {provider.id}
          </div>
        ))}
      </div>
      
      {enabledProviders.length === 0 && (
        <div className="alert alert-warning">
          <strong>⚠️ No OAuth providers enabled!</strong>
          <br />Check environment variables and configuration.
        </div>
      )}
    </div>
  );
};

export default SSODebug;