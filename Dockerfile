# Production Dockerfile for Coolify & Docker Deployments
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for fast layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Declare persistent data storage volume
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Expose container port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
