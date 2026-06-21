# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/presence-service/package.json ./

# Install dependencies
RUN npm install --omit=dev

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy installed dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy service source code
COPY services/presence-service/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5007

CMD ["node", "server.js"]
