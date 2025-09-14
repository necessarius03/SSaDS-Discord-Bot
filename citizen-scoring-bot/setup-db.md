# Database Setup Instructions

## Step-by-step setup:

1. **Install dependencies:**
   ```bash
   cd citizen-scoring-bot
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL
   ```

3. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Optional - Open Prisma Studio to view data:**
   ```bash
   npm run db:studio
   ```

## Verify setup:

The bot will automatically:
- Connect to the database on startup
- Initialize default badges
- Create tables if they don't exist

## Troubleshooting:

### Connection issues:
```bash
# Test connection
npx prisma db pull
```

### Reset database:
```bash
npx prisma migrate reset
```

### View generated client:
```bash
npx prisma generate
```