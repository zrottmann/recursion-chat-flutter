import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react()],
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
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    cssCodeSplit: true,
    minify: 'esbuild', // Use esbuild for minification to avoid variable issues
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // More granular control over chunks to ensure proper imports
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('leaflet')) {
              return 'leaflet';
            }
            if (id.includes('bootstrap') || id.includes('react-bootstrap')) {
              return 'ui';
            }
          }
        },
        // Remove format specification to use default (which handles React properly)
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