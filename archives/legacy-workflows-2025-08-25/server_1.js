// Unified Recursion Server - Port 5174
// Serves both the chat app and design persistence on a single port
require('dotenv').config();
const debug = require('./lib/debug');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const emailService = require('./emailServiceCloudflare');
const { OAuth2Client } = require('google-auth-library');

// Initialize debug loggers
const serverDebug = debug('server');
const socketDebug = debug('socket');
const authDebug = debug('auth');
const dbDebug = debug('db');
const apiDebug = debug('api');
const roomDebug = debug('api:rooms');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5174;

// xAI Grok configuration
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = 'https://api.x.ai/v1';

// Database setup
const dbPath = path.join(__dirname, 'database', 'recursion.db');
const db = new sqlite3.Database(dbPath);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Enable CORS for all origins
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Simple rate limiting implementation
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window
const AUTH_RATE_LIMIT_MAX = 5; // Max auth requests per window

const simpleRateLimit = (maxRequests = RATE_LIMIT_MAX_REQUESTS) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const windowStart = now - RATE_LIMIT_WINDOW;
        
        // Clean up old entries
        for (const [key, data] of rateLimitStore.entries()) {
            if (data.lastRequest < windowStart) {
                rateLimitStore.delete(key);
            }
        }
        
        // Get or create rate limit data for this IP
        const key = `${clientIP}:${req.path}`;
        let rateLimitData = rateLimitStore.get(key) || { count: 0, firstRequest: now, lastRequest: now };
        
        // Reset if window has passed
        if (rateLimitData.firstRequest < windowStart) {
            rateLimitData = { count: 0, firstRequest: now, lastRequest: now };
        }
        
        // Increment request count
        rateLimitData.count++;
        rateLimitData.lastRequest = now;
        rateLimitStore.set(key, rateLimitData);
        
        // Check if limit exceeded
        if (rateLimitData.count > maxRequests) {
            console.log(`[SECURITY] ❌ Rate limit exceeded for ${clientIP} on ${req.path}`);
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                details: `Rate limit exceeded. Maximum ${maxRequests} requests per 15 minutes.`,
                retry_after: Math.ceil((RATE_LIMIT_WINDOW - (now - rateLimitData.firstRequest)) / 1000)
            });
        }
        
        console.log(`[SECURITY] Rate limit check passed: ${rateLimitData.count}/${maxRequests} for ${clientIP}`);
        next();
    };
};

