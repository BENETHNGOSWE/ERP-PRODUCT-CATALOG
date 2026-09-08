# Production Dockerfile for Coolify & Docker Deployments
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for fast layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy source files
COPY . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Declare persistent data storage directory
RUN mkdir -p /app/data

# Expose container port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
