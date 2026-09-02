# Single-image production build: the API and the built web app are served
# from ONE origin (the same Express process), so the Telegram Mini App never
# needs CORS or a separately configured VITE_API_BASE_URL.
#
#   fly deploy          (from the repo root, app = fooderabot-api)
#
# The legacy two-container setup (backend/Dockerfile + webapp/Dockerfile with
# nginx) remains available via docker-compose for self-hosting.

# ---- stage 1: build the web app -------------------------------------------
FROM node:20-slim AS webapp-build
WORKDIR /src/webapp
COPY webapp/package.json webapp/package-lock.json* ./
RUN npm install
COPY webapp/ ./
RUN npm run build

# ---- stage 2: build the backend -------------------------------------------
# Alpine's musl/OpenSSL setup makes Prisma's engine auto-detection unreliable
# ("Could not parse schema engine response" crash loops), so we use node:*-slim
# (Debian) instead - but slim strips out the openssl package too, so it must be
# installed explicitly (exactly as Prisma's own error message asks) in both
# stages, since `prisma generate` in the build stage needs it to pick the right
# engine binary just as much as `prisma migrate deploy` does at runtime.
FROM node:20-slim AS backend-build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /src/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ---- stage 3: runtime ------------------------------------------------------
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV WEBAPP_STATIC_DIR=/app/public
COPY --from=backend-build /src/backend/node_modules ./node_modules
COPY --from=backend-build /src/backend/dist ./dist
COPY --from=backend-build /src/backend/prisma ./prisma
COPY --from=webapp-build /src/webapp/dist ./public
COPY backend/package.json backend/package-lock.json* ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