// Input validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    return usernameRegex.test(username) && username.length >= 3 && username.length <= 30;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    // Remove potentially dangerous characters but preserve basic punctuation
    return input.replace(/[<>'"&]/g, '').trim().substring(0, 1000);
};

// Apply rate limiting to auth endpoints
app.use('/api/auth', simpleRateLimit(AUTH_RATE_LIMIT_MAX));

// Design Persistence System
const designConfigPath = path.join(__dirname, 'design-config.json');

// Load design configuration
app.get('/api/design/config', (req, res) => {
    try {
        const designConfig = {};
        let styles = {};
        let timestamp = null;
        
        if (fs.existsSync(designConfigPath)) {
            const configData = fs.readFileSync(designConfigPath, 'utf8');
            const parsedData = JSON.parse(configData);
            
            // Handle both old and new format
            if (parsedData.styles) {
                // New format with styles
                styles = parsedData.styles;
                timestamp = parsedData._metadata?.lastUpdated;
                console.log('✅ Design styles loaded:', Object.keys(styles).length, 'styles');
            } else {
                // Old format - treat as config/styles
                styles = parsedData;
                console.log('✅ Design config loaded (legacy format):', Object.keys(styles).length, 'variables');
            }
        } else {
            console.log('ℹ️ No design config file found, returning empty config');
        }
        
        res.json({ 
            success: true, 
            config: styles,  // Keep 'config' for backward compatibility
            styles: styles,  // Also include as 'styles'
            timestamp: timestamp
        });
    } catch (error) {
        console.error('❌ Error loading design config:', error);
        res.status(500).json({ success: false, error: error.message, config: {}, styles: {} });
    }
});

// Save design configuration
app.post('/api/design/config', (req, res) => {
    try {
        // Support both config and styles format for flexibility
        const { config, styles, timestamp } = req.body;
        const dataToSave = config || styles;
        
        if (!dataToSave) {
            return res.status(400).json({ success: false, error: 'Config or styles data required' });
        }
        
        // Validate data is an object
        if (typeof dataToSave !== 'object' || Array.isArray(dataToSave)) {
            return res.status(400).json({ success: false, error: 'Data must be an object' });
        }
        
        // Add metadata
        const configWithMeta = {
            styles: dataToSave,
            _metadata: {
                lastUpdated: timestamp || new Date().toISOString(),
                version: '1.0',
                styleCount: Object.keys(dataToSave).filter(key => !key.startsWith('_')).length
            }
        };
        
        fs.writeFileSync(designConfigPath, JSON.stringify(configWithMeta, null, 2));
        
        const styleCount = Object.keys(dataToSave).filter(key => !key.startsWith('_')).length;
        console.log(`✅ Design configuration saved: ${styleCount} styles/variables`);
        console.log('🎨 Sample selectors:', Object.keys(dataToSave).slice(0, 5).join(', '));
        
        res.json({ 
            success: true, 
            message: `Design configuration saved successfully (${styleCount} styles)`,
            styleCount: styleCount,
            timestamp: configWithMeta._metadata.lastUpdated
        });
    } catch (error) {
        console.error('❌ Error saving design config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reset design configuration
app.post('/api/design/reset', (req, res) => {
    try {
        if (fs.existsSync(designConfigPath)) {
            fs.unlinkSync(designConfigPath);
            console.log('✅ Design configuration reset to defaults');
        }
        res.json({ success: true, message: 'Design configuration reset to defaults' });
    } catch (error) {
        console.error('❌ Error resetting design config:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log(`[AUTH] ==> AUTHENTICATING ${req.method} ${req.path}`);
    console.log(`[AUTH] Token present: ${!!token}`);
    console.log(`[AUTH] Full auth header: ${authHeader ? '[REDACTED]' : 'none'}`);
    
    if (!token) {
        console.log('[AUTH] ❌ No token provided in Authorization header');
        return res.status(401).json({ 
            success: false, 
            error: 'Access token required',
            details: 'Authorization header missing or malformed. Expected: Bearer <token>',
            expected_format: 'Authorization: Bearer <your_backend_token>'
        });
    }
    
    // Log token characteristics for debugging
    console.log(`[AUTH] Token length: ${token.length}`);
    console.log(`[AUTH] Token starts with: ${token.substring(0, 20)}...`);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('[AUTH] ❌ JWT verification failed:', err.message);
            console.log('[AUTH] Error details:', err.name);
            
            // Provide specific error messaging based on JWT error type
            let errorMessage = 'Invalid or expired token';
            let errorDetails = '';
            
            if (err.name === 'JsonWebTokenError') {
                // This often happens when Supabase tokens are sent instead of backend tokens
                errorMessage = 'Invalid token format';
                errorDetails = 'This appears to be a malformed JWT token. Make sure you are using backend tokens from /api/auth/token-exchange, not Supabase tokens.';
                console.log('[AUTH] 🔍 POSSIBLE CAUSE: Client may be sending Supabase tokens instead of backend tokens');
            } else if (err.name === 'TokenExpiredError') {
                errorMessage = 'Token has expired';
                errorDetails = 'Please refresh your authentication or sign in again.';
            } else if (err.name === 'NotBeforeError') {
                errorMessage = 'Token not active yet';
                errorDetails = 'Token is not yet valid. Check your system clock.';
            }
            
            return res.status(403).json({ 
                success: false, 
                error: errorMessage,
                error_type: err.name,
                details: errorDetails,
                debug_info: {
                    endpoint: `${req.method} ${req.path}`,
                    token_length: token.length,
                    jwt_error: err.name,
                    message: 'If you are getting 403 errors, ensure your client is using backend tokens from token exchange, not Supabase tokens'
                }
            });
        }
        
        console.log(`[AUTH] ✅ Token valid for user: ${user.username || user.email} (ID: ${user.userId})`);
        console.log(`[AUTH] Token source: ${user.source || 'unknown'}`);
        req.user = user;
        next();
    });
};

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log(`[LOGIN] Attempt for username: ${username}`);
        
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('[LOGIN] Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            if (!user) {
                console.log(`[LOGIN] ❌ User not found: ${username}`);
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
            
            // For now, simple password check (in production, use bcrypt)
            if (password === 'testpass123' || password === user.password) {
                const token = jwt.sign(
                    { userId: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log(`[LOGIN] ✅ Successful login for: ${username} (ID: ${user.id})`);
                
                res.json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                });
            } else {
                console.log(`[LOGIN] ❌ Invalid password for: ${username}`);
                res.status(401).json({ success: false, error: 'Invalid credentials' });
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Native mobile authentication endpoints (expected by mobile app)
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password, platform } = req.body;
        
        authDebug('Sign in attempt for email: %s from platform: %s', email, platform);
        console.log(`[SIGNIN] Attempt for email: ${email} (platform: ${platform})`);
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                authDebug.error('Database error during signin: %O', err);
                console.error('[SIGNIN] Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (!user) {
                console.log(`[SIGNIN] ❌ User not found: ${email}`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            // Simple password check (in production, use bcrypt.compare)
            if (password === 'testpass123' || password === user.password) {
                const session = {
                    access_token: jwt.sign(
                        { userId: user.id, email: user.email, username: user.username },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    ),
                    refresh_token: jwt.sign(
                        { userId: user.id, type: 'refresh' },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    ),
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
                
                console.log(`[SIGNIN] ✅ Successful signin for: ${email} (ID: ${user.id})`);
                
                res.json({
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username
                    },
                    session
                });
            } else {
                console.log(`[SIGNIN] ❌ Invalid password for: ${email}`);
                res.status(401).json({ message: 'Invalid credentials' });
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Google OAuth signin endpoint
app.post('/api/auth/google', async (req, res) => {
    try {
        // Check if Google OAuth is configured
        if (!googleClient || !GOOGLE_CLIENT_ID) {
            console.warn('[GOOGLE AUTH] ⚠️ Google OAuth not configured');
            return res.status(501).json({ 
                success: false, 
                message: 'Google OAuth not configured on server. Please set GOOGLE_CLIENT_ID environment variable.',
                error: 'oauth_not_configured'
            });
        }
        
        const { credential, platform } = req.body;
        
        console.log('[GOOGLE AUTH] Verifying Google credential...');
        
        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name;
        const googleId = payload.sub;
        const picture = payload.picture;
        
        console.log(`[GOOGLE AUTH] User info: ${email}, ${name}`);
        
        // Check if user exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('[GOOGLE AUTH] Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            let user;
            
            if (existingUser) {
                // User exists, update their info
                console.log(`[GOOGLE AUTH] Existing user found: ${existingUser.username}`);
                user = existingUser;
                
                // Update user's Google info if needed
                db.run(
                    'UPDATE users SET google_id = ?, picture = ? WHERE id = ?',
                    [googleId, picture, user.id],
                    (err) => {
                        if (err) console.error('[GOOGLE AUTH] Error updating user:', err);
                    }
                );
            } else {
                // Create new user
                const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
                
                console.log(`[GOOGLE AUTH] Creating new user: ${username}`);
                
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO users (email, username, google_id, picture, email_verified, created_at) 
                         VALUES (?, ?, ?, ?, 1, datetime('now'))`,
                        [email, username, googleId, picture],
                        function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                user = {
                                    id: this.lastID,
                                    email: email,
                                    username: username,
                                    picture: picture
                                };
                                resolve();
                            }
                        }
                    );
                });
            }
            
            // Create session tokens
            const session = {
                access_token: jwt.sign(
                    { userId: user.id, email: user.email, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                ),
                refresh_token: jwt.sign(
                    { userId: user.id, type: 'refresh' },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                ),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            
            console.log(`[GOOGLE AUTH] ✅ Successful Google signin for: ${email}`);
            
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username || user.email.split('@')[0],
                    picture: user.picture
                },
                session
            });
        });
        
    } catch (error) {
        console.error('[GOOGLE AUTH] Error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Invalid Google credential',
            error: error.message 
        });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, platform } = req.body;
        
        console.log('='.repeat(80));
        console.log('🚀 [EMAIL REGISTRATION] Starting signup process...');
        console.log(`📧 Email: ${email}`);
        console.log(`🖥️  Platform: ${platform}`);
        console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
        console.log('='.repeat(80));
        
        // Validate input
        if (!email || !password) {
            console.log('❌ [SIGNUP] Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('❌ [SIGNUP] Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (existingUser) {
                console.log(`❌ [SIGNUP] User already exists: ${email}`);
                return res.status(400).json({ message: 'User already exists' });
            }
            
            console.log(`✅ [SIGNUP] Email available, proceeding with registration`);
            
            // Generate username from email
            const username = email.split('@')[0];
            
            // Generate email verification token
            const verificationToken = emailService.generateConfirmationToken();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            console.log(`🔑 [SIGNUP] Generated verification token: ${verificationToken.substring(0, 8)}...`);
            console.log(`⏰ [SIGNUP] Token expires: ${verificationExpires.toISOString()}`);
            
            // Hash password (in production)
            const hashedPassword = await bcrypt.hash(password, 10);
            console.log(`🔐 [SIGNUP] Password hashed successfully`);
            
            // Create new user with email verification info
            db.run(
                `INSERT INTO users (username, email, password, email_verified, email_verification_token, email_verification_expires) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [username, email, hashedPassword, 0, verificationToken, verificationExpires.toISOString()],
                async function(err) {
                    if (err) {
                        console.error('❌ [SIGNUP] Database insert error:', err);
                        return res.status(500).json({ message: 'Database error' });
                    }
                    
                    const userId = this.lastID;
                    console.log(`✅ [SIGNUP] User created in database with ID: ${userId}`);
                    
                    // Check email configuration
                    console.log('📧 [EMAIL] Checking email configuration...');
                    console.log(`📧 [EMAIL] EMAIL_ENABLED: ${process.env.EMAIL_ENABLED}`);
                    console.log(`📧 [EMAIL] EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER}`);
                    console.log(`📧 [EMAIL] CLOUDFLARE_EMAIL_WORKER_URL: ${process.env.CLOUDFLARE_EMAIL_WORKER_URL}`);
                    
                    // Send confirmation email
                    console.log('📧 [EMAIL] Attempting to send confirmation email...');
                    const emailResult = await emailService.sendConfirmationEmail(email, username, verificationToken);
                    
                    console.log('📧 [EMAIL] Email sending result:', emailResult);
                    
                    if (!emailResult.success && !emailResult.skipped) {
                        console.error('❌ [EMAIL] Failed to send confirmation email:', emailResult.error);
                        // Continue anyway - user can request resend later
                    } else if (emailResult.skipped) {
                        console.log('⚠️  [EMAIL] Email sending is disabled - check environment variables');
                    } else {
                        console.log('✅ [EMAIL] Confirmation email sent successfully!');
                    }
                    
                    const session = {
                        access_token: jwt.sign(
                            { userId, email, username },
                            JWT_SECRET,
                            { expiresIn: '24h' }
                        ),
                        refresh_token: jwt.sign(
                            { userId, type: 'refresh' },
                            JWT_SECRET,
                            { expiresIn: '7d' }
                        ),
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    };
                    
                    console.log(`🎉 [SIGNUP] Registration completed successfully!`);
                    console.log(`👤 User: ${username} (${email})`);
                    console.log(`🆔 User ID: ${userId}`);
                    console.log(`📧 Email status: ${emailResult.skipped ? 'DISABLED' : emailResult.success ? 'SENT' : 'FAILED'}`);
                    console.log('='.repeat(80));
                    
                    res.json({
                        user: {
                            id: userId,
                            email,
                            username,
                            email_verified: false
                        },
                        session,
                        message: emailResult.skipped 
                            ? 'Account created successfully' 
                            : emailResult.success 
                                ? 'Account created! Please check your email to confirm your address.'
                                : 'Account created but email sending failed. Please contact support.'
                    });
                }
            );
        });
    } catch (error) {
        console.error('❌ [SIGNUP] Critical error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/signout', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            console.log('[SIGNOUT] User signed out successfully');
            // In a production app, you would add the token to a blacklist
        }
        
        res.json({ message: 'Signed out successfully' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/auth/user', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        db.get('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                console.error('[USER] Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (!user) {
                console.log(`[USER] ❌ User not found: ${userId}`);
                return res.status(404).json({ message: 'User not found' });
            }
            
            console.log(`[USER] ✅ User data retrieved: ${user.email}`);
            res.json({ user });
        });
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({ message: 'Refresh token required' });
        }
        
        jwt.verify(refresh_token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('[REFRESH] ❌ Invalid refresh token');
                return res.status(401).json({ message: 'Invalid refresh token' });
            }
            
            if (decoded.type !== 'refresh') {
                return res.status(401).json({ message: 'Invalid token type' });
            }
            
            const userId = decoded.userId;
            
            db.get('SELECT id, username, email FROM users WHERE id = ?', [userId], (err, user) => {
                if (err || !user) {
                    console.error('[REFRESH] User not found:', userId);
                    return res.status(404).json({ message: 'User not found' });
                }
                
                const session = {
                    access_token: jwt.sign(
                        { userId: user.id, email: user.email, username: user.username },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    ),
                    refresh_token: jwt.sign(
                        { userId: user.id, type: 'refresh' },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    ),
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
                
                console.log(`[REFRESH] ✅ Token refreshed for: ${user.email}`);
                
                res.json({
                    session,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username
                    }
                });
            });
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Email confirmation endpoint
app.get('/api/auth/confirm-email', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({ message: 'Confirmation token required' });
        }
        
        console.log(`[CONFIRM EMAIL] Token: ${token}`);
        
        db.get(
            `SELECT * FROM users 
             WHERE email_verification_token = ? 
             AND datetime(email_verification_expires) > datetime('now')`,
            [token],
            async (err, user) => {
                if (err) {
                    console.error('[CONFIRM EMAIL] Database error:', err);
                    return res.status(500).json({ message: 'Database error' });
                }
                
                if (!user) {
                    console.log('[CONFIRM EMAIL] ❌ Invalid or expired token');
                    return res.status(400).json({ message: 'Invalid or expired confirmation token' });
                }
                
                // Mark email as verified
                db.run(
                    `UPDATE users 
                     SET email_verified = 1, 
                         email_verification_token = NULL, 
                         email_verification_expires = NULL 
                     WHERE id = ?`,
                    [user.id],
                    async (err) => {
                        if (err) {
                            console.error('[CONFIRM EMAIL] Update error:', err);
                            return res.status(500).json({ message: 'Database error' });
                        }
                        
                        console.log(`[CONFIRM EMAIL] ✅ Email confirmed for user: ${user.email}`);
                        
                        // Send welcome email
                        await emailService.sendWelcomeEmail(user.email, user.username);
                        
                        res.json({
                            success: true,
                            message: 'Email confirmed successfully!',
                            user: {
                                id: user.id,
                                email: user.email,
                                username: user.username,
                                email_verified: true
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Email confirmation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resend confirmation email endpoint
app.post('/api/auth/resend-confirmation', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }
        
        console.log(`[RESEND CONFIRMATION] Request for: ${email}`);
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('[RESEND CONFIRMATION] Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (!user) {
                console.log(`[RESEND CONFIRMATION] ❌ User not found: ${email}`);
                // Don't reveal if user exists or not
                return res.json({ message: 'If an account exists, a confirmation email has been sent.' });
            }
            
            if (user.email_verified) {
                console.log(`[RESEND CONFIRMATION] Email already verified for: ${email}`);
                return res.json({ message: 'Email is already confirmed.' });
            }
            
            // Generate new verification token
            const verificationToken = emailService.generateConfirmationToken();
            const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            // Update user with new token
            db.run(
                `UPDATE users 
                 SET email_verification_token = ?, 
                     email_verification_expires = ? 
                 WHERE id = ?`,
                [verificationToken, verificationExpires.toISOString(), user.id],
                async (err) => {
                    if (err) {
                        console.error('[RESEND CONFIRMATION] Update error:', err);
                        return res.status(500).json({ message: 'Database error' });
                    }
                    
                    // Send new confirmation email
                    const emailResult = await emailService.sendConfirmationEmail(
                        user.email, 
                        user.username, 
                        verificationToken
                    );
                    
                    console.log(`[RESEND CONFIRMATION] ✅ New confirmation email sent to: ${email}`);
                    
                    res.json({ 
                        success: true,
                        message: 'Confirmation email has been resent. Please check your inbox.' 
                    });
                }
            );
        });
    } catch (error) {
        console.error('Resend confirmation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/biometric', async (req, res) => {
    try {
        const { email, biometric_verified, device_info } = req.body;
        
        if (!biometric_verified) {
            return res.status(400).json({ message: 'Biometric verification required' });
        }
        
        console.log(`[BIOMETRIC] Attempt for email: ${email}`);
        console.log('[BIOMETRIC] Device info:', device_info);
        
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (err) {
                console.error('[BIOMETRIC] Database error:', err);
                return res.status(500).json({ message: 'Database error' });
            }
            
            if (!user) {
                console.log(`[BIOMETRIC] ❌ User not found: ${email}`);
                return res.status(401).json({ message: 'User not found' });
            }
            
            const session = {
                access_token: jwt.sign(
                    { userId: user.id, email: user.email, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                ),
                refresh_token: jwt.sign(
                    { userId: user.id, type: 'refresh' },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                ),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            
            console.log(`[BIOMETRIC] ✅ Biometric auth successful for: ${email}`);
            
            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                },
                session
            });
        });
    } catch (error) {
        console.error('Biometric auth error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Token exchange endpoint - converts Supabase tokens to backend tokens
app.post('/api/auth/token-exchange', async (req, res) => {
    try {
        console.log('[TOKEN-EXCHANGE] ==> Starting token exchange process');
        const { supabase_token, user_data } = req.body;
        
        if (!supabase_token) {
            console.log('[TOKEN-EXCHANGE] ❌ No Supabase token provided');
            return res.status(400).json({ success: false, error: 'Supabase token required' });
        }
        
        if (!user_data || !user_data.email) {
            console.log('[TOKEN-EXCHANGE] ❌ No user data provided');
            return res.status(400).json({ success: false, error: 'User data with email required' });
        }
        
        console.log('[TOKEN-EXCHANGE] Processing exchange for user:', user_data.email);
        
        // Find or create user based on Supabase user data
        db.get('SELECT * FROM users WHERE email = ?', [user_data.email], (err, existingUser) => {
            if (err) {
                console.error('[TOKEN-EXCHANGE] Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            let userId, username;
            
            const handleUserReady = (user) => {
                // Generate backend JWT token
                const backendToken = jwt.sign(
                    { 
                        userId: user.id, 
                        email: user.email, 
                        username: user.username,
                        source: 'supabase_exchange'
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                console.log('[TOKEN-EXCHANGE] ✅ Backend token generated for user:', user.username);
                
                res.json({
                    success: true,
                    backend_token: backendToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username
                    },
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
            };
            
            if (existingUser) {
                console.log('[TOKEN-EXCHANGE] Found existing user:', existingUser.username);
                handleUserReady(existingUser);
            } else {
                console.log('[TOKEN-EXCHANGE] Creating new user for:', user_data.email);
                
                // Create username from email if not provided
                username = user_data.user_metadata?.username || 
                          user_data.username || 
                          user_data.email.split('@')[0];
                
                // Ensure username is unique
                const checkUniqueUsername = (baseUsername, suffix = 0) => {
                    const testUsername = suffix === 0 ? baseUsername : `${baseUsername}${suffix}`;
                    
                    db.get('SELECT id FROM users WHERE username = ?', [testUsername], (err, userExists) => {
                        if (err) {
                            console.error('[TOKEN-EXCHANGE] Username check error:', err);
                            return res.status(500).json({ success: false, error: 'Database error' });
                        }
                        
                        if (userExists) {
                            // Username taken, try with suffix
                            checkUniqueUsername(baseUsername, suffix + 1);
                        } else {
                            // Username available, create user
                            db.run(
                                'INSERT INTO users (email, username, created_at, email_confirmed) VALUES (?, ?, datetime("now"), 1)',
                                [user_data.email, testUsername],
                                function(err) {
                                    if (err) {
                                        console.error('[TOKEN-EXCHANGE] User creation error:', err);
                                        return res.status(500).json({ success: false, error: 'User creation failed' });
                                    }
                                    
                                    const newUser = {
                                        id: this.lastID,
                                        email: user_data.email,
                                        username: testUsername
                                    };
                                    
                                    console.log('[TOKEN-EXCHANGE] ✅ New user created:', testUsername);
                                    handleUserReady(newUser);
                                }
                            );
                        }
                    });
                };
                
                checkUniqueUsername(username);
            }
        });
        
    } catch (error) {
        console.error('[TOKEN-EXCHANGE] ❌ Token exchange error:', error);
        res.status(500).json({ success: false, error: 'Token exchange failed' });
    }
});

// Initialize database tables
const initializeDatabase = () => {
    // Create friends table if it doesn't exist
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                accepted_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (friend_id) REFERENCES users (id),
                UNIQUE(user_id, friend_id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating friends table:', err);
            } else {
                console.log('✅ Friends table initialized');
            }
        });
        
        // Create users table if it doesn't exist (ensure it's there)
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password TEXT,
                email_verified BOOLEAN DEFAULT 0,
                email_verification_token TEXT,
                email_verification_expires DATETIME,
                preferences_colors TEXT DEFAULT '{}',
                preferences_theme TEXT DEFAULT 'light',
                preferences_font_size TEXT DEFAULT 'medium',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating users table:', err);
            } else {
                console.log('✅ Users table initialized');
                // Add email verification columns if they don't exist (for existing databases)
                db.run(`ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN email_verification_token TEXT`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN email_verification_expires DATETIME`, () => {});
                // Add preferences columns if they don't exist (for existing databases)
                db.run(`ALTER TABLE users ADD COLUMN preferences_colors TEXT DEFAULT '{}'`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN preferences_theme TEXT DEFAULT 'light'`, () => {});
                db.run(`ALTER TABLE users ADD COLUMN preferences_font_size TEXT DEFAULT 'medium'`, () => {});
            }
        });
        
        // Create rooms table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS rooms (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                creator_id INTEGER,
                is_public INTEGER DEFAULT 1,
                topics TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating rooms table:', err);
            } else {
                console.log('✅ Rooms table initialized');
            }
        });
        
        // Create room_members table for membership tracking
        db.run(`
            CREATE TABLE IF NOT EXISTS room_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                is_admin INTEGER DEFAULT 0,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms (id),
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(room_id, user_id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating room_members table:', err);
            } else {
                console.log('✅ Room members table initialized');
            }
        });
        
        // Create default rooms if they don't exist
        const defaultRooms = [
            { id: 'general', name: 'General', description: 'General discussion', topics: ['general', 'chat'] },
            { id: 'tech-talk', name: 'Tech Talk', description: 'Technology discussions', topics: ['technology', 'programming'] },
            { id: 'random', name: 'Random', description: 'Random conversations', topics: ['random', 'fun'] }
        ];
        
        defaultRooms.forEach(room => {
            db.get('SELECT id FROM rooms WHERE id = ?', [room.id], (err, row) => {
                if (err) {
                    console.error(`Error checking room ${room.name}:`, err);
                    return;
                }
                
                if (!row) {
                    db.run(`INSERT INTO rooms (id, name, description, creator_id, is_public, topics)
                            VALUES (?, ?, ?, ?, ?, ?)`,
                        [room.id, room.name, room.description, 1, 1, JSON.stringify(room.topics)], function(err) {
                            if (err) {
                                console.error(`Error creating default room ${room.name}:`, err);
                            } else {
                                console.log(`✅ Default room "${room.name}" created`);
                            }
                        });
                }
            });
        });

        // Check if test users exist and create them if needed
        db.get('SELECT id FROM users WHERE username = ?', ['testuser1'], (err, row) => {
            if (err) {
                console.error('Error checking testuser1:', err);
                return;
            }
            
            if (!row) {
                db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
                    ['testuser1', 'test1@example.com', 'testpass123'], function(err) {
                        if (err) {
                            console.error('Error creating testuser1:', err);
                        } else {
                            console.log('✅ Test user "testuser1" created with ID:', this.lastID);
                        }
                    });
            } else {
                console.log('ℹ️  Test user "testuser1" already exists with ID:', row.id);
            }
        });
        
        db.get('SELECT id FROM users WHERE username = ?', ['testuser2'], (err, row) => {
            if (err) {
                console.error('Error checking testuser2:', err);
                return;
            }
            
            if (!row) {
                db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
                    ['testuser2', 'test2@example.com', 'testpass123'], function(err) {
                        if (err) {
                            console.error('Error creating testuser2:', err);
                        } else {
                            console.log('✅ Test user "testuser2" created with ID:', this.lastID);
                        }
                    });
            } else {
                console.log('ℹ️  Test user "testuser2" already exists with ID:', row.id);
            }
        });
    });
};

// Call initialize on startup
initializeDatabase();

// Friend endpoints
app.get('/api/friends', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        db.all(`
            SELECT 
                f.id,
                f.friend_id as id,
                u.username,
                u.email,
                f.accepted_at
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ? AND f.status = 'accepted'
            
            UNION
            
            SELECT 
                f.id,
                f.user_id as id,
                u.username,
                u.email,
                f.accepted_at
            FROM friends f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = 'accepted'
        `, [userId, userId], (err, rows) => {
            if (err) {
                console.error('Error fetching friends:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            res.json({ success: true, friends: rows || [] });
        });
    } catch (error) {
        console.error('Friends list error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/friends/pending', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Get incoming requests (requests sent TO this user)
        db.all(`
            SELECT 
                f.id,
                f.user_id as id,
                u.username,
                u.email,
                f.created_at
            FROM friends f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ? AND f.status = 'pending'
        `, [userId], (err, incomingRows) => {
            if (err) {
                console.error('Error fetching incoming requests:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            // Get outgoing requests (requests sent BY this user)
            db.all(`
                SELECT 
                    f.id,
                    f.friend_id as id,
                    u.username,
                    u.email,
                    f.created_at
                FROM friends f
                JOIN users u ON f.friend_id = u.id
                WHERE f.user_id = ? AND f.status = 'pending'
            `, [userId], (err, outgoingRows) => {
                if (err) {
                    console.error('Error fetching outgoing requests:', err);
                    return res.status(500).json({ success: false, error: 'Database error' });
                }
                
                res.json({
                    success: true,
                    incoming: incomingRows || [],
                    outgoing: outgoingRows || []
                });
            });
        });
    } catch (error) {
        console.error('Pending requests error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/friends/request', authenticateToken, (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.userId;
        
        console.log('=== Friend Request Debug ===');
        console.log('User ID:', userId);
        console.log('Friend ID:', friendId);
        
        if (!friendId) {
            return res.status(400).json({ success: false, error: 'Friend ID is required' });
        }
        
        if (parseInt(friendId) === parseInt(userId)) {
            return res.status(400).json({ success: false, error: 'You cannot add yourself as a friend' });
        }
        
        // Check if friend exists
        db.get('SELECT id, username FROM users WHERE id = ?', [friendId], (err, friendUser) => {
            if (err) {
                console.error('Error checking friend user:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            if (!friendUser) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }
            
            // Check if friendship already exists (in either direction)
            db.get(`
                SELECT * FROM friends 
                WHERE (user_id = ? AND friend_id = ?) 
                   OR (user_id = ? AND friend_id = ?)
            `, [userId, friendId, friendId, userId], (err, existingFriendship) => {
                if (err) {
                    console.error('Error checking existing friendship:', err);
                    return res.status(500).json({ success: false, error: 'Database error' });
                }
                
                if (existingFriendship) {
                    if (existingFriendship.status === 'accepted') {
                        return res.status(400).json({ success: false, error: 'You are already friends with this user' });
                    } else if (existingFriendship.status === 'pending') {
                        return res.status(400).json({ success: false, error: 'Friend request already sent or pending' });
                    }
                }
                
                // Create new friend request
                db.run(`
                    INSERT INTO friends (user_id, friend_id, status)
                    VALUES (?, ?, 'pending')
                `, [userId, friendId], function(err) {
                    if (err) {
                        console.error('Error creating friend request:', err);
                        return res.status(500).json({ success: false, error: 'Database error' });
                    }
                    
                    res.json({
                        success: true,
                        message: `Friend request sent to ${friendUser.username}`
                    });
                });
            });
        });
    } catch (error) {
        console.error('Friend request error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/friends/accept', authenticateToken, (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.userId;
        
        if (!friendId) {
            return res.status(400).json({ success: false, error: 'Friend ID is required' });
        }
        
        // Find the pending friend request sent TO this user
        db.run(`
            UPDATE friends 
            SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND friend_id = ? AND status = 'pending'
        `, [friendId, userId], function(err) {
            if (err) {
                console.error('Error accepting friend request:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Friend request not found' });
            }
            
            res.json({ success: true, message: 'Friend request accepted' });
        });
    } catch (error) {
        console.error('Accept friend error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/friends/decline', authenticateToken, (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.userId;
        
        if (!friendId) {
            return res.status(400).json({ success: false, error: 'Friend ID is required' });
        }
        
        // Delete the pending friend request sent TO this user
        db.run(`
            DELETE FROM friends 
            WHERE user_id = ? AND friend_id = ? AND status = 'pending'
        `, [friendId, userId], function(err) {
            if (err) {
                console.error('Error declining friend request:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Friend request not found' });
            }
            
            res.json({ success: true, message: 'Friend request declined' });
        });
    } catch (error) {
        console.error('Decline friend error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.delete('/api/friends/:friendId', authenticateToken, (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.user.userId;
        
        if (!friendId) {
            return res.status(400).json({ success: false, error: 'Friend ID is required' });
        }
        
        // Delete friendship in both directions
        db.run(`
            DELETE FROM friends 
            WHERE (user_id = ? AND friend_id = ?) 
               OR (user_id = ? AND friend_id = ?)
        `, [userId, friendId, friendId, userId], function(err) {
            if (err) {
                console.error('Error removing friend:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, error: 'Friendship not found' });
            }
            
            res.json({ success: true, message: 'Friend removed' });
        });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Debug endpoint to check database users
app.get('/api/debug/users', (req, res) => {
    db.all('SELECT id, username, email FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, users: rows });
    });
});

// Debug endpoint to add test user
app.post('/api/debug/add-test-user', (req, res) => {
    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        ['testuser1', 'test1@example.com', 'testpass123'], function(err) {
            if (err) {
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, message: 'Test user created', userId: this.lastID });
        });
});

// Auth sync endpoint - syncs Appwrite auth with backend
app.post('/api/auth/sync', async (req, res) => {
    try {
        const { user, session } = req.body;
        
        if (!user || !session) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing user or session data' 
            });
        }

        // Generate a backend token for the user
        const backendToken = jwt.sign(
            { 
                userId: user.$id || user.id,
                email: user.email,
                username: user.name || user.email?.split('@')[0] || 'User'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Check if user exists in backend database
        db.get('SELECT * FROM users WHERE email = ?', [user.email], (err, existingUser) => {
            if (err) {
                console.error('[AUTH SYNC] Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            if (!existingUser) {
                // Create user in backend database
                const username = user.name || user.email?.split('@')[0] || 'User';
                db.run(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, user.email, 'appwrite_auth'],
                    function(createErr) {
                        if (createErr) {
                            console.error('[AUTH SYNC] Failed to create user:', createErr);
                            // Continue anyway - user might already exist
                        }
                        console.log('[AUTH SYNC] Created backend user for:', user.email);
                    }
                );
            }

            console.log('[AUTH SYNC] ✅ Synced user:', user.email);
            res.json({ 
                success: true, 
                token: backendToken,
                message: 'Auth synced successfully'
            });
        });
    } catch (error) {
        console.error('[AUTH SYNC] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Sync failed' 
        });
    }
});

// Appwrite sync endpoint - alias for the auth sync (frontend expects this endpoint name)
app.post('/api/auth/appwrite-sync', async (req, res) => {
    try {
        console.log('[APPWRITE SYNC] ==> Appwrite sync attempt');
        const { user, session } = req.body;
        
        if (!user || !session) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing user or session data' 
            });
        }

        // Generate a backend token for the user
        const backendToken = jwt.sign(
            { 
                userId: user.$id || user.id,
                email: user.email,
                username: user.name || user.email?.split('@')[0] || 'User'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Check if user exists in backend database
        db.get('SELECT * FROM users WHERE email = ?', [user.email], (err, existingUser) => {
            if (err) {
                console.error('[APPWRITE SYNC] Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error' });
            }

            if (!existingUser) {
                // Create user in backend database
                const username = user.name || user.email?.split('@')[0] || 'User';
                db.run(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [username, user.email, 'appwrite_auth'],
                    function(createErr) {
                        if (createErr) {
                            console.error('[APPWRITE SYNC] Failed to create user:', createErr);
                            // Continue anyway - user might already exist
                        }
                        console.log('[APPWRITE SYNC] Created backend user for:', user.email);
                    }
                );
            }

            console.log('[APPWRITE SYNC] ✅ Synced user:', user.email);
            res.json({ 
                success: true, 
                token: backendToken,
                message: 'Appwrite auth synced successfully'
            });
        });
    } catch (error) {
        console.error('[APPWRITE SYNC] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Appwrite sync failed' 
        });
    }
});

// User Preferences API Endpoints
// GET /api/user/preferences - Retrieve user preferences
app.get('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        db.get('SELECT preferences_colors, preferences_theme, preferences_font_size FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                console.error('Get preferences error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while fetching preferences'
                });
            }
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Parse colors JSON or use defaults
            let colors;
            try {
                colors = JSON.parse(user.preferences_colors || '{}');
            } catch (e) {
                colors = {};
            }

            // Ensure colors have defaults
            const defaultColors = {
                primary: '#007bff',
                secondary: '#6c757d',
                background: '#ffffff',
                accent: '#28a745',
                text: '#212529'
            };
            
            colors = { ...defaultColors, ...colors };

            const preferences = {
                colors,
                theme: user.preferences_theme || 'light',
                fontSize: user.preferences_font_size || 'medium'
            };

            console.log(`[GET PREFERENCES] ✅ Retrieved preferences for user: ${userId}`);
            res.status(200).json({
                success: true,
                data: { preferences }
            });
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching preferences'
        });
    }
});

// POST /api/user/preferences - Update user preferences
app.post('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { colors, theme, fontSize } = req.body;

        // Validate colors object if provided
        if (colors) {
            const colorKeys = ['primary', 'secondary', 'background', 'accent', 'text'];
            const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
            
            for (const key of Object.keys(colors)) {
                if (!colorKeys.includes(key)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid color key: ${key}`
                    });
                }
                
                if (!hexColorRegex.test(colors[key])) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid hex color format for ${key}: ${colors[key]}`
                    });
                }
            }
        }

        // Validate theme if provided
        if (theme && !['light', 'dark', 'auto'].includes(theme)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid theme. Must be light, dark, or auto'
            });
        }

        // Validate fontSize if provided
        if (fontSize && !['small', 'medium', 'large'].includes(fontSize)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid fontSize. Must be small, medium, or large'
            });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];
        
        if (colors) {
            updateFields.push('preferences_colors = ?');
            updateValues.push(JSON.stringify(colors));
        }
        
        if (theme) {
            updateFields.push('preferences_theme = ?');
            updateValues.push(theme);
        }
        
        if (fontSize) {
            updateFields.push('preferences_font_size = ?');
            updateValues.push(fontSize);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No preferences data provided'
            });
        }

        updateValues.push(userId);
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

        db.run(updateQuery, updateValues, function(err) {
            if (err) {
                console.error('Update preferences error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Server error while updating preferences'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log(`[POST PREFERENCES] ✅ Updated preferences for user: ${userId}`);
            res.status(200).json({
                success: true,
                message: 'Preferences updated successfully'
            });
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating preferences'
        });
    }
});

// Grok xAI Integration Endpoint
app.post('/api/grok', simpleRateLimit(10), async (req, res) => {
    try {
        console.log('🤖 [GROK] Incoming request:', {
            prompt: req.body.prompt?.substring(0, 50) + '...',
            model: req.body.model,
            stream: req.body.stream
        });

        // Comprehensive API key and endpoint logging
        console.log('🔧 [GROK-CONFIG] ========== API CONFIGURATION CHECK ==========');
        console.log('🔧 [GROK-CONFIG] Environment variables status:', {
            XAI_API_KEY_configured: !!XAI_API_KEY,
            XAI_API_KEY_length: XAI_API_KEY ? XAI_API_KEY.length : 0,
            XAI_API_KEY_prefix: XAI_API_KEY ? XAI_API_KEY.substring(0, 8) + '...' : 'not set',
            XAI_BASE_URL: XAI_BASE_URL,
            NODE_ENV: process.env.NODE_ENV
        });

        // Check if xAI API key is configured
        if (!XAI_API_KEY) {
            console.error('❌ [GROK] xAI API key not configured');
            console.error('💡 [GROK] Configuration help: Set XAI_API_KEY in your .env file');
            console.error('💡 [GROK] Expected format: XAI_API_KEY=xai-your-api-key-here');
            return res.status(501).json({
                success: false,
                error: 'xAI integration not configured',
                message: 'Server administrator needs to set XAI_API_KEY environment variable'
            });
        }

        console.log('✅ [GROK-CONFIG] API key is configured and ready');
        console.log('🔧 [GROK-CONFIG] Endpoint will use:', {
            baseUrl: XAI_BASE_URL,
            endpoint: `${XAI_BASE_URL}/chat/completions`,
            method: 'POST'
        });

        const { prompt, model = 'grok-beta', stream = true } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid prompt',
                message: 'Prompt is required and must be a string'
            });
        }

        if (prompt.length > 4000) {
            return res.status(400).json({
                success: false,
                error: 'Prompt too long',
                message: 'Prompt must be less than 4000 characters'
            });
        }

        // Prepare the request to xAI
        const grokRequest = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are Grok, a helpful AI assistant. Provide concise, accurate, and helpful responses. If asked about chat context, politely explain that you only see the current prompt.'
                },
                {
                    role: 'user',
                    content: prompt.trim()
                }
            ],
            stream: stream,
            max_tokens: 1000,
            temperature: 0.7
        };

        console.log('🔄 [GROK] Forwarding request to xAI API...');

        // Make request to xAI API
        const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${XAI_API_KEY}`
            },
            body: JSON.stringify(grokRequest)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [GROK] xAI API error:', response.status, errorText);
            
            let errorMessage = 'Failed to communicate with Grok';
            if (response.status === 401) {
                errorMessage = 'xAI API authentication failed';
            } else if (response.status === 429) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
            } else if (response.status >= 500) {
                errorMessage = 'Grok service is temporarily unavailable';
            }
            
            return res.status(response.status).json({
                success: false,
                error: errorMessage,
                status: response.status
            });
        }

        if (stream) {
            // Set up Server-Sent Events headers for streaming
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            });

            console.log('📡 [GROK] Starting stream response...');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';
            let totalChunks = 0;

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        console.log(`✅ [GROK] Stream completed with ${totalChunks} chunks`);
                        res.write('data: [DONE]\n\n');
                        res.end();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            
                            if (data === '[DONE]') {
                                res.write('data: [DONE]\n\n');
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                // Forward the exact data structure from xAI
                                res.write(`data: ${data}\n\n`);
                                totalChunks++;
                            } catch (e) {
                                // Skip invalid JSON chunks
                                console.warn('⚠️ [GROK] Skipped invalid JSON chunk:', data.substring(0, 50));
                            }
                        }
                    }
                }
            } catch (streamError) {
                console.error('❌ [GROK] Stream error:', streamError);
                res.write(`data: ${JSON.stringify({
                    error: { message: 'Stream interrupted' }
                })}\n\n`);
                res.end();
            }
        } else {
            // Non-streaming response
            const data = await response.json();
            console.log('✅ [GROK] Non-stream response received');
            
            res.json({
                success: true,
                ...data
            });
        }

    } catch (error) {
        console.error('❌ [GROK] Server error:', error);
        
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Failed to process Grok request'
            });
        }
    }
});

