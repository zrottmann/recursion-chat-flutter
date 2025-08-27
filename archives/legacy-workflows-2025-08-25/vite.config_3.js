import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  // Test configuration with Vitest
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        'dist/'
      ]
    }
  },
  plugins: [
    react(),
    // SPA routing plugin to copy index.html as 404.html
    {
      name: 'spa-fallback',
      closeBundle() {
        const distDir = path.resolve('dist');
        const indexPath = path.join(distDir, 'index.html');
        const fallbackPath = path.join(distDir, '404.html');
        
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, fallbackPath);
          console.log('✅ Created 404.html for SPA routing');
        }
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
    allowedHosts: [
      '.trycloudflare.com', 
      'tradingpost.appwrite.network',
      '.appwrite.global', // Appwrite Sites domain
      'localhost'
    ],
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // EMERGENCY MOBILE FIX: Ultra-compatible targets for mobile browsers
    target: ['es2015', 'chrome60', 'safari11', 'firefox55'],
    cssCodeSplit: true,
    minify: 'esbuild', // Use esbuild for minification to avoid variable issues
    rollupOptions: {
      output: {
        // EMERGENCY: Disable chunking to prevent mobile loading issues
        manualChunks: undefined,
        format: 'es',
        entryFileNames: '[name]-[hash].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      },
      // Preserve leaflet's global object structure
      treeshake: {
        moduleSideEffects: (id) => {
          // Preserve side effects for leaflet CSS and initialization
          return id.includes('leaflet') || id.includes('.css');
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source maps only for development
    sourcemap: process.env.NODE_ENV !== 'production' && process.env.VITE_ENV !== 'production'
  },
  // Fix for production deployment
  base: '/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/src'
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  }
});