import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  return {
    plugins: [
      react({
        // Use automatic JSX runtime for smaller bundle
        jsxRuntime: 'automatic'
      })
    ],
    
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
      
      // Target older browsers for 2020 tablet compatibility
      target: ['es2015', 'chrome64', 'safari11.1'],
      
      // Enable CSS code splitting for faster initial load
      cssCodeSplit: true,
      
      // Enable minification for production (disabled temporarily for build fix)
      minify: false, // isProd ? 'terser' : false,
      
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
          passes: 2
        },
        mangle: {
          safari10: true,
          // Preserve Appwrite SDK class names
          keep_classnames: /^(Client|Account|Databases|Query|ID|OAuthProvider)$/,
          keep_fnames: /^(Client|Account|Databases|Query|ID|OAuthProvider)$/
        },
        format: {
          comments: false
        }
      } : {},
      
      rollupOptions: {
        output: {
          // Optimize code splitting for better performance
          manualChunks: (id) => {
            // Split vendor chunks for better caching
            if (id.includes('node_modules')) {
              // Core React (highest priority, always loaded)
              if (id.includes('react') && !id.includes('react-')) {
                return 'react-core';
              }
              if (id.includes('react-dom')) {
                return 'react-dom';
              }
              // React ecosystem (loaded after core)
              if (id.includes('react-router')) {
                return 'react-router';
              }
              // Appwrite SDK (separate chunk)
              if (id.includes('appwrite')) {
                return 'appwrite';
              }
              // UI libraries (can be lazy loaded)
              if (id.includes('lucide-react') || id.includes('react-color') || id.includes('react-textarea')) {
                return 'ui-libs';
              }
              // Heavy libraries (lazy load)
              if (id.includes('react-virtualized')) {
                return 'heavy-libs';
              }
              // Everything else in vendor
              return 'vendor';
            }
          },
          
          // Use content hash for better caching
          entryFileNames: isProd ? 'js/[name].[hash].js' : '[name].js',
          chunkFileNames: isProd ? 'js/[name].[hash].js' : '[name].js',
          assetFileNames: isProd ? 'assets/[name].[hash][extname]' : '[name][extname]'
        },
        
        // Tree-shaking optimizations
        treeshake: isProd ? {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        } : false
      },
      
      // Smaller chunk size limit for mobile
      chunkSizeWarningLimit: 250,
      
      // No source maps in production for smaller size
      sourcemap: !isProd,
      
      // Report compressed size
      reportCompressedSize: false, // Faster builds
      
      // Asset inlining threshold
      assetsInlineLimit: 4096 // 4kb
    },
    
    // Pre-bundle dependencies for faster dev server
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'appwrite'
      ],
      esbuildOptions: {
        target: 'es2015'
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