# Trading Post API Reference

## Overview

The Trading Post API provides comprehensive access to marketplace functionality including AI-powered matching, item management, user authentication, and real-time notifications. The API is built on Appwrite Backend-as-a-Service with custom business logic services.

## 🌐 Base Configuration

### Endpoints
- **Production**: `https://nyc.cloud.appwrite.io/v1`
- **Project ID**: `689bdee000098bd9d55c`
- **WebSocket**: `wss://nyc.cloud.appwrite.io/v1/realtime`

### Authentication
All API requests require proper authentication headers:

```javascript
const headers = {
  'X-Appwrite-Project': '689bdee000098bd9d55c',
  'X-Appwrite-Key': 'your-api-key', // Server-side only
  'Authorization': 'Bearer user-jwt-token' // Client-side
};
```

## 🤖 AI Matching API

### Find Matches

**Endpoint**: `POST /functions/ai-matching/executions`

**Description**: Find AI-powered matches for items or user wants

**Request Body**:
```javascript
{
  "data": {
    "action": "findMatches",
    "userId": "string",
    "type": "items" | "wants",
    "itemId": "string", // optional
    "preferences": {
      "maxDistance": number,        // kilometers (default: 50)
      "categories": string[],       // item categories
      "minValue": number,          // minimum value
      "maxValue": number,          // maximum value  
      "conditions": string[],      // item conditions
      "excludeUsers": string[]     // users to exclude
    },
    "priority": "immediate" | "high" | "normal" | "low" | "bulk",
    "limit": number,               // max results (default: 20)
    "includeScoring": boolean      // detailed scores (default: false)
  }
}
```

**Response**:
```javascript
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "string",
        "item": {
          "id": "string",
          "title": "string",
          "description": "string",
          "category": "string",
          "estimatedValue": number,
          "condition": "string",
          "images": string[],
          "location": {
            "latitude": number,
            "longitude": number,
            "city": "string",
            "address": "string"
          },
          "userId": "string",
          "createdAt": "string",
          "updatedAt": "string"
        },
        "user": {
          "id": "string",
          "name": "string",
          "avatar": "string",
          "rating": number,
          "tradeCount": number,
          "responseTime": "string",
          "location": {
            "city": "string",
            "distance": number
          }
        },
        "score": {
          "overall": number,        // 0.0 - 1.0
          "semantic": number,       // text similarity
          "behavioral": number,     // user patterns
          "location": number,       // distance factor
          "value": number          // price compatibility
        },
        "reasons": string[],        // human-readable explanations
        "confidence": "low" | "medium" | "high",
        "estimatedMutualInterest": number,
        "matchType": "direct" | "cross-category" | "bundle"
      }
    ],
    "totalMatches": number,
    "processingTime": "string",
    "nextUpdate": "string",
    "pagination": {
      "page": number,
      "limit": number,
      "hasMore": boolean
    }
  }
}
```

### Submit Match Feedback

**Endpoint**: `POST /functions/ai-matching/executions`

**Description**: Provide feedback to improve AI matching accuracy

**Request Body**:
```javascript
{
  "data": {
    "action": "submitFeedback",
    "userId": "string",
    "matchId": "string",
    "feedback": {
      "rating": number,           // 1-5 stars
      "interested": boolean,      // user interest
      "contacted": boolean,       // did user make contact
      "tradeCompleted": boolean,  // successful trade
      "reasons": string[],        // feedback categories
      "comments": "string"        // optional text feedback
    }
  }
}
```

**Response**:
```javascript
{
  "success": true,
  "message": "Feedback recorded successfully",
  "data": {
    "feedbackId": "string",
    "learningApplied": boolean,
    "modelUpdated": boolean
  }
}
```

### Get Match History

**Endpoint**: `GET /databases/trading_post_db/collections/matches/documents`

**Description**: Retrieve user's matching history

**Query Parameters**:
- `queries[]`: Filter queries (see Appwrite Query documentation)
- `limit`: Number of results (default: 25)
- `offset`: Pagination offset

**Example Request**:
```javascript
GET /databases/trading_post_db/collections/matches/documents?queries[]=Query.equal('userId', 'user-123')&queries[]=Query.orderDesc('$createdAt')&limit=50
```

## 📦 Items API

### Create Item Listing

**Endpoint**: `POST /databases/trading_post_db/collections/items/documents`

