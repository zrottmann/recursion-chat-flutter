#!/usr/bin/env node

/**
 * Trading Post Database Schema Validation Script
 * 
 * This script validates the database schema without making any changes.
 * Use this to check if the user_id attributes are properly configured.
 * 
 * Usage:
 *   node validate-database-schema.js
 * 
 * Environment Variables:
 *   APPWRITE_API_KEY - Required for database access
 * 
 * @author Claude AI - Trading Post Schema Validator
 * @date 2025-08-16
 */

const { validateSchemaOnly } = require('./fix-database-schema.js');

// Run validation
validateSchemaOnly()
    .then(result => {
        if (result.success) {
            console.log('\n🎉 Schema validation PASSED - all required attributes are present!');
            process.exit(0);
        } else {
            console.log('\n⚠️  Schema validation FAILED - some attributes are missing');
            console.log('Run "node fix-database-schema.js" to fix the issues');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error(`\n❌ Validation error: ${error.message}`);
        process.exit(1);
    });