FROM node:20-bullseye AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --silent

COPY . .

RUN npm run build

# Production image
FROM node:20-bullseye-slim AS runner
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production --silent

COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000

RUN useradd -m appuser || true
USER appuser

CMD ["npm", "start"]
