FROM node:18-alpine

WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files first
COPY citizen-scoring-bot/package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema
COPY citizen-scoring-bot/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY citizen-scoring-bot/src ./src/
COPY citizen-scoring-bot/tsconfig.json ./

# Build the application
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]