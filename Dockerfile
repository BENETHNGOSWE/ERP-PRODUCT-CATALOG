# Production Dockerfile for Coolify
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for fast layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose container port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
