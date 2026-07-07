# ==========================================
# Builder Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies and generate prisma client
RUN npm ci
RUN npx prisma generate

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Add a script to run migrations and start the app
RUN echo '#!/bin/sh' > start.sh && \
    echo 'npx prisma db push --accept-data-loss' >> start.sh && \
    echo 'node dist/src/main.js' >> start.sh && \
    chmod +x start.sh

EXPOSE 3000

# Start command
CMD ["./start.sh"]
