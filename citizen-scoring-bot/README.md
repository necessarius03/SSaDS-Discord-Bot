# Citizen Scoring Discord Bot

A comprehensive Discord bot for tracking and gamifying user engagement through a citizen scoring system.

## Features

### Core Scoring System
- **Message Points**: Earn points for sending messages
- **Quality Message Bonus**: Extra points for longer, more meaningful messages
- **Reaction Bonuses**: Bonus points when your messages receive reactions
- **Voice Activity**: Points for time spent in voice channels
- **Anti-Spam Protection**: Penalty system for spam detection

### Gamification
- **Level System**: Users progress through levels based on experience points
- **Badge System**: Earn badges for various achievements
- **Leaderboards**: Global, weekly, and monthly rankings
- **Citizen of the Month**: Special recognition for top contributors

### Social Features
- **Point Donations**: Users can donate points to each other
- **Vouching System**: Established users can vouch for newcomers
- **Group Challenges**: Server-wide events and challenges

### Admin Dashboard
- **Point Adjustments**: Manually adjust user points
- **Badge Management**: Award badges and create custom badges
- **User History**: View detailed point history for any user
- **Server Statistics**: Comprehensive analytics and statistics

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Discord Bot Token

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd citizen-scoring-bot
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Build the bot:
```bash
npm run build
```

6. Start the bot:
```bash
npm start
```

### Development

```bash
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Discord bot token | Required |
| `DISCORD_CLIENT_ID` | Discord application client ID | Required |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `BASE_MESSAGE_POINTS` | Points per message | `1` |
| `QUALITY_MESSAGE_MULTIPLIER` | Multiplier for quality messages | `2` |
| `REACTION_BONUS_THRESHOLD` | Reactions needed for bonus | `3` |
| `VOICE_CHANNEL_POINTS_PER_MINUTE` | Points per minute in voice | `0.5` |

## Commands

### User Commands
- `/profile [user]` - View user profile and statistics
- `/leaderboard [period]` - View rankings (all-time, weekly, monthly)

### Admin Commands
- `/admin adjust-points <user> <points> <reason>` - Manually adjust points
- `/admin award-badge <user> <badge>` - Award a badge to a user
- `/admin user-history <user> [limit]` - View user's point history
- `/admin server-stats` - View server statistics

## Deployment

### Fly.io

1. Install Fly CLI and login:
```bash
fly auth login
```

2. Create the app:
```bash
fly create citizen-scoring-bot
```

3. Set up secrets:
```bash
fly secrets set DISCORD_TOKEN=your_token_here
fly secrets set DISCORD_CLIENT_ID=your_client_id_here
fly secrets set DATABASE_URL=your_database_url_here
```

4. Deploy:
```bash
fly deploy
```

### Docker

```bash
docker build -t citizen-scoring-bot .
docker run -d citizen-scoring-bot
```

## Architecture

The bot follows a clean architecture pattern with clear separation of concerns:

```
src/
├── commands/     # Slash command handlers
├── events/       # Discord.js event listeners
├── services/     # Business logic services
├── models/       # Database models (Prisma)
├── utils/        # Utility functions and configuration
├── middleware/   # Custom middleware
└── types/        # TypeScript type definitions
```

## Database Schema

The bot uses Prisma ORM with PostgreSQL, featuring:
- **Users**: User profiles and statistics
- **PointHistory**: Detailed history of all point transactions
- **Badges**: Badge definitions and user assignments
- **Challenges**: Server-wide challenges and events
- **Donations**: Point transfers between users
- **Vouches**: User vouching system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.