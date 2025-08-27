const sdk = require('node-appwrite');

// Initialize Appwrite SDK
const client = new sdk.Client();
const account = new sdk.Account(client);
const databases = new sdk.Databases(client);
const users = new sdk.Users(client);

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// SSO providers configuration
const PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    scope: ['email', 'profile']
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    scope: ['user:email', 'read:user']
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    scope: ['email', 'profile']
  }
};

module.exports = async function (req, res) {
  const { action, provider, code, token, refreshToken, userId } = req.payload || {};

  try {
    switch (action) {
      case 'initiate':
        return handleInitiateSSO(provider, res);
      
      case 'callback':
        return handleSSOCallback(provider, code, res);
      
      case 'refresh':
        return handleTokenRefresh(refreshToken, userId, res);
      
      case 'verify':
        return handleSessionVerification(token, res);
      
      case 'logout':
        return handleLogout(userId, res);
      
      default:
        return res.json({
          success: false,
          error: 'Invalid action specified'
        }, 400);
    }
  } catch (error) {
    console.error('SSO Function Error:', error);
    return res.json({
      success: false,
      error: error.message
    }, 500);
  }
};

async function handleInitiateSSO(provider, res) {
  if (!PROVIDERS[provider]) {
    return res.json({
      success: false,
      error: 'Unsupported provider'
    }, 400);
  }

  try {
    // Generate OAuth URL for the provider
    const successUrl = `${process.env.APP_URL}/auth/success`;
    const failureUrl = `${process.env.APP_URL}/auth/error`;
    
    const oauthUrl = await account.createOAuth2Session(
      provider,
      successUrl,
      failureUrl,
      PROVIDERS[provider].scope
    );

    return res.json({
      success: true,
      authUrl: oauthUrl,
      provider: provider
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to initiate OAuth: ${error.message}`
    }, 500);
  }
}

async function handleSSOCallback(provider, code, res) {
  try {
    // Exchange code for tokens
    const session = await account.updateOAuth2Session(provider, code);
    
    // Get user information
    const user = await account.get();
    
    // Store or update user in database
    const dbUser = await storeUserInDatabase(user, provider);
    
    // Generate JWT token
    const jwt = await generateJWT(user, session);
    
    return res.json({
      success: true,
      user: {
        id: user.$id,
        email: user.email,
        name: user.name,
        provider: provider
      },
      token: jwt,
      sessionId: session.$id,
      expiresAt: session.expire
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `OAuth callback failed: ${error.message}`
    }, 500);
  }
}

async function handleTokenRefresh(refreshToken, userId, res) {
  try {
    // Verify refresh token
    const session = await account.getSession('current');
    
    if (session.userId !== userId) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate new access token
    const user = await users.get(userId);
    const newToken = await generateJWT(user, session);
    
    return res.json({
      success: true,
      token: newToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });
  } catch (error) {
    return res.json({
      success: false,
      error: 'Token refresh failed'
    }, 401);
  }
}

async function handleSessionVerification(token, res) {
  try {
    // Verify JWT token
    const decoded = await verifyJWT(token);
    
    // Check if session is still valid
    const session = await account.getSession(decoded.sessionId);
    
    return res.json({
      success: true,
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      },
      expiresAt: session.expire
    });
  } catch (error) {
    return res.json({
      success: false,
      valid: false,
      error: 'Invalid or expired token'
    }, 401);
  }
}

async function handleLogout(userId, res) {
  try {
    // Delete all sessions for the user
    await account.deleteSessions();
    
    // Update user status in database
    await databases.updateDocument(
      process.env.DB_ID,
      'users',
      userId,
      {
        lastLogout: new Date().toISOString(),
        isOnline: false
      }
    );
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.json({
      success: false,
      error: 'Logout failed'
    }, 500);
  }
}

async function storeUserInDatabase(user, provider) {
  const userData = {
    userId: user.$id,
    email: user.email,
    name: user.name,
    provider: provider,
    avatarUrl: user.prefs?.avatar || null,
    lastLogin: new Date().toISOString(),
    isOnline: true
  };
  
  try {
    // Try to update existing user
    return await databases.updateDocument(
      process.env.DB_ID,
      'users',
      user.$id,
      userData
    );
  } catch (error) {
    // Create new user if doesn't exist
    return await databases.createDocument(
      process.env.DB_ID,
      'users',
      user.$id,
      userData
    );
  }
}

async function generateJWT(user, session) {
  const crypto = require('crypto');
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId: user.$id,
    email: user.email,
    name: user.name,
    sessionId: session.$id,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyJWT(token) {
  const crypto = require('crypto');
  const [header, payload, signature] = token.split('.');
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature');
  }
  
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
  
  if (decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  
  return decoded;
}