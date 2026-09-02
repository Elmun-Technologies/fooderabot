# Alpine's musl/OpenSSL setup makes Prisma's engine auto-detection unreliable
# ("Could not parse schema engine response" crash loops) - node:*-slim (Debian)
# avoids that whole class of bug, so both stages use it and the runtime stage
# reuses the exact node_modules (and prisma engines) built in the build stage
# instead of reinstalling, so nothing can drift between generate-time and
# run-time binaries.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json package-lock.json* ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
