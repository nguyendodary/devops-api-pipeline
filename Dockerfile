# ============================================================
# Stage 1: Dependencies
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && \
    cp -R node_modules /prod_modules && \
    npm ci

# ============================================================
# Stage 2: Build (Prisma generate)
# ============================================================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

# ============================================================
# Stage 3: Production
# ============================================================
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=deps /prod_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
