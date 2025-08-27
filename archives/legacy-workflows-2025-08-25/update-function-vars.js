#!/usr/bin/env node

import { Client, Functions } from 'node-appwrite';

console.log('🔧 Updating Appwrite Function Environment Variables...');

// Configuration
const CONFIG = {
    ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
    PROJECT_ID: '68a225750012651a6667', // Try original project ID first
    API_KEY: process.env.APPWRITE_API_KEY || 'standard_a9b3ca00d1bf8e938f93d5e6ff1a6e26dc2e49e3b4b84b5c458e7a92bb82cea8f2bdf6a34d42cc4ca84d4d8ed1fb0a8fb54b6c7395c3e8b0b2a8c9b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0',
    FUNCTION_ID: '67a6f25c0038fffe4f71',
    DATABASE_ID: 'archon_db'
};

async function updateFunctionVariables() {
    try {
        console.log('📱 Initializing Appwrite client...');
        
        const client = new Client()
            .setEndpoint(CONFIG.ENDPOINT)
            .setProject(CONFIG.PROJECT_ID)
            .setKey(CONFIG.API_KEY);

        const functions = new Functions(client);

        console.log(`🔧 Updating function ${CONFIG.FUNCTION_ID} variables...`);

        // Environment variables to set
        const envVars = {
            'APPWRITE_FUNCTION_ENDPOINT': CONFIG.ENDPOINT,
            'APPWRITE_FUNCTION_PROJECT_ID': CONFIG.PROJECT_ID,
            'APPWRITE_API_KEY': CONFIG.API_KEY,
            'APPWRITE_DATABASE_ID': CONFIG.DATABASE_ID,
            'APPWRITE_FUNCTION_ID': 'archon-health'
        };

        console.log('📋 Environment variables to update:');
        Object.entries(envVars).forEach(([key, value]) => {
            console.log(`  ${key}: ${key.includes('KEY') ? '[REDACTED]' : value}`);
        });

        // First, let's get the current function details
        console.log('📋 Getting current function details...');
        const currentFunction = await functions.get(CONFIG.FUNCTION_ID);
        console.log('📊 Current function:', currentFunction.name);

        // Update function with new variables
        const result = await functions.update(
            CONFIG.FUNCTION_ID,
            currentFunction.name,
            currentFunction.execute,
            currentFunction.events || [],
            currentFunction.schedule || '',
            currentFunction.timeout || 30,
            currentFunction.enabled !== false,
            currentFunction.logging,
            currentFunction.entrypoint,
            currentFunction.commands,
            currentFunction.scopes || [],
            currentFunction.installationId,
            currentFunction.providerRepositoryId,
            currentFunction.providerBranch,
            currentFunction.providerSilentMode,
            currentFunction.providerRootDirectory,
            currentFunction.templateRepository,
            currentFunction.templateOwner,
            currentFunction.templateRootDirectory,
            currentFunction.templateBranch,
            envVars
        );

        console.log('✅ Function variables updated successfully!');
        console.log('📊 Updated variables:', Object.keys(result.variables || {}));

        return {
            success: true,
            functionId: CONFIG.FUNCTION_ID,
            variables: Object.keys(envVars)
        };

    } catch (error) {
        console.error('💥 Failed to update function variables:', error);
        
        if (error.code === 404) {
            console.error('❌ Function not found. Check the function ID:', CONFIG.FUNCTION_ID);
        } else if (error.code === 401) {
            console.error('❌ Unauthorized. Check your API key.');
        } else {
            console.error('❌ Error details:', error.message);
        }

        return {
            success: false,
            error: error.message,
            functionId: CONFIG.FUNCTION_ID
        };
    }
}

// Run the update
updateFunctionVariables()
    .then(result => {
        if (result.success) {
            console.log('🎉 Function environment variables updated successfully!');
            console.log('🔄 The function should now work with the correct configuration.');
            process.exit(0);
        } else {
            console.error('❌ Failed to update function variables:', result.error);
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });