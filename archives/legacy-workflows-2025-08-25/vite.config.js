import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '', // Use empty base for Appwrite Sites compatibility
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Archon OS',
        short_name: 'ArchonOS',
        description: 'Archon Operating System - Complete Web-based OS Environment',
        theme_color: '#1a1a1a',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'landscape-primary',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'utilities', 'developer'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'File Manager',
            short_name: 'Files',
            description: 'Open the file manager',
            url: '/apps/files',
            icons: [{ src: '/icons/files-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Terminal',
            short_name: 'Terminal',
            description: 'Open the terminal',
            url: '/apps/terminal',
            icons: [{ src: '/icons/terminal-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Settings',
            short_name: 'Settings',
            description: 'Open system settings',
            url: '/apps/settings',
            icons: [{ src: '/icons/settings-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Knowledge Engine',
            short_name: 'AI Assistant',
            description: 'Open AI knowledge assistant',
            url: '/apps/knowledge',
            icons: [{ src: '/icons/ai-96x96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/archon\.appwrite\.network\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['framer-motion', 'lucide-react'],
          editor: ['monaco-editor', '@monaco-editor/react'],
          terminal: ['xterm', 'xterm-addon-fit', 'xterm-addon-web-links']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@store': '/src/store',
      '@utils': '/src/utils',
      '@assets': '/src/assets'
    }
  }
})