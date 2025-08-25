
// Test script to run in browser console
(async () => {
  try {
    console.log('🔧 Creating test items directly...');
    
    // Import Appwrite from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/appwrite@13.0.0/dist/iife/sdk.js';
    document.head.appendChild(script);
    
    await new Promise(resolve => {
      script.onload = resolve;
    });
    
    const { Client, Databases, Account, ID } = Appwrite;
    
    const client = new Client()
      .setEndpoint('https://nyc.cloud.appwrite.io/v1')
      .setProject('689bdee000098bd9d55c');

    const databases = new Databases(client);
    const account = new Account(client);

    // Get current user
    const user = await account.get();
    console.log('✅ User:', user.email);

    // Create a test item
    const testItem = {
      userId: user.$id,
      title: 'Test iPhone 12',
      description: 'Test item created via console script',
      category: 'electronics',
      condition: 'excellent',
      estimated_value: 400.00,
      images: [],
      tags: ['test', 'iphone'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await databases.createDocument(
      'trading_post_db',
      'items',
      ID.unique(),
      testItem
    );

    console.log('✅ Item created:', response.$id);
    console.log('🎉 Go refresh your marketplace!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();

