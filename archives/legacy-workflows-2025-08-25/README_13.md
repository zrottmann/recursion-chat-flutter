# SlumLord RPG with Grok AI Integration

An innovative browser-based RPG featuring AI-powered NPC conversations using xAI's Grok API.

## 🤖 Features

- **Dynamic NPC Conversations**: NPCs respond intelligently using Grok AI
- **Professional Chat Interface**: Modern orange/amber themed chat UI
- **Conversation History**: Each NPC maintains individual conversation context
- **Mock Response Fallback**: Graceful degradation when API unavailable
- **Character-Specific Personalities**: Each NPC type has unique responses

## 🎮 How to Play

1. **Movement**: Use WASD or Arrow Keys to move your character
2. **NPC Interaction**: Walk near NPCs (colored circles)
3. **Start Dialogue**: Press SPACE when near an NPC
4. **AI Chat**: Select "🤖 Chat with Grok" for AI conversations
5. **Close Dialogue**: Press ESC to exit conversations

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 🔧 Configuration

To use real Grok AI responses (optional):

1. Get an API key from [x.ai](https://x.ai)
2. Set it in the browser console:
   ```javascript
   setGrokApiKey('your-api-key-here')
   ```

Without an API key, the game uses intelligent mock responses.

## 📁 Project Structure

```
├── index.html           # Main game interface
├── package.json         # Dependencies
└── src/
    ├── core/
    │   ├── game-engine-integration.js  # Game system
    │   └── npc-interaction-manager.js  # NPC dialogue
    └── services/
        └── grok-ai.js   # Grok AI integration
```

## 🎯 Key Features

### Grok AI Service
- Complete xAI API integration
- Error handling and fallback system
- Conversation context management
- Character-specific prompts

### NPC Interaction Manager
- Proximity detection system
- Spacebar-triggered dialogues
- Professional chat interface
- Real-time typing indicators

### Game Engine Integration
- Canvas-based rendering
- Mock game environment
- Player movement system
- NPC positioning and detection

## 🛠️ Technologies

- **Frontend**: HTML5 Canvas, JavaScript ES6 Modules
- **AI**: xAI Grok API
- **Build**: Vite
- **Style**: Modern CSS with animations

## 📝 License

MIT License - Feel free to use this as a template for your own AI-powered games.

---

**Created with Claude Code** - The first RPG with integrated AI-powered NPC conversations.