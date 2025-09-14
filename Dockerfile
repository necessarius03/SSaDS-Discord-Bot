FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy everything from citizen-scoring-bot directory
COPY citizen-scoring-bot/ ./

# Install ALL dependencies (including dev deps for TypeScript)
RUN npm ci

# Generate Prisma client manually (after all files are copied)
RUN npx prisma generate

# Build TypeScript
RUN npx tsc

# Remove dev dependencies after build
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]