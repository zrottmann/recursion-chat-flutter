const sdk = require('node-appwrite');
const fetch = require('node-fetch');

// Initialize Appwrite SDK
const client = new sdk.Client();
const databases = new sdk.Databases(client);
const realtime = new sdk.Realtime(client);

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

// Grok API configuration
const GROK_API = {
  endpoint: process.env.GROK_API_ENDPOINT || 'https://api.x.ai/v1/chat/completions',
  key: process.env.GROK_API_KEY,
  model: process.env.GROK_MODEL || 'grok-beta'
};

module.exports = async function (req, res) {
  const { action, roomId, userId, message, prompt, metadata } = req.payload || {};

  try {
    switch (action) {
      case 'createRoom':
        return handleCreateRoom(userId, metadata, res);
      
      case 'joinRoom':
        return handleJoinRoom(roomId, userId, res);
      
      case 'sendMessage':
        return handleSendMessage(roomId, userId, message, res);
      
      case 'askGrok':
        return handleGrokQuery(roomId, userId, prompt, res);
      
      case 'getRoomHistory':
        return handleGetRoomHistory(roomId, userId, res);
      
      case 'getRooms':
        return handleGetRooms(userId, res);
      
      case 'leaveRoom':
        return handleLeaveRoom(roomId, userId, res);
      
      default:
        return res.json({
          success: false,
          error: 'Invalid action specified'
        }, 400);
    }
  } catch (error) {
    console.error('Chatroom Function Error:', error);
    return res.json({
      success: false,
      error: error.message
    }, 500);
  }
};

