# Alpine's musl/OpenSSL setup makes Prisma's engine auto-detection unreliable
# ("Could not parse schema engine response" crash loops), so we use node:*-slim
# (Debian) instead - but slim strips out the openssl package too, so it must be
# installed explicitly (exactly as Prisma's own error message asks) in both
# stages, since `prisma generate` in the build stage needs it to pick the right
# engine binary just as much as `prisma migrate deploy` does at runtime. The
# runtime stage reuses the exact node_modules (and engines) built in the build
# stage instead of reinstalling, so nothing can drift between the two.
FROM node:20-slim AS build
# python3/build-essential: argon2's native binding falls back to compiling
# from source (node-gyp) when no prebuilt binary matches this platform, and
# node:*-slim ships neither.
RUN apt-get update -y && apt-get install -y openssl python3 build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json package-lock.json* ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
