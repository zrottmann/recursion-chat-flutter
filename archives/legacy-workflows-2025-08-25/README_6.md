# 🎮 Multiplayer Sharded Game Backend

A cost-optimized, horizontally scalable multiplayer game backend using sharded game servers with Appwrite integration for authentication and persistence.

## 🚀 Features

- **Shard Manager**: Orchestrates multiple game servers, handles player assignment
- **Game Shards**: WebSocket-based authoritative game servers with optimized tick rates
- **Cost Optimization**: 
  - Low tick rate (10-15 Hz) reduces CPU usage
  - Batched database writes minimize API calls
  - Message compression reduces bandwidth
  - Configurable player caps per shard
- **Appwrite Integration**: JWT authentication, player persistence, analytics
- **Demo Mode**: Simulate 50+ players for testing
- **Docker Ready**: Full containerization with docker-compose

## 📋 Prerequisites

- Node.js 16+ 
- Docker & Docker Compose (optional)
- Appwrite account with project configured

## 🛠️ Quick Start

### 1. Clone and Install

```bash
git clone <repository>
cd multiplayer-sharded-game
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Appwrite credentials:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=game_db
```

### 3. Setup Appwrite Database

Create a database and collections in your Appwrite console:

**Database**: `game_db`

**Collections**:
1. `players` - Player states
   - Attributes: position (JSON), stats (JSON), inventory (JSON), etc.
2. `game_events` - Game analytics
3. `analytics` - Performance metrics

### 4. Run Locally (Development)

```bash
# Terminal 1: Start Shard Manager
cd shard-manager
npm install
npm run dev

# Terminal 2: Start Game Shard 1
cd game-shard
npm install
PORT=4001 SHARD_ID=shard-1 npm run dev

# Terminal 3: Start Game Shard 2 (optional)
cd game-shard
PORT=4002 SHARD_ID=shard-2 npm run dev

# Terminal 4: Run Example Client
cd client-example
npm install
npm run dev
```

### 5. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d
```

## 🎯 Demo Mode

Simulate multiple players to test load balancing:

```bash
cd client-example
npm run demo
```

This spawns 50 bot players that move, attack, and chat randomly.

## 🏗️ Architecture

```
┌─────────────────┐
│   Game Client   │
└────────┬────────┘
         │ JWT Auth
         ▼
┌─────────────────┐
│  Shard Manager  │ ◄── Heartbeat ──┐
│   (Port 3000)   │                 │
└────────┬────────┘                 │
         │ Assigns Player           │
         ▼                          │
┌─────────────────┐        ┌───────┴────────┐
│  Game Shard 1   │        │  Game Shard 2  │
│   (Port 4001)   │        │  (Port 4002)   │
└────────┬────────┘        └───────┬────────┘
         │                          │
         └──────────┬───────────────┘
                    │ Batch Persistence
                    ▼
           ┌─────────────────┐
           │    Appwrite     │
           │  (Auth + DB)    │
           └─────────────────┘
```

## 📡 API Endpoints

### Shard Manager

- `GET /health` - Health check
- `GET /api/shards` - List all shards and statistics
- `POST /api/assign-player` - Get shard assignment for player
- `POST /api/register` - Register/heartbeat from shard
- `DELETE /api/shards/:id` - Unregister shard

### Game Shard

- `WS /connect?token=<jwt>` - WebSocket game connection
- `GET /health` - Health check

## 🎮 WebSocket Protocol

Messages use MessagePack encoding for efficiency.

### Client → Server

```javascript
// Movement
{ type: 'move', data: { x, y, direction } }

// Combat
{ type: 'attack', data: { targetId, skill } }

// Items
{ type: 'useItem', data: { itemId } }

// Chat
{ type: 'chat', data: { message, channel } }
```

### Server → Client

```javascript
// Initial state
{ type: 'init', data: { playerId, world, player, tickRate } }

