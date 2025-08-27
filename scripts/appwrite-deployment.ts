// Appwrite Deployment Service
// Handles database setup, functions deployment, and sites deployment

import { Client, Databases, Functions, Storage, ID, Permission, Role } from 'node-appwrite';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DatabaseSchema {
  name: string;
  collections: CollectionSchema[];
}

interface CollectionSchema {
  name: string;
  attributes: AttributeSchema[];
  indexes?: IndexSchema[];
  permissions?: string[];
}

interface AttributeSchema {
  key: string;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'datetime' | 'email' | 'url';
  size?: number;
  required: boolean;
  default?: any;
  array?: boolean;
}

interface IndexSchema {
  key: string;
  type: string; // Use generic string to avoid TypeScript IndexType issues
  attributes: string[];
}

export class AppwriteDeployment {
  private client: Client;
  private databases: Databases;
  private functions: Functions;
  private storage: Storage;

  constructor() {
    // Initialize with standard API key for runtime operations
    this.client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    this.databases = new Databases(this.client);
    this.functions = new Functions(this.client);
    this.storage = new Storage(this.client);
  }

  // Initialize with dev key for infrastructure setup
  private getDevClient() {
    return new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_DEV_KEY!);
  }

  // Setup database with collections and attributes
  async setupDatabase(schema: DatabaseSchema) {
    const devClient = this.getDevClient();
    const devDatabases = new Databases(devClient);

    try {
      // Create or get database
      let databaseId = process.env.DATABASE_ID || 'ai_orchestrator';
      
      try {
        // Try to get existing database
        await devDatabases.get(databaseId);
        console.log(`Database ${databaseId} already exists`);
      } catch {
        // Create new database if it doesn't exist
        const database = await devDatabases.create(
          databaseId,
          schema.name
        );
        console.log(`Database created: ${database.$id}`);
      }

      // Create collections
      for (const collectionSchema of schema.collections) {
        await this.createCollection(devDatabases, databaseId, collectionSchema);
      }

      return { databaseId, success: true };
    } catch (error) {
      console.error('Database setup error:', error);
      throw error;
    }
  }

  private async createCollection(
    devDatabases: Databases, 
    databaseId: string, 
    schema: CollectionSchema
  ) {
    try {
      // Generate collection ID from name
      const collectionId = schema.name.toLowerCase().replace(/\s+/g, '_');

      try {
        // Check if collection exists
        await devDatabases.getCollection(databaseId, collectionId);
        console.log(`Collection ${collectionId} already exists`);
      } catch {
        // Create collection
        await devDatabases.createCollection(
          databaseId,
          collectionId,
          schema.name,
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        console.log(`Collection created: ${collectionId}`);
      }

      // Create attributes
      for (const attr of schema.attributes) {
        await this.createAttribute(devDatabases, databaseId, collectionId, attr);
      }

      // Create indexes
      if (schema.indexes) {
        for (const index of schema.indexes) {
          await this.createIndex(devDatabases, databaseId, collectionId, index);
        }
      }

      return collectionId;
    } catch (error) {
      console.error(`Error creating collection ${schema.name}:`, error);
      throw error;
    }
  }

  private async createAttribute(
    devDatabases: Databases,
    databaseId: string,
    collectionId: string,
    attr: AttributeSchema
  ) {
    try {
      // Check if attribute exists
      const attributes = await devDatabases.listAttributes(databaseId, collectionId);
      if (attributes.attributes.some(a => a.key === attr.key)) {
        console.log(`Attribute ${attr.key} already exists`);
        return;
      }

      switch (attr.type) {
        case 'string':
          await devDatabases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size || 255,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'integer':
          await devDatabases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            undefined, // min
            undefined, // max
            attr.default,
            attr.array
          );
          break;
        case 'float':
          await devDatabases.createFloatAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            undefined, // min
            undefined, // max
            attr.default,
            attr.array
          );
          break;
        case 'boolean':
          await devDatabases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'datetime':
          await devDatabases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'email':
          await devDatabases.createEmailAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'url':
          await devDatabases.createUrlAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
      }

      console.log(`Attribute created: ${attr.key}`);
    } catch (error) {
      console.error(`Error creating attribute ${attr.key}:`, error);
      // Continue with other attributes even if one fails
    }
  }

  private async createIndex(
    devDatabases: Databases,
    databaseId: string,
    collectionId: string,
    index: IndexSchema
  ) {
    try {
      await devDatabases.createIndex(
        databaseId,
        collectionId,
        index.key,
        index.type,
        index.attributes
      );
      console.log(`Index created: ${index.key}`);
    } catch (error) {
      console.error(`Error creating index ${index.key}:`, error);
      // Continue with other indexes even if one fails
    }
  }

  // Deploy a function to Appwrite
  async deployFunction(name: string, code: string, runtime: string = 'node-18.0') {
    const devClient = this.getDevClient();
    const devFunctions = new Functions(devClient);

    try {
      // Create function
      const functionId = name.toLowerCase().replace(/\s+/g, '-');
      
      let func;
      try {
        // Check if function exists
        func = await devFunctions.get(functionId);
        console.log(`Function ${functionId} already exists`);
      } catch {
        // Create new function
        func = await devFunctions.create(
          functionId,
          name,
          runtime,
          [Permission.execute(Role.any())], // Execute permissions
          [], // Events
          '', // Schedule
          15, // Timeout in seconds
          true, // Enabled
          '', // Logging
          '' // Entry point
        );
        console.log(`Function created: ${func.$id}`);
      }

      // Create deployment
      const deployment = await this.createFunctionDeployment(devFunctions, func.$id, code);
      
      return {
        functionId: func.$id,
        deploymentId: deployment.$id,
        success: true
      };
    } catch (error) {
      console.error('Function deployment error:', error);
      throw error;
    }
  }

  private async createFunctionDeployment(devFunctions: Functions, functionId: string, code: string) {
    // Create a temporary directory for the function code
    const tempDir = path.join(process.cwd(), 'temp', functionId);
    
    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write function code
    fs.writeFileSync(path.join(tempDir, 'index.js'), code);

    // Create package.json for the function
    const packageJson = {
      name: functionId,
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        'node-appwrite': '^17.0.0'
      }
    };
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create tar.gz archive
    const tarPath = path.join(tempDir, 'function.tar.gz');
    await execAsync(`tar -czf ${tarPath} -C ${tempDir} index.js package.json`);

    // Read the tar file
    const tarBuffer = fs.readFileSync(tarPath);

    // Deploy the function
    const deployment = await devFunctions.createDeployment(
      functionId,
      'index.js',
      tarBuffer,
      true // Activate
    );

    // Clean up temp files
    fs.rmSync(tempDir, { recursive: true, force: true });

    console.log(`Function deployed: ${deployment.$id}`);
    return deployment;
  }

  // Deploy site to Appwrite Sites
  async deploySite(siteId: string, buildPath: string) {
    try {
      // Create tar.gz of build directory
      const tarPath = path.join(process.cwd(), 'site-deploy.tar.gz');
      await execAsync(`tar -czf ${tarPath} -C ${buildPath} .`);

      // Read the tar file
      const formData = new FormData();
      const tarBuffer = fs.readFileSync(tarPath);
      formData.append('code', new Blob([tarBuffer]), 'site.tar.gz');

      // Deploy to Appwrite Sites
      const response = await fetch(
        `${process.env.APPWRITE_ENDPOINT}/sites/${siteId}/deployments`,
        {
          method: 'POST',
          headers: {
            'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID!,
            'X-Appwrite-Key': process.env.APPWRITE_API_KEY!
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Site deployment failed: ${error}`);
      }

      const deployment = await response.json();
      
      // Clean up tar file
      fs.unlinkSync(tarPath);

      console.log(`Site deployed: ${deployment.$id}`);
      return {
        deploymentId: deployment.$id,
        url: `https://${siteId}.appwrite.network`,
        success: true
      };
    } catch (error) {
      console.error('Site deployment error:', error);
      throw error;
    }
  }

  // Initialize default database schema for AI Orchestrator
  async initializeOrchestratorDatabase() {
    const schema: DatabaseSchema = {
      name: 'AI Orchestrator',
      collections: [
        {
          name: 'tasks',
          attributes: [
            { key: 'userId', type: 'string', size: 255, required: true },
            { key: 'projectName', type: 'string', size: 255, required: true },
            { key: 'projectDescription', type: 'string', size: 5000, required: false },
            { key: 'projectType', type: 'string', size: 50, required: true },
            { key: 'requirements', type: 'string', size: 10000, required: false },
            { key: 'constraints', type: 'string', size: 5000, required: false },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'grokAnalysis', type: 'string', size: 20000, required: false },
            { key: 'claudeAssignments', type: 'string', size: 10000, required: false },
            { key: 'githubRepo', type: 'url', required: false },
            { key: 'deploymentUrl', type: 'url', required: false },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true }
          ],
          indexes: [
            { key: 'idx_status', type: 'key', attributes: ['status'] },
            { key: 'idx_userId', type: 'key', attributes: ['userId'] },
            { key: 'idx_createdAt', type: 'key', attributes: ['createdAt'] }
          ]
        },
        {
          name: 'agent_activities',
          attributes: [
            { key: 'taskId', type: 'string', size: 255, required: true },
            { key: 'agentId', type: 'string', size: 255, required: true },
            { key: 'agentType', type: 'string', size: 50, required: true },
            { key: 'specialization', type: 'string', size: 50, required: false },
            { key: 'action', type: 'string', size: 255, required: true },
            { key: 'taskTitle', type: 'string', size: 255, required: false },
            { key: 'taskDescription', type: 'string', size: 5000, required: false },
            { key: 'input', type: 'string', size: 10000, required: false },
            { key: 'output', type: 'string', size: 50000, required: false },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'estimatedHours', type: 'float', required: false },
            { key: 'actualHours', type: 'float', required: false },
            { key: 'assignedAt', type: 'datetime', required: true },
            { key: 'completedAt', type: 'datetime', required: false }
          ],
          indexes: [
            { key: 'idx_taskId', type: 'key', attributes: ['taskId'] },
            { key: 'idx_agentId', type: 'key', attributes: ['agentId'] },
            { key: 'idx_status', type: 'key', attributes: ['status'] }
          ]
        },
        {
          name: 'deployments',
          attributes: [
            { key: 'taskId', type: 'string', size: 255, required: true },
            { key: 'type', type: 'string', size: 50, required: true },
            { key: 'appwriteProjectId', type: 'string', size: 255, required: false },
            { key: 'githubRepo', type: 'url', required: false },
            { key: 'buildArtifacts', type: 'string', size: 10000, required: false, array: true },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'url', type: 'url', required: false },
            { key: 'logs', type: 'string', size: 50000, required: false },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'completedAt', type: 'datetime', required: false }
          ],
          indexes: [
            { key: 'idx_taskId', type: 'key', attributes: ['taskId'] },
            { key: 'idx_status', type: 'key', attributes: ['status'] },
            { key: 'idx_type', type: 'key', attributes: ['type'] }
          ]
        }
      ]
    };

    return await this.setupDatabase(schema);
  }
}

// Export singleton instance
export const appwriteDeployment = new AppwriteDeployment();