// Optional authentication middleware - allows both authenticated and guest access
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        // No token provided - continue as guest
        req.user = null;
        return next();
    }
    
    // Try to verify token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log('[OPTIONAL AUTH] Token invalid, continuing as guest:', err.message);
            req.user = null;
        } else {
            console.log('[OPTIONAL AUTH] Valid token for user:', user.username);
            req.user = user;
        }
        next();
    });
};

// Invitations endpoints - allow both authenticated and guest access
app.get('/api/invitations', optionalAuth, (req, res) => {
    try {
        // For authenticated users, you could fetch actual invitations from database
        // For now, return empty invitations for everyone
        console.log('[GET INVITATIONS] Request for user:', req.user?.username || 'guest');
        res.json({ success: true, invitations: [] });
    } catch (error) {
        console.error('[GET INVITATIONS] Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Notifications endpoints - allow both authenticated and guest access
app.get('/api/notifications', optionalAuth, (req, res) => {
    try {
        // For authenticated users, you could fetch actual notifications from database
        // For now, return empty notifications for everyone
        console.log('[GET NOTIFICATIONS] Request for user:', req.user?.username || 'guest');
        res.json({ success: true, notifications: [] });
    } catch (error) {
        console.error('[GET NOTIFICATIONS] Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Rooms endpoints - Allow both authenticated and guest access
app.get('/api/rooms', optionalAuth, (req, res) => {
    try {
        console.log('🏠 [GET /api/rooms] Getting rooms from database...');
        
        // Get all public rooms from database with member counts
        const query = `
            SELECT r.*, 
                   COUNT(rm.user_id) as memberCount,
                   u.username as creator_name
            FROM rooms r
            LEFT JOIN room_members rm ON r.id = rm.room_id
            LEFT JOIN users u ON r.creator_id = u.id
            WHERE r.is_public = 1
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `;
        
        db.all(query, [], (err, rooms) => {
            if (err) {
                console.error('[GET /api/rooms] Database error:', err);
                return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
            }
            
            console.log(`[GET /api/rooms] Found ${rooms.length} public rooms`);
            
            // Process rooms data
            const processedRooms = rooms.map(room => ({
                id: room.id,
                name: room.name,
                description: room.description,
                creator_id: room.creator_id,
                creator_name: room.creator_name || 'Unknown',
                is_public: room.is_public === 1,
                topics: JSON.parse(room.topics || '[]'),
                memberCount: parseInt(room.memberCount) || 0,
                created_at: room.created_at
            }));
            
            console.log(`[GET /api/rooms] ✅ Returning ${processedRooms.length} rooms`);
            res.json({ success: true, rooms: processedRooms });
        });
        
    } catch (error) {
        console.error('[GET /api/rooms] Error:', error);
        res.status(500).json({ success: false, error: 'Server error: ' + error.message });
    }
});

// Room creation endpoint - Requires authentication but with better error handling
app.post('/api/rooms', (req, res) => {
    const startTime = Date.now();
    
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        roomDebug('==> ROOM CREATION ATTEMPT');
        roomDebug('Request from IP: %s', req.ip);
        roomDebug('Auth header present: %s', !!authHeader);
        roomDebug('Request body: %O', req.body);
        
        console.log('[CREATE ROOM] ==> ROOM CREATION ATTEMPT');
        console.log('[CREATE ROOM] Auth header present:', !!authHeader);
        console.log('[CREATE ROOM] Token present:', !!token);
        console.log('[CREATE ROOM] Request body:', req.body);
        
        if (!token) {
            roomDebug.warn('Room creation blocked - no authentication token');
            console.log('[CREATE ROOM] ❌ No authentication token provided');
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required',
                message: 'You must be logged in to create rooms',
                code: 'AUTH_REQUIRED'
            });
        }
        
        // Verify JWT token
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                roomDebug.error('JWT verification failed: %s', err.message);
                console.log('[CREATE ROOM] ❌ JWT verification failed:', err.message);
                return res.status(403).json({ 
                    success: false, 
                    error: 'Invalid or expired token',
                    message: 'Please log in again to create rooms',
                    code: 'AUTH_INVALID',
                    details: err.message
                });
            }
            
            roomDebug('User authenticated - ID: %s, Username: %s', user.userId, user.username);
            console.log('[CREATE ROOM] ✅ User authenticated:', user.username);
            
            const { name, description, topics, is_public } = req.body;
            
            // Get user info from authenticated request
            const userId = user.userId;
            const username = user.username;
        
            roomDebug('Room params - name: "%s", public: %s, topics: %O', name, is_public, topics);
            console.log('[POST /api/rooms] Creating room:', { name, description, topics, is_public, userId, username });
            
            // Validation
            if (!name || name.trim().length === 0) {
                roomDebug.warn('Room creation failed - empty name');
                return res.status(400).json({ success: false, error: 'Room name is required' });
            }
            
            if (name.trim().length > 100) {
                roomDebug.warn('Room creation failed - name too long: %d chars', name.trim().length);
                return res.status(400).json({ success: false, error: 'Room name must be less than 100 characters' });
            }
            
            // Generate unique room ID
            const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
            roomDebug('Generated room ID: %s', roomId);
            
            // Prepare data
            const roomData = {
                id: roomId,
                name: name.trim(),
                description: (description || '').trim(),
                creator_id: userId || 1, // Default to user 1 if no auth
                is_public: is_public !== false, // Default to public
                topics: JSON.stringify(Array.isArray(topics) ? topics : [])
            };
            
            dbDebug('Inserting room into database: %O', roomData);
            console.log('[POST /api/rooms] Room data:', roomData);
            
            db.run(`
                INSERT INTO rooms (id, name, description, creator_id, is_public, topics)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [roomData.id, roomData.name, roomData.description, roomData.creator_id, roomData.is_public ? 1 : 0, roomData.topics], function(err) {
                if (err) {
                    dbDebug.error('Failed to insert room: %O', err);
                    console.error('[POST /api/rooms] Database error:', err);
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        roomDebug.warn('Room creation failed - duplicate name');
                        return res.status(400).json({ success: false, error: 'Room name already exists' });
                    }
                    return res.status(500).json({ success: false, error: 'Database error: ' + err.message });
                }
                
                dbDebug('Room inserted successfully, adding creator as member');
                
                // Automatically add creator as room member and admin (if user is authenticated)
                if (userId) {
                    dbDebug('Adding user %s as admin of room %s', userId, roomData.id);
                    db.run(`
                        INSERT INTO room_members (room_id, user_id, is_admin)
                        VALUES (?, ?, 1)
                    `, [roomData.id, userId], (memberErr) => {
                        if (memberErr) {
                            dbDebug.error('Failed to add creator as member: %O', memberErr);
                            console.error('[POST /api/rooms] Error adding creator as member:', memberErr);
                        } else {
                            dbDebug('Creator added as room admin successfully');
                        }
                    });
                }
                
                const duration = Date.now() - startTime;
                roomDebug('✅ Room "%s" created successfully in %dms', roomData.name, duration);
                console.log(`[POST /api/rooms] ✅ Room "${roomData.name}" created with ID: ${roomData.id}`);
                
                // Return the created room
                const responseRoom = {
                    id: roomData.id,
                    name: roomData.name,
                    description: roomData.description,
                    creator_id: roomData.creator_id,
                    is_public: roomData.is_public,
                    topics: JSON.parse(roomData.topics),
                    memberCount: 1,
                    created_at: new Date().toISOString()
                };
                
                roomDebug('Sending response: %O', responseRoom);
                res.json({ 
                    success: true, 
                    room: responseRoom,
                    message: 'Room created successfully'
                });
            });
        }); // Close JWT verification callback
        
    } catch (error) {
        roomDebug.error('Unexpected error in room creation: %O', error);
        console.error('[POST /api/rooms] Error:', error);
        res.status(500).json({ success: false, error: 'Server error: ' + error.message });
    }
});

// Temporarily removed authentication for room joining to fix 403 errors
// The app uses Supabase auth but backend expects its own JWT tokens
app.post('/api/rooms/:roomId/join', (req, res) => {
    try {
        // Extract user info from token if provided (optional)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        let username = 'Guest';
        
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                username = decoded.username;
            } catch (err) {
                // Token invalid, continue as guest
                console.log('[JOIN ROOM] Invalid token, continuing as guest');
            }
        }
        
        console.log('JOIN ROOM: User', username, 'joining room', req.params.roomId);
        res.json({ 
            success: true, 
            message: `Successfully joined room ${req.params.roomId}`,
            roomId: req.params.roomId
        });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get room members endpoint
app.get('/api/rooms/:roomId/members', (req, res) => {
    try {
        const { roomId } = req.params;
        console.log('[GET ROOM MEMBERS] Room ID:', roomId);
        
        // Mock room members data - in production this would come from database
        const mockMembers = {
            '1': [
                { id: '1', username: 'alice', displayName: 'Alice', status: 'online', avatar: null },
                { id: '2', username: 'bob', displayName: 'Bob', status: 'online', avatar: null },
                { id: '3', username: 'charlie', displayName: 'Charlie', status: 'away', avatar: null },
                { id: '4', username: 'diana', displayName: 'Diana', status: 'offline', avatar: null },
                { id: '5', username: 'eve', displayName: 'Eve', status: 'online', avatar: null }
            ],
            '2': [
                { id: '1', username: 'alice', displayName: 'Alice', status: 'online', avatar: null },
                { id: '6', username: 'frank', displayName: 'Frank', status: 'online', avatar: null },
                { id: '7', username: 'grace', displayName: 'Grace', status: 'away', avatar: null }
            ],
            '3': [
                { id: '2', username: 'bob', displayName: 'Bob', status: 'online', avatar: null },
                { id: '8', username: 'henry', displayName: 'Henry', status: 'online', avatar: null },
                { id: '9', username: 'iris', displayName: 'Iris', status: 'online', avatar: null },
                { id: '10', username: 'jack', displayName: 'Jack', status: 'away', avatar: null }
            ]
        };
        
        const members = mockMembers[roomId] || [];
        
        res.json({ 
            success: true, 
            members,
            roomId,
            totalCount: members.length
        });
    } catch (error) {
        console.error('[GET ROOM MEMBERS] Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get room details endpoint
app.get('/api/rooms/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        console.log('[GET ROOM DETAILS] Room ID:', roomId);
        
        const rooms = {
            '1': { id: '1', name: 'General', description: 'General discussion', memberCount: 5, createdAt: new Date().toISOString() },
            '2': { id: '2', name: 'Tech Talk', description: 'Technology discussions', memberCount: 3, createdAt: new Date().toISOString() },
            '3': { id: '3', name: 'Random', description: 'Random conversations', memberCount: 4, createdAt: new Date().toISOString() }
        };
        
        const room = rooms[roomId];
        
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }
        
        res.json({ success: true, room });
    } catch (error) {
        console.error('[GET ROOM DETAILS] Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Leave room endpoint
app.post('/api/rooms/:roomId/leave', (req, res) => {
    try {
        const { roomId } = req.params;
        console.log('[LEAVE ROOM] Room ID:', roomId);
        
        res.json({ 
            success: true, 
            message: `Successfully left room ${roomId}`,
            roomId
        });
    } catch (error) {
        console.error('[LEAVE ROOM] Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Serve static files from client/dist
const clientDistPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    console.log('✅ Serving static files from:', clientDistPath);
} else {
    console.log('⚠️ Client dist folder not found at:', clientDistPath);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);
    socketDebug('New socket connection: %s from %s', socket.id, socket.handshake.address);
    socketDebug('Socket handshake headers: %O', socket.handshake.headers);
    
    // Handle room joining (matches client expectation)
    socket.on('joinRoom', (roomId) => {
        socketDebug('User %s requesting to join room %s', socket.id, roomId);
        
        // Leave any previous room
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
                socketDebug('User %s left room %s', socket.id, room);
            }
        });
        
        // Join the new room
        socket.join(roomId);
        console.log(`👥 User ${socket.id} joined room ${roomId}`);
        socketDebug('Room %s now has %d members', roomId, io.sockets.adapter.rooms.get(roomId)?.size || 0);
        
        // Get room info
        const roomInfo = {
            id: roomId,
            name: roomId === '1' ? 'General' : roomId === '2' ? 'Tech Talk' : 'Random',
            description: roomId === '1' ? 'General discussion' : roomId === '2' ? 'Technology discussions' : 'Random conversations'
        };
        
        // Send confirmation to the user who joined
        socket.emit('roomJoined', {
            room: roomInfo,
            messages: [], // Empty for now, would load from DB in production
            members: []
        });
        
        // Notify others in the room
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });
    
    // Keep the hyphenated version for backward compatibility
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`👥 User ${socket.id} joined room ${roomId} (legacy)`);
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });
    
    socket.on('send-message', (data) => {
        console.log('💬 Message:', data);
        io.to(data.roomId).emit('receive-message', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 User disconnected:', socket.id);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        service: 'recursion-unified-server',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Catch-all for SPA routing (must be last)
app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return res.status(404).json({ success: false, error: 'API endpoint not found' });
    }
    
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('App not built. Run "npm run build" in the client directory.');
    }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    serverDebug('Server started on port %d', PORT);
    serverDebug('Environment: %s', process.env.NODE_ENV || 'development');
    serverDebug('Debug enabled for: %s', process.env.DEBUG || 'none');
    
    console.log('=======================================================');
    console.log('🚀 RECURSION UNIFIED SERVER STARTED');
    console.log('=======================================================');
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 External access: http://192.168.1.35:${PORT}`);
    console.log('');
    console.log('🎯 Features:');
    console.log('  • Chat App & Socket.IO on port', PORT);
    console.log('  • Design System Persistence');
    console.log('  • Authentication & Room Management');
    console.log('  • Static File Serving');
    console.log('');
    console.log('🔗 Available endpoints:');
    console.log('  • GET  /api/design/config - Load design settings');
    console.log('  • POST /api/design/config - Save design settings');
    console.log('  • POST /api/design/reset - Reset design to defaults');
    console.log('  • POST /api/auth/login - User authentication (legacy)');
    console.log('  • POST /api/auth/signin - Native mobile sign in');
    console.log('  • POST /api/auth/signup - Native mobile sign up');
    console.log('  • POST /api/auth/signout - Sign out user');
    console.log('  • POST /api/auth/refresh - Refresh access token');
    console.log('  • POST /api/auth/biometric - Biometric authentication');
    console.log('  • POST /api/auth/token-exchange - Exchange Supabase tokens for backend tokens');
    console.log('  • GET  /api/auth/user - Get current user data');
    console.log('  • GET  /api/rooms - List available rooms');
    console.log('  • POST /api/rooms - Create new room');
    console.log('  • POST /api/rooms/:id/join - Join a room');
    console.log('  • GET  /api/friends - List friends');
    console.log('  • GET  /api/friends/pending - List pending requests');
    console.log('  • POST /api/friends/request - Send friend request');
    console.log('  • POST /api/friends/accept - Accept friend request');
    console.log('  • POST /api/friends/decline - Decline friend request');
    console.log('  • DELETE /api/friends/:id - Remove friend');
    console.log('  • POST /api/grok - xAI Grok AI assistant proxy');
    console.log('  • GET  /health - Health check');
    console.log('=======================================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Recursion server...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});