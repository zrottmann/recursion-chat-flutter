// Debug environment variables
console.log('🔍 Environment Variables Debug:');
console.log('VITE_APPWRITE_PROJECT_ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log('VITE_APPWRITE_ENDPOINT:', import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log('VITE_OAUTH_CALLBACK_URL:', import.meta.env.VITE_OAUTH_CALLBACK_URL);
console.log('REACT_APP_APPWRITE_PROJECT_ID:', process.env.REACT_APP_APPWRITE_PROJECT_ID);
console.log('NODE_ENV:', import.meta.env.NODE_ENV);
console.log('MODE:', import.meta.env.MODE);

// Also log what's available in import.meta.env
console.log('All VITE env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));