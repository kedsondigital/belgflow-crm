# Build stage - não precisa de env vars (usa placeholders, injetados em runtime)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Garante que a pasta public existe (projeto pode não tê-la)
RUN mkdir -p public

# Build com placeholders (next.config.mjs define fallbacks)
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script que injeta env vars em runtime (Easypanel passa na aba Environment)
COPY --from=builder /app/scripts/inject-env.mjs ./scripts/

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Injetar vars e iniciar servidor (vars vêm da aba Environment do Easypanel)
CMD ["sh", "-c", "node scripts/inject-env.mjs && exec node server.js"]
