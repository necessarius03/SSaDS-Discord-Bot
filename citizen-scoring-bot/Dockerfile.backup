FROM node:18-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN apk update

COPY package.json package-lock.json* ./

FROM base AS deps
RUN npm ci --only=production

FROM base AS builder
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 botuser

COPY --from=deps --chown=botuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:nodejs /app/dist ./dist
COPY --from=builder --chown=botuser:nodejs /app/prisma ./prisma
COPY --chown=botuser:nodejs package.json ./

RUN mkdir -p logs && chown botuser:nodejs logs

USER botuser

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]