FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY . .
RUN npx prisma generate

EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
