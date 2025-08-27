// Security Manager for Remote Claude Code Access
// Handles authentication, authorization, and security for remote agent communication

import { createHash, createHmac, randomBytes } from 'crypto';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { EventEmitter } from 'events';

export interface SecurityConfig {
  jwtSecret: string;
  apiKeyPrefix: string;
  maxTokenAge: number;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  allowedOrigins: string[];
  requireApiKey: boolean;
  encryptCommunication: boolean;
}

export interface AuthenticatedAgent {
  id: string;
  apiKey: string;
  name: string;
  permissions: string[];
  ipAddress: string;
  lastAccess: Date;
  tokenHash: string;
  rateLimitWindow: Map<string, number>;
}

export interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'token_expired';
  agentId?: string;
  ipAddress: string;
  timestamp: Date;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private authenticatedAgents: Map<string, AuthenticatedAgent> = new Map();
  private apiKeys: Map<string, AuthenticatedAgent> = new Map();
  private rateLimitTracking: Map<string, Map<string, number[]>> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();

  constructor(config: Partial<SecurityConfig> = {}) {
    super();
    
    this.config = {
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || this.generateSecureSecret(),
      apiKeyPrefix: config.apiKeyPrefix || 'claude_',
      maxTokenAge: config.maxTokenAge || 24 * 60 * 60 * 1000, // 24 hours
      rateLimits: {
        requestsPerMinute: config.rateLimits?.requestsPerMinute || 100,
        requestsPerHour: config.rateLimits?.requestsPerHour || 1000
      },
      allowedOrigins: config.allowedOrigins || ['localhost', '127.0.0.1'],
      requireApiKey: config.requireApiKey ?? true,
      encryptCommunication: config.encryptCommunication ?? true
    };

    this.startSecurityMonitoring();
  }

  // Generate API key for new agent
  async generateApiKey(agentInfo: {
    name: string;
    permissions: string[];
    ipAddress: string;
  }): Promise<{ agentId: string; apiKey: string; token: string }> {
    const agentId = this.generateId();
    const apiKey = `${this.config.apiKeyPrefix}${randomBytes(32).toString('hex')}`;
    
    const agent: AuthenticatedAgent = {
      id: agentId,
      apiKey: this.hashApiKey(apiKey),
      name: agentInfo.name,
      permissions: agentInfo.permissions,
      ipAddress: agentInfo.ipAddress,
      lastAccess: new Date(),
      tokenHash: '',
      rateLimitWindow: new Map()
    };

    // Generate JWT token
    const token = this.generateJWT(agentId, agentInfo.permissions);
    agent.tokenHash = this.hashToken(token);

    this.apiKeys.set(agent.apiKey, agent);
    this.authenticatedAgents.set(agentId, agent);

    this.logSecurityEvent({
      type: 'auth_success',
      agentId,
      ipAddress: agentInfo.ipAddress,
      timestamp: new Date(),
      details: { action: 'api_key_generated', agentName: agentInfo.name },
      severity: 'low'
    });

    return { agentId, apiKey, token };
  }

  // Authenticate agent by API key
  async authenticateAgent(apiKey: string, ipAddress: string): Promise<AuthenticatedAgent | null> {
    const hashedApiKey = this.hashApiKey(apiKey);
    const agent = this.apiKeys.get(hashedApiKey);

    if (!agent) {
      this.logSecurityEvent({
        type: 'auth_failure',
        ipAddress,
        timestamp: new Date(),
        details: { reason: 'invalid_api_key', apiKeyPrefix: apiKey.substring(0, 10) },
        severity: 'medium'
      });
      return null;
    }

    // Check if IP is blocked
    if (this.blockedIPs.has(ipAddress)) {
      this.logSecurityEvent({
        type: 'auth_failure',
        agentId: agent.id,
        ipAddress,
        timestamp: new Date(),
        details: { reason: 'blocked_ip' },
        severity: 'high'
      });
      return null;
    }

    // Check rate limits
    if (!this.checkRateLimit(agent.id, ipAddress)) {
      this.logSecurityEvent({
        type: 'rate_limit',
        agentId: agent.id,
        ipAddress,
        timestamp: new Date(),
        details: { limits: this.config.rateLimits },
        severity: 'medium'
      });
      return null;
    }

    // Update last access
    agent.lastAccess = new Date();
    agent.ipAddress = ipAddress;
    this.authenticatedAgents.set(agent.id, agent);

    return agent;
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<{ agentId: string; permissions: string[] } | null> {
    try {
      const decoded = verify(token, this.config.jwtSecret) as JwtPayload;
      
      if (!decoded.agentId || !decoded.permissions) {
        return null;
      }

      // Check if agent exists and token hash matches
      const agent = this.authenticatedAgents.get(decoded.agentId);
      if (!agent || agent.tokenHash !== this.hashToken(token)) {
        return null;
      }

      // Check token age
      const tokenAge = Date.now() - (decoded.iat! * 1000);
      if (tokenAge > this.config.maxTokenAge) {
        this.logSecurityEvent({
          type: 'token_expired',
          agentId: decoded.agentId,
          ipAddress: agent.ipAddress,
          timestamp: new Date(),
          details: { tokenAge, maxAge: this.config.maxTokenAge },
          severity: 'low'
        });
        return null;
      }

      return {
        agentId: decoded.agentId,
        permissions: decoded.permissions
      };

    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  // Check if agent has required permission
  hasPermission(agentId: string, requiredPermission: string): boolean {
    const agent = this.authenticatedAgents.get(agentId);
    if (!agent) return false;

    return agent.permissions.includes(requiredPermission) || 
           agent.permissions.includes('admin');
  }

  // Validate WebSocket connection
  async validateWebSocketConnection(
    request: any,
    apiKey?: string,
    token?: string
  ): Promise<{ valid: boolean; agentId?: string; reason?: string }> {
    const ipAddress = request.socket.remoteAddress;

    // Check origin if specified
    const origin = request.headers.origin;
    if (origin && !this.isAllowedOrigin(origin)) {
      return { valid: false, reason: 'invalid_origin' };
    }

    // Check if IP is blocked
    if (this.blockedIPs.has(ipAddress)) {
      return { valid: false, reason: 'blocked_ip' };
    }

    // Authenticate via API key or token
    let agentId: string | undefined;

    if (apiKey) {
      const agent = await this.authenticateAgent(apiKey, ipAddress);
      if (!agent) {
        return { valid: false, reason: 'invalid_api_key' };
      }
      agentId = agent.id;
    } else if (token) {
      const tokenInfo = await this.verifyToken(token);
      if (!tokenInfo) {
        return { valid: false, reason: 'invalid_token' };
      }
      agentId = tokenInfo.agentId;
    } else if (this.config.requireApiKey) {
      return { valid: false, reason: 'missing_credentials' };
    }

    return { valid: true, agentId };
  }

  // Check rate limits
  private checkRateLimit(agentId: string, ipAddress: string): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    // Track by both agent ID and IP address
    const keys = [agentId, ipAddress];

    for (const key of keys) {
      if (!this.rateLimitTracking.has(key)) {
        this.rateLimitTracking.set(key, new Map());
      }

      const tracking = this.rateLimitTracking.get(key)!;

      // Get or create minute and hour tracking arrays
      const minuteKey = Math.floor(now / oneMinute).toString();
      const hourKey = Math.floor(now / oneHour).toString();

      const minuteRequests = tracking.get(minuteKey) || [];
      const hourRequests = tracking.get(hourKey) || [];

      // Check limits
      if (minuteRequests.length >= this.config.rateLimits.requestsPerMinute) {
        return false;
      }
      if (hourRequests.length >= this.config.rateLimits.requestsPerHour) {
        return false;
      }

      // Add current request
      minuteRequests.push(now);
      hourRequests.push(now);

      tracking.set(minuteKey, minuteRequests);
      tracking.set(hourKey, hourRequests);

      // Cleanup old entries
      this.cleanupRateLimitTracking(tracking, now);
    }

    return true;
  }

  // Clean up old rate limit tracking data
  private cleanupRateLimitTracking(tracking: Map<string, number[]>, now: number) {
    const oneHour = 60 * 60 * 1000;
    const cutoff = now - oneHour;

    for (const [key, requests] of tracking) {
      const filtered = requests.filter(timestamp => timestamp > cutoff);
      if (filtered.length === 0) {
        tracking.delete(key);
      } else {
        tracking.set(key, filtered);
      }
    }
  }

  // Check if origin is allowed
  private isAllowedOrigin(origin: string): boolean {
    const url = new URL(origin);
    return this.config.allowedOrigins.some(allowed => {
      return url.hostname === allowed || 
             url.hostname.endsWith(`.${allowed}`);
    });
  }

  // Generate JWT token
  private generateJWT(agentId: string, permissions: string[]): string {
    return sign(
      { 
        agentId, 
        permissions,
        iat: Math.floor(Date.now() / 1000)
      },
      this.config.jwtSecret,
      { 
        expiresIn: '1h'
      }
    );
  }

  // Hash API key for storage
  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  // Hash token for verification
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Generate secure secret
  private generateSecureSecret(): string {
    return randomBytes(64).toString('hex');
  }

  // Generate unique ID
  private generateId(): string {
    return `agent_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  // Log security event
  private logSecurityEvent(event: SecurityEvent) {
    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift();
    }

    this.emit('securityEvent', event);

    // Auto-block IPs with too many failed attempts
    if (event.type === 'auth_failure') {
      this.handleAuthFailure(event.ipAddress);
    }

    console.log(`[SECURITY] ${event.type.toUpperCase()}: ${JSON.stringify(event)}`);
  }

  // Handle authentication failures
  private handleAuthFailure(ipAddress: string) {
    const recentFailures = this.securityEvents
      .filter(event => 
        event.type === 'auth_failure' && 
        event.ipAddress === ipAddress &&
        Date.now() - event.timestamp.getTime() < 15 * 60 * 1000 // 15 minutes
      );

    if (recentFailures.length >= 5) {
      this.blockedIPs.add(ipAddress);
      
      this.logSecurityEvent({
        type: 'suspicious_activity',
        ipAddress,
        timestamp: new Date(),
        details: { 
          reason: 'multiple_auth_failures', 
          failureCount: recentFailures.length,
          action: 'ip_blocked'
        },
        severity: 'critical'
      });

      // Auto-unblock after 1 hour
      setTimeout(() => {
        this.blockedIPs.delete(ipAddress);
        console.log(`[SECURITY] IP ${ipAddress} unblocked after timeout`);
      }, 60 * 60 * 1000);
    }
  }

  // Start security monitoring
  private startSecurityMonitoring() {
    // Periodic security checks
    setInterval(() => {
      this.performSecurityChecks();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Emit security statistics
    setInterval(() => {
      this.emit('securityStats', this.getSecurityStats());
    }, 60 * 1000); // Every minute
  }

  // Perform periodic security checks
  private performSecurityChecks() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for stale agents
    for (const [agentId, agent] of this.authenticatedAgents) {
      if (agent.lastAccess < oneDayAgo) {
        this.logSecurityEvent({
          type: 'suspicious_activity',
          agentId,
          ipAddress: agent.ipAddress,
          timestamp: now,
          details: { reason: 'stale_agent', lastAccess: agent.lastAccess },
          severity: 'low'
        });
      }
    }

    // Rotate JWT secret daily
    if (Math.random() < 0.001) { // Small chance each check
      this.rotateJWTSecret();
    }
  }

  // Rotate JWT secret
  private rotateJWTSecret() {
    const oldSecret = this.config.jwtSecret;
    this.config.jwtSecret = this.generateSecureSecret();
    
    this.logSecurityEvent({
      type: 'suspicious_activity',
      ipAddress: 'system',
      timestamp: new Date(),
      details: { reason: 'jwt_secret_rotated' },
      severity: 'low'
    });

    console.log('[SECURITY] JWT secret rotated');
  }

  // Get security statistics
  getSecurityStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    const recentEvents = this.securityEvents.filter(
      event => now - event.timestamp.getTime() < oneHour
    );

    const dailyEvents = this.securityEvents.filter(
      event => now - event.timestamp.getTime() < oneDay
    );

    return {
      authenticatedAgents: this.authenticatedAgents.size,
      blockedIPs: this.blockedIPs.size,
      recentEvents: {
        total: recentEvents.length,
        authFailures: recentEvents.filter(e => e.type === 'auth_failure').length,
        rateLimits: recentEvents.filter(e => e.type === 'rate_limit').length,
        suspicious: recentEvents.filter(e => e.type === 'suspicious_activity').length
      },
      dailyEvents: {
        total: dailyEvents.length,
        authFailures: dailyEvents.filter(e => e.type === 'auth_failure').length,
        rateLimits: dailyEvents.filter(e => e.type === 'rate_limit').length
      },
      rateLimitConfig: this.config.rateLimits,
      timestamp: new Date().toISOString()
    };
  }

  // Get security events
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Manually block/unblock IP
  blockIP(ipAddress: string, reason: string = 'manual') {
    this.blockedIPs.add(ipAddress);
    this.logSecurityEvent({
      type: 'suspicious_activity',
      ipAddress,
      timestamp: new Date(),
      details: { reason: `manual_block: ${reason}` },
      severity: 'high'
    });
  }

  unblockIP(ipAddress: string) {
    this.blockedIPs.delete(ipAddress);
    console.log(`[SECURITY] IP ${ipAddress} manually unblocked`);
  }

  // Revoke agent access
  revokeAgent(agentId: string, reason: string = 'manual_revocation') {
    const agent = this.authenticatedAgents.get(agentId);
    if (agent) {
      this.authenticatedAgents.delete(agentId);
      this.apiKeys.delete(agent.apiKey);
      
      this.logSecurityEvent({
        type: 'suspicious_activity',
        agentId,
        ipAddress: agent.ipAddress,
        timestamp: new Date(),
        details: { reason },
        severity: 'medium'
      });
    }
  }

  // Update security configuration
  updateConfig(newConfig: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();