**Request Body**:
```javascript
{
  "documentId": "unique()", // auto-generate
  "data": {
    "title": "string",
    "description": "string",
    "category": "string",
    "subcategory": "string",
    "estimatedValue": number,
    "condition": "new" | "like-new" | "good" | "fair" | "poor",
    "images": string[],         // image URLs
    "tags": string[],
    "location": {
      "latitude": number,
      "longitude": number,
      "city": "string",
      "address": "string"
    },
    "preferences": {
      "tradeFor": string[],     // desired categories
      "maxDistance": number,
      "priceRange": {
        "min": number,
        "max": number
      }
    },
    "status": "available" | "pending" | "traded" | "removed",
    "userId": "string",
    "featured": boolean,
    "boostUntil": "string"      // boost expiry date
  }
}
```

### Get Item Details

**Endpoint**: `GET /databases/trading_post_db/collections/items/documents/{itemId}`

**Response**: Complete item document with user information populated

### Update Item

**Endpoint**: `PATCH /databases/trading_post_db/collections/items/documents/{itemId}`

**Request Body**: Partial item data (only fields to update)

### Delete Item

**Endpoint**: `DELETE /databases/trading_post_db/collections/items/documents/{itemId}`

### Search Items

**Endpoint**: `GET /databases/trading_post_db/collections/items/documents`

**Query Parameters**:
```javascript
// Text search
queries[]=Query.search('title', 'MacBook')
queries[]=Query.search('description', 'laptop')

// Category filtering
queries[]=Query.equal('category', 'Electronics')

// Location filtering  
queries[]=Query.between('location.latitude', 40.0, 41.0)
queries[]=Query.between('location.longitude', -75.0, -73.0)

// Value filtering
queries[]=Query.between('estimatedValue', 100, 500)

// Status filtering
queries[]=Query.equal('status', 'available')

// Sorting
queries[]=Query.orderDesc('$createdAt')
queries[]=Query.orderAsc('estimatedValue')

// Pagination
limit=25
offset=0
```

## 👤 User Management API

### Get User Profile

**Endpoint**: `GET /databases/trading_post_db/collections/users/documents/{userId}`

### Update User Profile

**Endpoint**: `PATCH /databases/trading_post_db/collections/users/documents/{userId}`

**Request Body**:
```javascript
{
  "name": "string",
  "bio": "string",
  "avatar": "string",
  "location": {
    "city": "string",
    "coordinates": [number, number]
  },
  "preferences": {
    "categories": string[],
    "maxDistance": number,
    "notifications": {
      "matches": boolean,
      "messages": boolean,
      "trades": boolean
    }
  },
  "privacy": {
    "showLocation": boolean,
    "showLastSeen": boolean,
    "allowContact": boolean
  }
}
```

### Get User Statistics

**Endpoint**: `GET /functions/user-stats/executions`

**Request Body**:
```javascript
{
  "data": {
    "userId": "string"
  }
}
```

**Response**:
```javascript
{
  "success": true,
  "data": {
    "totalListings": number,
    "activeListings": number,
    "completedTrades": number,
    "rating": number,
    "responseTime": number,      // average in minutes
    "joinDate": "string",
    "lastActive": "string",
    "trustScore": number,        // 0-100
    "badges": string[],
    "tradingStreak": number
  }
}
```

## 💬 Messaging API

### Send Message

**Endpoint**: `POST /databases/trading_post_db/collections/messages/documents`

**Request Body**:
```javascript
{
  "documentId": "unique()",
  "data": {
    "conversationId": "string",
    "fromUserId": "string",
    "toUserId": "string",
    "itemId": "string",           // optional reference item
    "content": "string",
    "type": "text" | "image" | "trade-offer",
    "tradeOffer": {              // if type === "trade-offer"
      "offeredItemIds": string[],
      "requestedItemIds": string[],
      "additionalCash": number,
      "expiresAt": "string"
    },
    "readAt": "string",
    "status": "sent" | "delivered" | "read"
  }
}
```

### Get Conversations

**Endpoint**: `GET /databases/trading_post_db/collections/conversations/documents`

**Query Parameters**:
```javascript
queries[]=Query.equal('participants', 'current-user-id')
queries[]=Query.orderDesc('lastMessageAt')
```

### Get Messages

**Endpoint**: `GET /databases/trading_post_db/collections/messages/documents`

**Query Parameters**:
```javascript
queries[]=Query.equal('conversationId', 'conversation-id')
queries[]=Query.orderDesc('$createdAt')
limit=50
```

## 📧 Notifications API

### Get Notifications

