# MemeVersus Frontend

The frontend application for MemeVersus, built with React, TypeScript, and Tailwind CSS.

## Structure

```
src/
├── components/       # Reusable React components
│   ├── GameRoomUI/  # Game room interface
│   ├── GameModes/   # Game mode selection
│   └── Navbar/      # Navigation bar
├── pages/           # Page components
│   ├── HomePage/    # Landing page
│   ├── FrameRace/   # Frame race game
│   ├── SoundSnatch/ # Sound snatch game
│   └── TypeClash/   # Type clash game
├── services/        # API and WebSocket services
├── types/           # TypeScript types
├── utils/           # Utility functions
└── config/          # Frontend configuration
```

## Features

- Real-time game state updates via WebSocket
- Responsive UI with Tailwind CSS
- Type-safe development with TypeScript
- Component-based architecture
- Game mode selection
- User authentication
- Wallet integration
- Error handling
- Loading states
- Animations

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   VITE_WS_URL=ws://localhost:3000
   VITE_API_URL=http://localhost:3000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Components

### GameRoomUI
- Real-time game state display
- Player list
- Chat system
- Game controls
- Score display

### GameModes
- Game mode selection cards
- Mode descriptions
- Player count
- Difficulty levels

### Navbar
- User authentication
- Wallet connection
- Navigation menu
- User profile

## Pages

### HomePage
- Welcome message
- Game mode selection
- Featured games
- User stats

### FrameRace
- Frame sequence display
- Answer input
- Timer
- Score tracking

### SoundSnatch
- Audio player
- Answer input
- Timer
- Score tracking

### TypeClash
- Text display
- Input field
- Timer
- Score tracking

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request 