async function handleCreateRoom(userId, metadata, res) {
  try {
    const roomData = {
      name: metadata?.name || `Room_${Date.now()}`,
      description: metadata?.description || '',
      createdBy: userId,
      participants: [userId],
      isPrivate: metadata?.isPrivate || false,
      maxParticipants: metadata?.maxParticipants || 100,
      tags: metadata?.tags || [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
      grokEnabled: metadata?.grokEnabled !== false
    };
    
    const room = await databases.createDocument(
      process.env.DB_ID,
      'chatrooms',
      sdk.ID.unique(),
      roomData
    );
    
    // Create initial system message
    await databases.createDocument(
      process.env.DB_ID,
      'messages',
      sdk.ID.unique(),
      {
        roomId: room.$id,
        userId: 'system',
        userName: 'System',
        content: `Welcome to ${room.name}!`,
        type: 'system',
        timestamp: new Date().toISOString()
      }
    );
    
    return res.json({
      success: true,
      room: {
        id: room.$id,
        name: room.name,
        participants: room.participants,
        grokEnabled: room.grokEnabled
      }
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to create room: ${error.message}`
    }, 500);
  }
}

async function handleJoinRoom(roomId, userId, res) {
  try {
    const room = await databases.getDocument(
      process.env.DB_ID,
      'chatrooms',
      roomId
    );
    
    if (room.participants.length >= room.maxParticipants) {
      return res.json({
        success: false,
        error: 'Room is full'
      }, 400);
    }
    
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      
      await databases.updateDocument(
        process.env.DB_ID,
        'chatrooms',
        roomId,
        {
          participants: room.participants,
          lastActivity: new Date().toISOString()
        }
      );
      
      // Send join notification
      await databases.createDocument(
        process.env.DB_ID,
        'messages',
        sdk.ID.unique(),
        {
          roomId: roomId,
          userId: 'system',
          userName: 'System',
          content: `User ${userId} joined the room`,
          type: 'system',
          timestamp: new Date().toISOString()
        }
      );
    }
    
    return res.json({
      success: true,
      room: {
        id: room.$id,
        name: room.name,
        participants: room.participants,
        grokEnabled: room.grokEnabled
      }
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to join room: ${error.message}`
    }, 500);
  }
}

async function handleSendMessage(roomId, userId, message, res) {
  try {
    // Verify user is in room
    const room = await databases.getDocument(
      process.env.DB_ID,
      'chatrooms',
      roomId
    );
    
    if (!room.participants.includes(userId)) {
      return res.json({
        success: false,
        error: 'User not in room'
      }, 403);
    }
    
    // Create message
    const messageData = {
      roomId: roomId,
      userId: userId,
      userName: message.userName || `User_${userId.substring(0, 8)}`,
      content: message.content,
      type: message.type || 'text',
      attachments: message.attachments || [],
      replyTo: message.replyTo || null,
      timestamp: new Date().toISOString(),
      edited: false,
      reactions: []
    };
    
    const savedMessage = await databases.createDocument(
      process.env.DB_ID,
      'messages',
      sdk.ID.unique(),
      messageData
    );
    
    // Update room activity
    await databases.updateDocument(
      process.env.DB_ID,
      'chatrooms',
      roomId,
      {
        lastActivity: new Date().toISOString(),
        messageCount: room.messageCount + 1
      }
    );
    
    // Trigger realtime update
    await triggerRealtimeUpdate(roomId, 'message', savedMessage);
    
    return res.json({
      success: true,
      message: {
        id: savedMessage.$id,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp
      }
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to send message: ${error.message}`
    }, 500);
  }
}

async function handleGrokQuery(roomId, userId, prompt, res) {
  try {
    // Verify user is in room and Grok is enabled
    const room = await databases.getDocument(
      process.env.DB_ID,
      'chatrooms',
      roomId
    );
    
    if (!room.participants.includes(userId)) {
      return res.json({
        success: false,
        error: 'User not in room'
      }, 403);
    }
    
    if (!room.grokEnabled) {
      return res.json({
        success: false,
        error: 'Grok is not enabled for this room'
      }, 400);
    }
    
    // Get recent messages for context
    const recentMessages = await databases.listDocuments(
      process.env.DB_ID,
      'messages',
      [
        sdk.Query.equal('roomId', roomId),
        sdk.Query.orderDesc('timestamp'),
        sdk.Query.limit(10)
      ]
    );
    
    // Build context for Grok
    const context = recentMessages.documents
      .reverse()
      .map(msg => `${msg.userName}: ${msg.content}`)
      .join('\n');
    
    // Call Grok API
    const grokResponse = await callGrokAPI(prompt, context);
    
    // Save Grok's response as a message
    const grokMessage = await databases.createDocument(
      process.env.DB_ID,
      'messages',
      sdk.ID.unique(),
      {
        roomId: roomId,
        userId: 'grok',
        userName: 'Grok AI',
        content: grokResponse,
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata: {
          prompt: prompt,
          model: GROK_API.model
        }
      }
    );
    
    // Trigger realtime update
    await triggerRealtimeUpdate(roomId, 'grok_response', grokMessage);
    
    return res.json({
      success: true,
      response: grokResponse,
      messageId: grokMessage.$id
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Grok query failed: ${error.message}`
    }, 500);
  }
}

async function handleGetRoomHistory(roomId, userId, res) {
  try {
    // Verify user is in room
    const room = await databases.getDocument(
      process.env.DB_ID,
      'chatrooms',
      roomId
    );
    
    if (!room.participants.includes(userId)) {
      return res.json({
        success: false,
        error: 'User not in room'
      }, 403);
    }
    
    // Get messages
    const messages = await databases.listDocuments(
      process.env.DB_ID,
      'messages',
      [
        sdk.Query.equal('roomId', roomId),
        sdk.Query.orderDesc('timestamp'),
        sdk.Query.limit(100)
      ]
    );
    
    return res.json({
      success: true,
      room: {
        id: room.$id,
        name: room.name,
        participants: room.participants
      },
      messages: messages.documents.reverse().map(msg => ({
        id: msg.$id,
        userId: msg.userId,
        userName: msg.userName,
        content: msg.content,
        type: msg.type,
        timestamp: msg.timestamp,
        attachments: msg.attachments || [],
        reactions: msg.reactions || []
      }))
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to get room history: ${error.message}`
    }, 500);
  }
}

async function handleGetRooms(userId, res) {
  try {
    const rooms = await databases.listDocuments(
      process.env.DB_ID,
      'chatrooms',
      [
        sdk.Query.search('participants', userId),
        sdk.Query.orderDesc('lastActivity'),
        sdk.Query.limit(50)
      ]
    );
    
    return res.json({
      success: true,
      rooms: rooms.documents.map(room => ({
        id: room.$id,
        name: room.name,
        description: room.description,
        participantCount: room.participants.length,
        lastActivity: room.lastActivity,
        messageCount: room.messageCount,
        grokEnabled: room.grokEnabled
      }))
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to get rooms: ${error.message}`
    }, 500);
  }
}

async function handleLeaveRoom(roomId, userId, res) {
  try {
    const room = await databases.getDocument(
      process.env.DB_ID,
      'chatrooms',
      roomId
    );
    
    const updatedParticipants = room.participants.filter(p => p !== userId);
    
    if (updatedParticipants.length === 0) {
      // Delete empty room
      await databases.deleteDocument(
        process.env.DB_ID,
        'chatrooms',
        roomId
      );
    } else {
      // Update room participants
      await databases.updateDocument(
        process.env.DB_ID,
        'chatrooms',
        roomId,
        {
          participants: updatedParticipants,
          lastActivity: new Date().toISOString()
        }
      );
      
      // Send leave notification
      await databases.createDocument(
        process.env.DB_ID,
        'messages',
        sdk.ID.unique(),
        {
          roomId: roomId,
          userId: 'system',
          userName: 'System',
          content: `User ${userId} left the room`,
          type: 'system',
          timestamp: new Date().toISOString()
        }
      );
    }
    
    return res.json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    return res.json({
      success: false,
      error: `Failed to leave room: ${error.message}`
    }, 500);
  }
}

async function callGrokAPI(prompt, context) {
  const messages = [
    {
      role: 'system',
      content: 'You are Grok, a helpful AI assistant integrated into a chat application.'
    }
  ];
  
  if (context) {
    messages.push({
      role: 'system',
      content: `Recent conversation context:\n${context}`
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt
  });
  
  const response = await fetch(GROK_API.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROK_API.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    })
  });
  
  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

async function triggerRealtimeUpdate(roomId, eventType, data) {
  // This would trigger Appwrite realtime updates
  // In production, this happens automatically when documents are created/updated
  console.log(`Realtime update: ${eventType} in room ${roomId}`, data);
}