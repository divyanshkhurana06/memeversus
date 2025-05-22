# MemeVersus Backend

The backend service for MemeVersus, handling game logic, WebSocket connections, and blockchain interactions.

## Structure

```
src/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── game-modes/       # Game mode implementations
├── middleware/       # Express middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Features

- WebSocket-based real-time game state management
- RESTful API endpoints
- Sui blockchain integration
- Redis for caching and pub/sub
- JWT authentication
- Error handling middleware
- Request validation
- Logging system

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   PORT=3000
   REDIS_URL=redis://localhost:6379
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   JWT_SECRET=your_jwt_secret
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Game Rooms
- `POST /api/rooms` - Create game room
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/:id/join` - Join room
- `POST /api/rooms/:id/leave` - Leave room

### Game Actions
- `POST /api/game/start` - Start game
- `POST /api/game/action` - Send game action
- `GET /api/game/state` - Get game state

## WebSocket Events

### Room Events
- `createRoom` - Create new game room
- `joinRoom` - Join existing room
- `leaveRoom` - Leave room
- `roomUpdate` - Room state update

### Game Events
- `gameStart` - Game started
- `gameAction` - Game action received
- `gameStateUpdate` - Game state update
- `gameEnd` - Game ended

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

The backend can be deployed using Docker:

```bash
# Build and start container
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request 