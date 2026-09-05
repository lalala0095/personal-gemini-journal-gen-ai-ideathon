# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and config
COPY . .

# Build Vite frontend and bundled server.cjs
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built distribution from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Use non-root node user for container security
USER node

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
