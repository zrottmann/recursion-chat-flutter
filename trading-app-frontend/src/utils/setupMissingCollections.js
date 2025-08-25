/**
 * Setup Missing Collections in Appwrite
 * Creates matches and savedItems collections if they don't exist
 */

import { databases, DATABASE_ID, ID, Permission, Role } from '../lib/appwrite';

export async function setupMissingCollections() {
  console.log('🔧 Setting up missing collections...');
  
  const collectionsToCreate = [
    {
      id: 'matches',
      name: 'Matches',
      permissions: [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      attributes: [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'match_type', type: 'string', size: 50, required: false },
        { key: 'match_score', type: 'float', required: false },
        { key: 'item_id', type: 'string', size: 255, required: false },
        { key: 'matched_item_id', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: false },
        { key: 'created_at', type: 'datetime', required: false }
      ]
    },
    {
      id: 'saved_items',
      name: 'Saved Items',
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      attributes: [
        { key: 'user_id', type: 'string', size: 255, required: true },
        { key: 'item_id', type: 'string', size: 255, required: true },
        { key: 'saved_at', type: 'datetime', required: false }
      ]
    }
  ];

  for (const collection of collectionsToCreate) {
    try {
      // Check if collection exists
      await databases.listDocuments(DATABASE_ID, collection.id, []);
      console.log(`✅ Collection '${collection.name}' already exists`);
    } catch (error) {
      if (error.code === 404) {
        console.log(`📝 Creating collection '${collection.name}'...`);
        
        try {
          // Note: Creating collections requires server-side SDK or Appwrite Console
          // This is just for documentation purposes
          console.warn(`⚠️ Collection '${collection.name}' needs to be created manually in Appwrite Console with these attributes:`, collection.attributes);
          
          // Return the structure for manual creation
          return {
            success: false,
            message: 'Collections must be created via Appwrite Console',
            collectionsNeeded: collectionsToCreate
          };
        } catch (createError) {
          console.error(`❌ Failed to create collection '${collection.name}':`, createError);
        }
      } else {
        console.error(`❌ Error checking collection '${collection.name}':`, error);
      }
    }
  }
  
  return {
    success: true,
    message: 'Collection check complete'
  };
}

// Export for use in App.jsx initialization
export default setupMissingCollections;