FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl

# Force cache bust
RUN echo "Build timestamp: $(date)" > /tmp/buildtime

# Copy everything from citizen-scoring-bot directory
COPY citizen-scoring-bot/ ./

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build

# Create logs directory
RUN mkdir -p logs

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]