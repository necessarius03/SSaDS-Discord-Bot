FROM node:18-alpine

WORKDIR /app

# Install dependencies for Prisma and PostgreSQL
RUN apk add --no-cache libc6-compat openssl

# Copy package files and prisma schema BEFORE npm ci
COPY citizen-scoring-bot/package*.json ./
COPY citizen-scoring-bot/prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
RUN npm ci

# Copy source code
COPY citizen-scoring-bot/src ./src/
COPY citizen-scoring-bot/tsconfig.json ./

# Build the application
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port for health check
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]