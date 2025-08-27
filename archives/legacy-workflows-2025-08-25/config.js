/**
 * Dynamic configuration for Trading Post frontend
 * Automatically detects internal vs external access
 */

class TradingPostConfig {
    constructor() {
        this.isInitialized = false;
        this.config = {
            apiUrl: '',
            frontendUrl: '',
            isInternal: true,
            features: {}
        };
    }

    async initialize() {
        try {
            // Try to fetch configuration from backend
            const response = await fetch('/api/config');
            if (response.ok) {
                this.config = await response.json();
                this.isInitialized = true;
                console.log('Loaded configuration from backend:', this.config);
                return;
            }
        } catch (error) {
            console.warn('Could not fetch config from backend:', error);
        }

        // Fallback to auto-detection
        this.autoDetectConfig();
        this.isInitialized = true;
    }

    autoDetectConfig() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Check if accessing from internal network
        const isInternal = this.isInternalHostname(hostname);
        
        if (isInternal) {
            // Internal network access
            this.config = {
                apiUrl: `${protocol}//${hostname}:8000`,
                frontendUrl: `${protocol}//${hostname}:3000`,
                isInternal: true,
                features: {
                    websocket: true,
                    fileUpload: true,
                    maxFileSize: 10485760
                }
            };
        } else {
            // External access through Cloudflare
            this.config = {
                apiUrl: `${protocol}//${hostname}/api`,
                frontendUrl: `${protocol}//${hostname}`,
                isInternal: false,
                features: {
                    websocket: false, // WebSocket might not work through Cloudflare
                    fileUpload: true,
                    maxFileSize: 10485760
                }
            };
        }
        
        console.log('Auto-detected configuration:', this.config);
    }

    isInternalHostname(hostname) {
        // Check for internal hostnames
        const internalPatterns = [
            'localhost',
            '127.0.0.1',
            /^192\.168\.\d+\.\d+$/,
            /^10\.\d+\.\d+\.\d+$/,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
            /\.local$/,
            /\.lan$/
        ];

        return internalPatterns.some(pattern => {
            if (typeof pattern === 'string') {
                return hostname === pattern;
            }
            return pattern.test(hostname);
        });
    }

    getApiUrl(endpoint = '') {
        if (!this.isInitialized) {
            console.warn('Config not initialized, using default');
            return `http://localhost:8000${endpoint}`;
        }
        return `${this.config.apiUrl}${endpoint}`;
    }

    getFrontendUrl(path = '') {
        if (!this.isInitialized) {
            console.warn('Config not initialized, using default');
            return `http://localhost:3000${path}`;
        }
        return `${this.config.frontendUrl}${path}`;
    }

    isFeatureEnabled(feature) {
        return this.config.features[feature] || false;
    }

    getMaxFileSize() {
        return this.config.features.maxFileSize || 5242880; // 5MB default
    }

    isInternalAccess() {
        return this.config.isInternal;
    }
}

// Create global instance
const tradingPostConfig = new TradingPostConfig();

// Auto-initialize on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        tradingPostConfig.initialize().catch(console.error);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tradingPostConfig;
}