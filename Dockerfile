# ───────────────────────────────────────────────
# Stage 1: Install dependencies
# ───────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first (leverage Docker cache)
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --omit=dev

# ───────────────────────────────────────────────
# Stage 2: Production image
# ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 lingoswap

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY server.js ./
COPY src ./src
COPY views ./views
COPY public ./public

# Create logs directory
RUN mkdir -p logs && chown lingoswap:nodejs logs

# Switch to non-root user
USER lingoswap

# Expose the app port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Start the app
ENV NODE_ENV=production
CMD ["node", "server.js"]