**Endpoint**: `GET /databases/trading_post_db/collections/notifications/documents`

**Query Parameters**:
```javascript
queries[]=Query.equal('userId', 'current-user-id')
queries[]=Query.orderDesc('$createdAt')
queries[]=Query.equal('read', false) // unread only
```

### Mark as Read

**Endpoint**: `PATCH /databases/trading_post_db/collections/notifications/documents/{notificationId}`

**Request Body**:
```javascript
{
  "read": true,
  "readAt": new Date().toISOString()
}
```

## 🔄 Real-time Subscriptions

### WebSocket Connection

Connect to real-time updates:

```javascript
const client = new WebSocket('wss://nyc.cloud.appwrite.io/v1/realtime?project=689bdee000098bd9d55c');

// Subscribe to specific channels
client.send(JSON.stringify({
  type: 'authentication',
  data: {
    session: 'user-jwt-token'
  }
}));

// Subscribe to collections
client.send(JSON.stringify({
  type: 'subscribe',
  data: {
    channels: [
      'databases.trading_post_db.collections.matches.documents',
      'databases.trading_post_db.collections.messages.documents',
      'databases.trading_post_db.collections.notifications.documents'
    ]
  }
}));
```

### Real-time Events

**Match Updates**:
```javascript
{
  "type": "event",
  "data": {
    "event": "databases.trading_post_db.collections.matches.documents.create",
    "payload": { /* match document */ }
  }
}
```

**New Messages**:
```javascript
{
  "type": "event", 
  "data": {
    "event": "databases.trading_post_db.collections.messages.documents.create",
    "payload": { /* message document */ }
  }
}
```

## 📊 Analytics API

### Track User Event

**Endpoint**: `POST /functions/analytics/executions`

**Request Body**:
```javascript
{
  "data": {
    "event": "string",           // event name
    "userId": "string",
    "properties": {
      "itemId": "string",
      "category": "string",
      "action": "string",
      "value": number,
      "metadata": object
    },
    "timestamp": "string"
  }
}
```

### Get Analytics Data

**Endpoint**: `POST /functions/analytics/executions`

**Request Body**:
```javascript
{
  "data": {
    "action": "getAnalytics",
    "userId": "string",          // optional, admin only for all users
    "metrics": string[],         // specific metrics to retrieve
    "timeRange": {
      "start": "string",
      "end": "string"
    },
    "groupBy": "day" | "week" | "month"
  }
}
```

## 🔒 Authentication API

### Login with OAuth

**Endpoint**: Uses Appwrite OAuth providers

**Supported Providers**:
- Google: `/account/sessions/oauth2/google`
- GitHub: `/account/sessions/oauth2/github`
- Microsoft: `/account/sessions/oauth2/microsoft`

### Get Current Session

**Endpoint**: `GET /account/sessions/current`

### Logout

**Endpoint**: `DELETE /account/sessions/current`

## 📋 Error Handling

### Standard Error Response

```javascript
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": object
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `401` | Unauthorized - invalid or expired token |
| `403` | Forbidden - insufficient permissions |
| `404` | Not Found - resource doesn't exist |
| `422` | Validation Error - invalid request data |
| `429` | Rate Limit - too many requests |
| `500` | Server Error - internal system error |

## 📈 Rate Limiting

### Request Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| **AI Matching** | 60 requests | 1 hour |
| **Search/Browse** | 300 requests | 15 minutes |
| **Create/Update** | 100 requests | 15 minutes |
| **Authentication** | 30 requests | 15 minutes |
| **Real-time** | 1000 messages | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642678800
```

## 🧪 Testing

### Test Endpoints

Development and testing endpoints available at:
- **Staging**: `https://nyc.cloud.appwrite.io/v1` (with test project)
- **Local Development**: `http://localhost:3000/api`

### Mock Data

Test data available for development:

```javascript
// Test user IDs
const testUsers = [
  'test-user-1', 'test-user-2', 'test-user-3'
];

// Test item categories
const testCategories = [
  'Electronics', 'Books', 'Clothing', 'Sports', 'Home'
];
```

---

## 📚 Additional Resources

- [Appwrite REST API Documentation](https://appwrite.io/docs/rest)
- [Real-time WebSocket Guide](https://appwrite.io/docs/realtime)
- [Authentication Best Practices](docs/auth-guide.md)
- [Database Schema Reference](docs/database-schema.md)

---

**Last Updated**: 2025-01-15  
**API Version**: 2.1.0  
**Status**: Production Ready ✅