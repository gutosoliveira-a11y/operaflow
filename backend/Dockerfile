FROM node:18-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

RUN npm ci

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

COPY . .

RUN rm -rf dist && npm run build && test -f dist/main.js && echo "BUILD OK: dist/main.js found" || (echo "BUILD FAILED: dist/main.js missing" && ls -la dist/ && exit 1)

EXPOSE 3000

CMD ["sh", "-c", "echo '=== CMD OK ===' && ls -la /app/start.js /app/dist/main.js && echo '=== FILES OK ===' && npx prisma migrate deploy && echo '=== MIGRATIONS OK ===' && node /app/start.js"]
