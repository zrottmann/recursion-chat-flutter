const sdk = require('node-appwrite');

/**
 * MOBILE-SAFE Super Site Function - ZERO External Dependencies
 * Fixes critical mobile white screen issue caused by CDN failures
 * Bulletproof version with inline CSS and progressive enhancement
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    // Log incoming request for debugging
    log(`🚀 Mobile-Safe Super Site Function Called: ${req.method} ${req.path || '/'}`);
    log(`User-Agent: ${req.headers['user-agent'] || 'Unknown'}`);
    
    const currentPath = req.path || '/';
    const timestamp = new Date().toISOString();
    
    log(`Processing route: ${currentPath} at ${timestamp}`);
    
    // BULLETPROOF HTML - ENHANCED VISUAL CONSOLE
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#0f0f23">
    <title>Enhanced Console - Appwrite Grok</title>
    <style>
        /* ENHANCED GLASSMORPHIC CONSOLE - NO EXTERNAL DEPENDENCIES */
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, system-ui, sans-serif;
            background: #0f0f23;
            min-height: 100vh;
            padding: 15px;
            line-height: 1.6;
            color: #ffffff;
            overflow-x: hidden;
            position: relative;
        }

        /* ANIMATED PARTICLE BACKGROUND */
        .particle-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            opacity: 0.6;
        }

        /* NEURAL NETWORK BACKGROUND ANIMATION */
        .neural-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
            animation: neuralShift 20s ease-in-out infinite alternate;
            z-index: 0;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding-top: 20px;
            position: relative;
            z-index: 10;
        }
        
        /* GLASSMORPHIC CONSOLE CARDS */
        .main-card {
            background: rgba(15, 15, 35, 0.95);
            backdrop-filter: blur(20px) saturate(180%);
            border-radius: 24px;
            padding: 40px;
            margin-bottom: 25px;
            box-shadow: 
                0 20px 60px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.2);
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .main-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 
                0 32px 80px rgba(102, 126, 234, 0.3),
                0 0 0 1px rgba(102, 126, 234, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
            border-color: rgba(102, 126, 234, 0.4);
        }

        .main-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent);
            animation: shimmer 3s ease-in-out infinite;
        }
        
        h1 {
            font-size: clamp(2.2em, 5vw, 3.5em);
            font-weight: 300;
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(135deg, #ffffff 0%, #667eea 50%, #ffffff 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 300% 300%;
            animation: gradientShift 4s ease-in-out infinite, glow 3s ease-in-out infinite alternate;
            letter-spacing: -0.02em;
            position: relative;
        }

        h1::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent);
            border-radius: 2px;
        }
        
        .status-success {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.25));
            color: #22c55e;
            padding: 24px 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 500;
            font-size: 1.1em;
            border: 1px solid rgba(34, 197, 94, 0.3);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
        }

        .status-success::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
            animation: statusSlide 2s ease-in-out infinite;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin: 35px 0;
            padding: 0 5px;
        }
        
        .feature-card {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 28px 24px;
            text-align: center;
            border: 1px solid rgba(102, 126, 234, 0.15);
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            cursor: pointer;
        }

        .feature-card:hover {
            transform: translateY(-4px);
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.08));
            border-color: rgba(102, 126, 234, 0.3);
            box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
        }

        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }

        .feature-card:hover::before {
            transform: scaleX(1);
        }
        
        .feature-icon {
            font-size: 3.2em;
            margin-bottom: 16px;
            display: block;
            filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
            animation: float 3s ease-in-out infinite;
        }

        .feature-card:nth-child(2n) .feature-icon {
            animation-delay: -1s;
        }
        
        .feature-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 1.15em;
            color: #ffffff;
        }
        
        .feature-desc {
            font-size: 0.9em;
            opacity: 0.75;
            line-height: 1.4;
            color: #e2e8f0;
        }
        
        .api-section {
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(15, 15, 35, 0.7));
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 32px;
            margin: 35px 0;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
            border: 1px solid rgba(59, 130, 246, 0.2);
            position: relative;
            overflow: hidden;
        }

        .api-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.6), transparent);
        }
        
        .api-title {
            color: #60a5fa;
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .api-title::before {
            content: '●';
            color: #22c55e;
            animation: pulse 2s ease-in-out infinite;
        }
        
        .api-endpoint {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1));
            color: #93c5fd;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 16px;
            font-size: 0.9em;
            word-break: break-all;
            border: 1px solid rgba(59, 130, 246, 0.2);
            position: relative;
            transition: all 0.2s ease;
        }

        .api-endpoint:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.15));
            transform: translateY(-1px);
        }
        
        .api-body {
            background: linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.3));
            color: #e5e7eb;
            padding: 18px 20px;
            border-radius: 12px;
            font-size: 0.85em;
            border: 1px solid rgba(75, 85, 99, 0.3);
            line-height: 1.4;
            position: relative;
        }

        .api-body::before {
            content: '{ }';
            position: absolute;
            top: 8px;
            right: 12px;
            font-size: 0.7em;
            color: rgba(156, 163, 175, 0.5);
        }
        
        .status-info {
            background: rgba(251, 191, 36, 0.2);
            color: #f59e0b;
            padding: 15px;
            border-radius: 12px;
            margin-top: 25px;
            font-size: 0.9em;
        }
        
        .status-time {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .status-details {
            opacity: 0.8;
            font-size: 0.85em;
        }
        
        /* ENHANCED ANIMATIONS */
        @keyframes glow {
            0% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.3); }
            100% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.6), 0 0 40px rgba(102, 126, 234, 0.4); }
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        @keyframes neuralShift {
            0% {
                background: radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
            }
            100% {
                background: radial-gradient(circle at 80% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 20% 80%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 60% 60%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
            }
        }

        @keyframes shimmer {
            0% { opacity: 0; transform: translateX(-100%); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: translateX(100%); }
        }

        @keyframes statusSlide {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        .pulse { animation: pulse 2s ease-in-out infinite; }
        
        /* MOBILE RESPONSIVE - CRITICAL */
        @media (max-width: 768px) {
            body { padding: 10px; }
            .container { padding-top: 10px; }
            .main-card { padding: 20px; border-radius: 15px; }
            h1 { font-size: 2em; margin-bottom: 20px; }
            .feature-grid { grid-template-columns: 1fr; gap: 15px; }
            .feature-card { padding: 15px; }
            .feature-icon { font-size: 2.5em; }
            .api-section { padding: 20px; font-size: 0.9em; }
            .status-success { padding: 15px; font-size: 1.1em; }
        }
        
        @media (max-width: 480px) {
            body { padding: 8px; }
            .main-card { padding: 15px; }
            h1 { font-size: 1.8em; }
            .feature-icon { font-size: 2em; }
            .api-section { padding: 15px; }
        }
    </style>
</head>
<body>
    <!-- ANIMATED BACKGROUND LAYERS -->
    <div class="neural-bg"></div>
    <canvas class="particle-canvas" id="particleCanvas"></canvas>
    
    <div class="container">
        <div class="main-card">
            <h1>⚡ Enhanced Console Dashboard</h1>
            
            <div class="status-success pulse">
                ✨ Advanced Visual System Active
            </div>
            
            <div class="feature-grid">
                <div class="feature-card">
                    <span class="feature-icon">🚀</span>
                    <div class="feature-title">Neural Interface</div>
                    <div class="feature-desc">Advanced particle systems with real-time rendering</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🧠</span>
                    <div class="feature-title">Grok Intelligence</div>
                    <div class="feature-desc">xAI-powered analysis with contextual understanding</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🎨</span>
                    <div class="feature-title">Glassmorphic UI</div>
                    <div class="feature-desc">Professional design with blur effects and gradients</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">⚡</span>
                    <div class="feature-title">Performance</div>
                    <div class="feature-desc">Optimized animations with 60fps rendering</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">🔊</span>
                    <div class="feature-title">Audio Feedback</div>
                    <div class="feature-desc">Immersive sound design for interactions</div>
                </div>
                <div class="feature-card">
                    <span class="feature-icon">📱</span>
                    <div class="feature-title">Responsive</div>
                    <div class="feature-desc">Perfect scaling across all device sizes</div>
                </div>
            </div>
            
            <div class="api-section">
                <div class="api-title">🔗 API Endpoint</div>
                <div class="api-endpoint">
                    POST https://nyc.cloud.appwrite.io/v1/functions/grok-api/executions
                </div>
                <div class="api-body">
                    {"async": false, "body": "{\\"prompt\\": \\"Your question here\\"}"}
                </div>
            </div>
            
            <div class="status-info">
                <div class="status-time">⚡ Function Status: ACTIVE</div>
                <div class="status-details">
                    Loaded: ${new Date().toLocaleString()}<br>
                    Route: ${currentPath} | Method: ${req.method}<br>
                    Mobile-Safe: v2.0 | Zero Dependencies
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // ENHANCED CONSOLE - PARTICLE SYSTEM & AUDIO FEEDBACK
        console.log('⚡ Enhanced Console Dashboard loaded successfully!');
        console.log('Current path:', '${currentPath}');
        console.log('Load time:', Date.now());
        console.log('User agent:', navigator.userAgent);
        console.log('Screen size:', window.innerWidth + 'x' + window.innerHeight);

        // PARTICLE SYSTEM IMPLEMENTATION
        class ParticleSystem {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.particles = [];
                this.mouse = { x: 0, y: 0 };
                this.init();
                this.bindEvents();
            }

            init() {
                this.resize();
                this.createParticles();
                this.animate();
            }

            resize() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }

            createParticles() {
                const count = Math.floor((window.innerWidth * window.innerHeight) / 15000);
                for (let i = 0; i < count; i++) {
                    this.particles.push({
                        x: Math.random() * this.canvas.width,
                        y: Math.random() * this.canvas.height,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        size: Math.random() * 2 + 1,
                        alpha: Math.random() * 0.5 + 0.2,
                        connections: []
                    });
                }
            }

            drawParticles() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw connections
                this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
                this.ctx.lineWidth = 0.5;
                
                for (let i = 0; i < this.particles.length; i++) {
                    const particle = this.particles[i];
                    
                    for (let j = i + 1; j < this.particles.length; j++) {
                        const other = this.particles[j];
                        const dx = particle.x - other.x;
                        const dy = particle.y - other.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 100) {
                            const opacity = (1 - distance / 100) * 0.5;
                            this.ctx.globalAlpha = opacity;
                            this.ctx.beginPath();
                            this.ctx.moveTo(particle.x, particle.y);
                            this.ctx.lineTo(other.x, other.y);
                            this.ctx.stroke();
                        }
                    }
                }
                
                // Draw particles
                this.particles.forEach(particle => {
                    this.ctx.globalAlpha = particle.alpha;
                    this.ctx.fillStyle = '#667eea';
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Update position
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // Boundary check
                    if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
                });
                
                this.ctx.globalAlpha = 1;
            }

            animate() {
                this.drawParticles();
                requestAnimationFrame(() => this.animate());
            }

            bindEvents() {
                window.addEventListener('resize', () => this.resize());
                
                document.addEventListener('mousemove', (e) => {
                    this.mouse.x = e.clientX;
                    this.mouse.y = e.clientY;
                    
                    // Add mouse interaction particles
                    if (Math.random() < 0.1) {
                        this.particles.push({
                            x: e.clientX + (Math.random() - 0.5) * 20,
                            y: e.clientY + (Math.random() - 0.5) * 20,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                            size: Math.random() * 3 + 1,
                            alpha: 0.8,
                            life: 60
                        });
                    }
                });
            }
        }

        // AUDIO FEEDBACK SYSTEM
        class AudioFeedback {
            constructor() {
                this.audioContext = null;
                this.enabled = false;
                this.init();
            }

            async init() {
                try {
                    // Initialize on user interaction
                    document.addEventListener('click', () => this.enable(), { once: true });
                } catch (e) {
                    console.log('Audio not supported');
                }
            }

            async enable() {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this.enabled = true;
                    console.log('🔊 Audio feedback enabled');
                }
            }

            playTone(frequency = 440, duration = 100, type = 'sine') {
                if (!this.enabled || !this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = type;
                
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration / 1000);
            }

            hover() { this.playTone(800, 50, 'sine'); }
            click() { this.playTone(1200, 80, 'square'); }
            success() { this.playTone(660, 200, 'sine'); }
        }

        // INITIALIZE SYSTEMS
        let particleSystem, audioSystem;

        window.addEventListener('load', function() {
            console.log('✨ Initializing enhanced visual systems...');
            
            // Initialize particle system
            const canvas = document.getElementById('particleCanvas');
            if (canvas) {
                particleSystem = new ParticleSystem(canvas);
                console.log('🚀 Particle system initialized');
            }
            
            // Initialize audio feedback
            audioSystem = new AudioFeedback();
            
            // Add interactive feedback to all cards
            document.querySelectorAll('.feature-card').forEach(card => {
                card.addEventListener('mouseenter', () => audioSystem.hover());
                card.addEventListener('click', () => audioSystem.click());
            });

            console.log('✅ Enhanced console dashboard fully loaded');
            
            // API connection test with enhanced feedback
            setTimeout(function() {
                try {
                    fetch('https://nyc.cloud.appwrite.io/v1/functions/grok-api/executions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Appwrite-Project': '68a4e3da0022f3e129d0'
                        },
                        body: JSON.stringify({
                            async: true,
                            body: JSON.stringify({ 
                                prompt: 'Enhanced console health check from super.appwrite.network - ' + new Date().toISOString()
                            })
                        })
                    })
                    .then(function(response) {
                        if (response.ok) {
                            console.log('✅ API connection successful');
                            audioSystem.success();
                            const statusElements = document.querySelectorAll('.status-success');
                            if (statusElements.length > 0) {
                                statusElements[0].innerHTML = '✨ Enhanced Console + API Connected!';
                            }
                        } else {
                            console.log('⚠️ API responded with status:', response.status);
                        }
                        return response.json();
                    })
                    .then(function(data) {
                        console.log('📡 API Response:', data);
                    })
                    .catch(function(err) {
                        console.log('⚠️ API connection failed (non-critical):', err.message);
                    });
                } catch (err) {
                    console.log('⚠️ API test error (non-critical):', err.message);
                }
            }, 2000);
        });
    </script>