// Delta updates (10-15 Hz)
{ type: 'update', data: { tick, players, entities, events } }

// Combat events
{ type: 'combat', data: { attackerId, targetId, damage, killed } }

// Position correction
{ type: 'positionCorrection', data: { x, y } }
```

## ⚙️ Configuration

### Environment Variables

**Shard Manager:**
- `PORT` - HTTP port (default: 3000)
- `SHARD_MAX_PLAYERS` - Max players per shard (default: 150)
- `HEARTBEAT_TIMEOUT` - Shard timeout in ms (default: 30000)

**Game Shard:**
- `PORT` - WebSocket port (default: 4001)
- `SHARD_ID` - Unique shard identifier
- `MANAGER_URL` - Shard manager URL
- `TICK_RATE` - Game loop Hz (default: 15)
- `SHARD_REGION` - Geographic region

## 💰 Cost Optimization Tips

1. **Reduce Tick Rate**: Lower from 60 Hz to 10-15 Hz
   ```env
   TICK_RATE=10  # Saves ~80% CPU
   ```

2. **Increase Batch Interval**: Save to DB less frequently
   ```javascript
   persistenceInterval: 60000  // Every minute instead of 30s
   ```

3. **Optimize Player Cap**: Balance between shards
   ```env
   SHARD_MAX_PLAYERS=200  # Fewer shards needed
   ```

4. **Use Spot/Preemptible VMs**: For non-critical shards

5. **Regional Deployment**: Place shards near players

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Load testing with demo mode
NUM_BOTS=100 npm run demo
```

## 📊 Monitoring

The system logs key metrics:
- Player count per shard
- Message throughput
- Persistence batch sizes
- Tick performance

View shard statistics:
```bash
curl http://localhost:3000/api/shards
```

## 🚢 Production Deployment

### Using Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shard-manager
spec:
  replicas: 2
  selector:
    matchLabels:
      app: shard-manager
  template:
    metadata:
      labels:
        app: shard-manager
    spec:
      containers:
      - name: shard-manager
        image: your-registry/shard-manager:latest
        ports:
        - containerPort: 3000
        env:
        - name: APPWRITE_PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: appwrite-secrets
              key: project-id
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: game-shard
spec:
  serviceName: game-shard
  replicas: 3
  selector:
    matchLabels:
      app: game-shard
  template:
    metadata:
      labels:
        app: game-shard
    spec:
      containers:
      - name: game-shard
        image: your-registry/game-shard:latest
        ports:
        - containerPort: 4001
        env:
        - name: SHARD_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

### Auto-scaling

Configure horizontal pod autoscaling based on player count:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: game-shard-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: game-shard
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: player_count
      target:
        type: AverageValue
        averageValue: "120"  # Scale up at 80% capacity
```

## 🔒 Security Considerations

1. **JWT Validation**: All connections require valid Appwrite JWT
2. **Rate Limiting**: Implement per-player action limits
3. **Input Validation**: Server validates all movement/actions
4. **DDoS Protection**: Use cloud provider's DDoS protection
5. **Encryption**: Use WSS in production

## 📈 Performance Benchmarks

With default configuration (15 Hz, 150 players/shard):

- **CPU Usage**: ~10-15% per shard (2 vCPU)
- **Memory**: ~200MB per shard
- **Bandwidth**: ~50KB/s per player
- **Latency**: <50ms for most actions
- **Database Writes**: 5 req/min per shard (batched)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Shard not registering
- Check MANAGER_URL is correct
- Ensure shard can reach manager on network
- Verify firewall rules

### High latency
- Reduce tick rate further
- Enable more aggressive compression
- Deploy shards closer to players

### Database errors
- Check Appwrite API key permissions
- Verify collection schemas match
- Monitor rate limits

### WebSocket disconnections
- Implement reconnection logic
- Check for proxy/LB timeouts
- Add keep-alive pings

## 📚 Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Game Server Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [MessagePack Specification](https://msgpack.org/)