# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

# ffmpeg + openssl (Prisma precisa do openssl)
RUN apk add --no-cache ffmpeg openssl

# Apenas dependências de produção
COPY package.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate

# Copiar JS compilado
COPY --from=builder /app/dist ./dist/

# Entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
