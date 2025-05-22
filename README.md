# MemeVersus

A decentralized gaming platform built with React, Node.js, and Sui blockchain.

## Project Structure

```
memeversus/
├── src/                    # Frontend React application
│   ├── components/        # Reusable React components
│   ├── pages/            # Page components
│   ├── services/         # API and WebSocket services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── config/           # Frontend configuration
│
├── backend/               # Backend services
│   ├── node/             # Node.js backend
│   │   ├── src/         # Source code
│   │   ├── tests/       # Backend tests
│   │   └── config/      # Backend configuration
│   │
│   └── move/            # Sui Move smart contracts
│
├── scripts/              # Build and deployment scripts
└── .github/             # GitHub Actions workflows
```

## Features

- Real-time multiplayer gaming
- WebSocket-based game state synchronization
- Sui blockchain integration
- Secure authentication
- Responsive UI with Tailwind CSS
- TypeScript for type safety
- Docker containerization
- CI/CD pipeline

## Prerequisites

- Node.js 20.x
- npm 10.x
- Docker and Docker Compose
- Sui CLI

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/divyanshkhurana06/memeversus.git
   cd memeversus
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend/node
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Frontend (.env)
   VITE_WS_URL=ws://localhost:3000
   VITE_API_URL=http://localhost:3000

   # Backend (.env)
   PORT=3000
   REDIS_URL=redis://localhost:6379
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development servers:
   ```bash
   # Start frontend
   npm run dev

   # Start backend (in another terminal)
   cd backend/node
   npm run dev
   ```

## Development

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:3000`
- WebSocket server runs on `ws://localhost:3000`

## Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend/node
npm test
```

## Deployment

The project includes Docker configuration for easy deployment:

```bash
# Build and start containers
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 