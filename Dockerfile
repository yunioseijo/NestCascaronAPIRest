# Multi-stage build for NestJS backend
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* ./
# Prefer npm here to avoid relying on global Yarn variants
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Only install production deps
COPY package.json yarn.lock* ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy any runtime assets that might be needed (optional)
# COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

# Use Nest's production start script
CMD ["npm", "run", "start:prod"]

