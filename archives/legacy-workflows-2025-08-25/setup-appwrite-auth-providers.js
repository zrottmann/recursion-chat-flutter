/**
 * Trading Post - AppWrite Authentication Providers Configuration
 * Configures OAuth providers (Google, GitHub, Facebook) and security settings
 * 
 * Project ID: 689bdaf500072795b0f6
 * Endpoint: https://cloud.appwrite.io/v1
 */

const { Client, Account, Teams } = require('node-appwrite');
require('dotenv').config();

class TradingPostAuthSetup {
    constructor() {
        this.client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID || '689bdaf500072795b0f6')
            .setKey(process.env.APPWRITE_API_KEY);

        this.account = new Account(this.client);
        this.teams = new Teams(this.client);

        this.authConfig = {
            providers: {
                google: {
                    enabled: true,
                    clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
                    clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
                    scopes: ['openid', 'email', 'profile']
                },
                github: {
                    enabled: true,
                    clientId: process.env.OAUTH_GITHUB_CLIENT_ID,
                    clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
                    scopes: ['user:email', 'read:user']
                },
                facebook: {
                    enabled: false, // Can be enabled later
                    appId: process.env.OAUTH_FACEBOOK_APP_ID,
                    appSecret: process.env.OAUTH_FACEBOOK_APP_SECRET,
                    scopes: ['email', 'public_profile']
                }
            },
            security: {
                passwordMinLength: 8,
                passwordHistory: 3,
                maxSessions: 10,
                sessionLength: 604800, // 7 days
                twoFactorEnabled: false,
                emailVerificationRequired: true,
                phoneVerificationRequired: false
            },
            teams: [
                {
                    id: 'admins',
                    name: 'Trading Post Admins',
                    roles: ['admin', 'moderator']
                },
                {
                    id: 'verified_traders',
                    name: 'Verified Traders',
                    roles: ['verified_user']
                },
                {
                    id: 'beta_testers',
                    name: 'Beta Testers',
                    roles: ['beta_user']
                }
            ],
            webhooks: [
                {
                    name: 'User Registration Hook',
                    url: process.env.WEBHOOK_USER_REGISTRATION || 'https://trading-post.example.com/webhooks/user-registration',
                    events: ['users.*.create'],
                    security: true
                },
                {
                    name: 'User Login Hook',
                    url: process.env.WEBHOOK_USER_LOGIN || 'https://trading-post.example.com/webhooks/user-login',
                    events: ['users.*.sessions.*.create'],
                    security: true
                }
            ]
        };
    }

    /**
     * Configure all authentication providers and security settings
     */
    async setupAuthentication() {
        console.log('🔐 Setting up Trading Post Authentication...');
        
        try {
            await this.validateEnvironmentVariables();
            await this.setupOAuthProviders();
            await this.createTeams();
            await this.displayAuthSummary();
            
            console.log('✅ Authentication setup completed successfully!');
            return true;
            
        } catch (error) {
            console.error('❌ Authentication setup failed:', error);
            throw error;
        }
    }

    /**
     * Validate required environment variables
     */
    async validateEnvironmentVariables() {
        console.log('🔍 Validating environment variables...');
        
        const required = [
            'APPWRITE_ENDPOINT',
            'APPWRITE_PROJECT_ID',
            'APPWRITE_API_KEY'
        ];

        const optional = [
            'OAUTH_GOOGLE_CLIENT_ID',
            'OAUTH_GOOGLE_CLIENT_SECRET',
            'OAUTH_GITHUB_CLIENT_ID',
            'OAUTH_GITHUB_CLIENT_SECRET',
            'OAUTH_FACEBOOK_APP_ID',
            'OAUTH_FACEBOOK_APP_SECRET'
        ];

        const missing = required.filter(key => !process.env[key]);
        const missingOptional = optional.filter(key => !process.env[key]);

        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        if (missingOptional.length > 0) {
            console.log(`⚠️  Missing optional OAuth variables: ${missingOptional.join(', ')}`);
            console.log('   Some OAuth providers will be disabled.');
        }

        console.log('✅ Environment variables validated');
    }

    /**
     * Setup OAuth providers (Note: This typically requires manual configuration in AppWrite console)
     */
    async setupOAuthProviders() {
        console.log('\n🌐 OAuth Provider Configuration...');
        
        // Note: AppWrite doesn't provide API endpoints to configure OAuth providers
        // These must be configured manually through the AppWrite console
        // This method provides the configuration details and validation
        
        console.log('📝 OAuth Provider Settings for Manual Configuration:');
        console.log('=' .repeat(60));
        
        if (this.authConfig.providers.google.clientId && this.authConfig.providers.google.clientSecret) {
            console.log('\n🔵 Google OAuth Configuration:');
            console.log(`   Client ID: ${this.authConfig.providers.google.clientId}`);
            console.log(`   Client Secret: ${this.hideSecret(this.authConfig.providers.google.clientSecret)}`);
            console.log(`   Scopes: ${this.authConfig.providers.google.scopes.join(', ')}`);
            console.log(`   Redirect URI: ${this.client.config.endpoint}/auth/oauth2/success`);
            console.log('   ✅ Google OAuth credentials available');
        } else {
            console.log('\n🔵 Google OAuth: ❌ Missing credentials');
        }

        if (this.authConfig.providers.github.clientId && this.authConfig.providers.github.clientSecret) {
            console.log('\n⚫ GitHub OAuth Configuration:');
            console.log(`   Client ID: ${this.authConfig.providers.github.clientId}`);
            console.log(`   Client Secret: ${this.hideSecret(this.authConfig.providers.github.clientSecret)}`);
            console.log(`   Scopes: ${this.authConfig.providers.github.scopes.join(', ')}`);
            console.log(`   Authorization Callback URL: ${this.client.config.endpoint}/auth/oauth2/success`);
            console.log('   ✅ GitHub OAuth credentials available');
        } else {
            console.log('\n⚫ GitHub OAuth: ❌ Missing credentials');
        }

        if (this.authConfig.providers.facebook.appId && this.authConfig.providers.facebook.appSecret) {
            console.log('\n🔵 Facebook OAuth Configuration:');
            console.log(`   App ID: ${this.authConfig.providers.facebook.appId}`);
            console.log(`   App Secret: ${this.hideSecret(this.authConfig.providers.facebook.appSecret)}`);
            console.log(`   Scopes: ${this.authConfig.providers.facebook.scopes.join(', ')}`);
            console.log(`   Valid OAuth Redirect URIs: ${this.client.config.endpoint}/auth/oauth2/success`);
            console.log('   ⚠️  Facebook OAuth disabled by default');
        } else {
            console.log('\n🔵 Facebook OAuth: ❌ Missing credentials');
        }

        console.log('\n📋 Manual Steps Required:');
        console.log('1. Go to AppWrite Console > Auth > Settings');
        console.log('2. Configure each OAuth provider with the credentials above');
        console.log('3. Set the appropriate redirect URIs in each provider console');
        console.log('4. Test OAuth login flows');
    }

    /**
     * Create user teams and roles
     */
    async createTeams() {
        console.log('\n👥 Creating user teams...');
        
        for (const teamConfig of this.authConfig.teams) {
            await this.createTeam(teamConfig);
        }
    }

    /**
     * Create individual team
     */
    async createTeam(config) {
        try {
            const team = await this.teams.create(
                config.id,
                config.name,
                config.roles
            );
            console.log(`✅ Team created: ${team.name} (${team.$id})`);
            
        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠️  Team ${config.name} already exists`);
            } else {
                console.error(`❌ Error creating team ${config.name}:`, error.message);
            }
        }
    }

    /**
     * Generate secure configuration templates
     */
    generateConfigTemplates() {
        console.log('\n📄 Configuration Templates Generated:');
        
        // Environment variables template
        const envTemplate = `# AppWrite Trading Post Configuration
# Copy this to your .env file

# AppWrite Configuration
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=689bdaf500072795b0f6
APPWRITE_API_KEY=your_api_key_here
APPWRITE_DATABASE_ID=trading_post_main

# OAuth Provider Credentials
# Google OAuth (Get from Google Cloud Console)
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (Get from GitHub Developer Settings)
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret

# Facebook OAuth (Optional - Get from Facebook Developers)
OAUTH_FACEBOOK_APP_ID=your_facebook_app_id
OAUTH_FACEBOOK_APP_SECRET=your_facebook_app_secret

# Webhook URLs
WEBHOOK_USER_REGISTRATION=https://your-domain.com/webhooks/user-registration
WEBHOOK_USER_LOGIN=https://your-domain.com/webhooks/user-login

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_email_password
`;

        return {
            envTemplate,
            authConfig: this.authConfig
        };
    }

    /**
     * Display authentication summary
     */
    async displayAuthSummary() {
        console.log('\n📊 Authentication Configuration Summary');
        console.log('=' .repeat(50));
        
        console.log('\n🔐 Security Settings:');
        console.log(`   Password Min Length: ${this.authConfig.security.passwordMinLength}`);
        console.log(`   Max Sessions: ${this.authConfig.security.maxSessions}`);
        console.log(`   Session Length: ${this.authConfig.security.sessionLength / 3600} hours`);
        console.log(`   Email Verification: ${this.authConfig.security.emailVerificationRequired ? '✅ Required' : '❌ Optional'}`);
        
        console.log('\n👥 Teams:');
        this.authConfig.teams.forEach(team => {
            console.log(`   • ${team.name} (${team.roles.join(', ')})`);
        });
        
        console.log('\n🌐 OAuth Providers Status:');
        Object.entries(this.authConfig.providers).forEach(([name, config]) => {
            const status = config.enabled ? '✅ Enabled' : '❌ Disabled';
            const hasCredentials = config.clientId && (config.clientSecret || config.appSecret) ? '🔑 Configured' : '⚠️  Missing Credentials';
            console.log(`   • ${name.charAt(0).toUpperCase() + name.slice(1)}: ${status} ${hasCredentials}`);
        });
    }

    /**
     * Test authentication configuration
     */
    async testAuthConfiguration() {
        console.log('\n🧪 Testing authentication configuration...');
        
        try {
            // Test account service connection
            const account = await this.account.get();
            console.log('✅ Account service connection successful');
            
            // List teams
            const teams = await this.teams.list();
            console.log(`✅ Teams service connection successful (${teams.total} teams)`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Authentication test failed:', error.message);
            return false;
        }
    }

    /**
     * Hide sensitive information for display
     */
    hideSecret(secret) {
        if (!secret) return 'NOT_SET';
        return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
    }

    /**
     * Generate OAuth setup instructions
     */
    generateOAuthInstructions() {
        return `
# OAuth Provider Setup Instructions

## Google OAuth Setup
1. Go to Google Cloud Console (https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Set Application type to "Web application"
6. Add Authorized redirect URIs:
   - ${this.client.config.endpoint}/auth/oauth2/success
   - http://localhost:3000/auth/oauth2/success (for development)

## GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in application details
4. Set Authorization callback URL to:
   - ${this.client.config.endpoint}/auth/oauth2/success

## Facebook OAuth Setup
1. Go to Facebook Developers (https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Set Valid OAuth Redirect URIs:
   - ${this.client.config.endpoint}/auth/oauth2/success

## AppWrite Console Configuration
1. Open AppWrite Console
2. Go to Auth > Settings
3. Configure each OAuth provider with the credentials
4. Test the login flows
        `;
    }
}

// Export class
module.exports = TradingPostAuthSetup;

// CLI execution
if (require.main === module) {
    const authSetup = new TradingPostAuthSetup();
    
    const command = process.argv[2] || 'setup';
    
    switch (command) {
        case 'test':
            authSetup.testAuthConfiguration()
                .then(success => process.exit(success ? 0 : 1))
                .catch(() => process.exit(1));
            break;
        case 'templates': {
            const templates = authSetup.generateConfigTemplates();
            console.log(templates.envTemplate);
            break;
        }
        case 'instructions':
            console.log(authSetup.generateOAuthInstructions());
            break;
        case 'setup':
        default:
            authSetup.setupAuthentication()
                .then(() => {
                    console.log('\n🎉 Authentication setup completed!');
                    console.log('📋 Next steps: Configure OAuth providers in AppWrite console');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('\n💥 Authentication setup failed:', error.message);
                    process.exit(1);
                });
            break;
    }
}