</body>
</html>`;

    // OPTIMAL MOBILE HEADERS
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60', // Short cache for testing
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Appwrite-Project',
      'Vary': 'Accept-Encoding, User-Agent' // Mobile-specific caching
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      log('🔄 CORS Preflight request handled');
      return res.send('', 200, headers);
    }

    // Log successful response
    log(`✅ Serving MOBILE-SAFE HTML content for route: ${currentPath}`);
    log(`Content length: ${htmlContent.length} bytes`);
    log(`Zero external dependencies - bulletproof mobile rendering`);
    
    return res.send(htmlContent, 200, headers);

  } catch (err) {
    error(`❌ Mobile-Safe Super Site Function Error: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    // ULTRA-SIMPLE ERROR PAGE - GUARANTEED TO WORK
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Console Appwrite Grok - Error</title>
    <style>
        body { 
            font-family: -apple-system, system-ui, sans-serif;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 20px;
            color: white;
            text-align: center;
        }
        .error-box {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        h1 { margin-bottom: 20px; }
        .error-code { font-family: monospace; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="error-box">
        <h1>🚀 Console Appwrite Grok</h1>
        <p>⚠️ Function Error</p>
        <div class="error-code">${err.message}</div>
        <p>This mobile-safe error page proves the function is running</p>
        <small>Time: ${new Date().toLocaleString()}</small>
    </div>
</body>
</html>`;
    
    return res.send(errorHtml, 500, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
  }
};