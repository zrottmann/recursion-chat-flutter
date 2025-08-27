const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    // Global ignore patterns
    ignores: [
      // Dependencies
      'node_modules/**',
      'client/node_modules/**',
      // Build outputs and compiled assets
      'client/dist/**',
      'client/build/**',
      'dist/**',
      'build/**',
      // Android build assets (bundled/compiled JS files)
      'client/android/**',
      'android/**',
      // iOS build assets
      'client/ios/**',
      'ios/**',
      // Cordova/PhoneGap
      'platforms/**',
      'plugins/**',
      'www/**',
      // Generated files with hash names (bundled assets)
      '**/*.[a-fA-F0-9]{8,}.js',
      '**/*.[a-fA-F0-9]{8,}.css',
      // Build artifacts
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.chunk.js',
      '**/*.generated.js',
      // Logs and temporary files
      '**/*.log',
      '.tmp/**',
      'temp/**',
      // Coverage and cache
      'coverage/**',
      '.nyc_output/**',
      '.cache/**'
    ]
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module', // Support ES6 modules
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        // React globals
        React: 'readonly',
        ReactDOM: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];