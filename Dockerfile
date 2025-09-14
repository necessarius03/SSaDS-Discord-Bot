FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

# Copy everything from citizen-scoring-bot at once
COPY citizen-scoring-bot/ ./

# Install dependencies
RUN npm ci

# Build
RUN npm run build

# Start
CMD ["npm", "start"]