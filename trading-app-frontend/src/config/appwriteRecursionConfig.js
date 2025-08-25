/**
 * AppWrite Configuration for Trading Post Frontend
 * Using Recursion App AppWrite settings
 */

export const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '689bdee000098bd9d55c',
    databaseId: 'trading_post_db',
    collections: {
        users: 'trading_post_users',
        items: 'trading_post_items',
        trades: 'trading_post_trades',
        messages: 'trading_post_messages',
        reviews: 'trading_post_reviews'
    },
    buckets: {
        itemImages: 'trading_post_item_images',
        profileImages: 'trading_post_profile_images'
    }
};

export default APPWRITE_CONFIG;
