import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Use automatic JSX runtime for smaller bundle
        jsxRuntime: 'automatic',
        // Babel optimizations for older devices
        babel: {
          plugins: [
            // Remove console logs in production
            mode === 'production' && ['transform-remove-console', { exclude: ['error', 'warn'] }]
          ].filter(Boolean)
        }
      }),
      
      // Gzip compression for smaller file sizes
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 10240, // Only compress files > 10kb
        deleteOriginFile: false
      }),
      
      // Brotli compression for modern browsers
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 10240,
        deleteOriginFile: false
      }),
      
      // Bundle analyzer (only in analyze mode)
      process.env.ANALYZE && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_NODE_ENV),
      __BUILD_TARGET__: JSON.stringify(env.VITE_BUILD_TARGET),
      __DEBUG_MODE__: JSON.stringify(env.VITE_DEBUG_MODE === 'true'),
    },
    
    server: {
      host: '0.0.0.0',
      port: 5174,
      hmr: false,
      allowedHosts: [
        '.trycloudflare.com', 
        'chat.recursionsystems.com', 
        '.recursionsystems.com', 
        '.appwrite.global',
        'localhost'
      ],
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8'
      }
    },
    
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      
      // Target older browsers for tablet compatibility
      target: ['es2015', 'edge79', 'firefox67', 'chrome64', 'safari11.1'],
      
      // Enable CSS code splitting for faster initial load
      cssCodeSplit: true,
      
      // Optimize minification for production
      minify: mode === 'production' ? 'terser' : false,
      
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true, // Remove console logs
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.debug'], // Remove specific functions
          passes: 2 // Multiple passes for better compression
        },
        mangle: {
          safari10: true, // Fix for Safari 10 compatibility
        },
        format: {
          comments: false, // Remove all comments
        },
        // Keep function names for better debugging
        keep_fnames: /^(Client|Account|Databases|Query|ID|Permission|Role|Storage|Functions|OAuthProvider)$/
      } : {},
      
      rollupOptions: {
        output: {
          // Aggressive code splitting for better caching
          manualChunks: (id) => {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Appwrite SDK
            if (id.includes('appwrite')) {
              return 'appwrite-sdk';
            }
            // UI components
            if (id.includes('lucide-react') || id.includes('react-color')) {
              return 'ui-components';
            }
            // Heavy libraries
            if (id.includes('react-virtualized')) {
              return 'virtualized';
            }
            // Utilities
            if (id.includes('axios') || id.includes('loglevel')) {
              return 'utilities';
            }
            // Node modules (vendor)
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          
          // Use content hash for better caching
          entryFileNames: 'js/[name].[hash].js',
          chunkFileNames: 'js/[name].[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'images/[name].[hash][extname]';
            } else if (/woff2?|ttf|eot/i.test(ext)) {
              return 'fonts/[name].[hash][extname]';
            } else if (ext === 'css') {
              return 'css/[name].[hash][extname]';
            }
            return 'assets/[name].[hash][extname]';
          }
        },
        
        // Tree-shaking optimizations
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        }
      },
      
      // Increase chunk size warning limit slightly
      chunkSizeWarningLimit: 500,
      
      // Source maps only for staging/dev
      sourcemap: mode !== 'production' ? 'inline' : false,
      
      // Report compressed size
      reportCompressedSize: true,
      
      // Asset inlining threshold (inline small assets)
      assetsInlineLimit: 4096 // 4kb
    },
    
    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'appwrite'
      ],
      exclude: [],
      esbuildOptions: {
        target: 'es2015'
      }
    },
    
    // Performance hints
    preview: {
      host: '0.0.0.0',
      port: 4173,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    
    base: '/',
    publicDir: 'public',
    
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  };
});