# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig*.json ./

# Install dependencies including devDependencies for building
# This layer will be cached if package files haven't changed
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy only source code needed for build
# Separate copy commands to maximize cache efficiency
COPY src ./src
COPY instrument.ts ./

# Build TypeScript to JavaScript
RUN pnpm run build

# Production stage
FROM node:22-slim

WORKDIR /app

# Install system dependencies first (rarely changes)
# Combine RUN commands to reduce layers
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nodejs && \
    corepack enable pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies with cache mount for faster rebuilds
# The cache mount persists pnpm cache between builds
RUN --mount=type=cache,target=/root/.local/share/pnpm \
    pnpm install --prod --frozen-lockfile

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Set environment variable for process type (API or WORKER)
ENV PROCESS_TYPE=api

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Dynamic command based on PROCESS_TYPE environment variable
CMD sh -c 'if [ "$PROCESS_TYPE" = "worker" ]; then \
            echo "Starting as Temporal worker process..."; \
            node dist/src/temporal/worker/index.js; \
          else \
            echo "Starting as API server..."; \
            node dist/src/main.js; \
          fi'