FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm install -g ts-node-dev nodemon

COPY . .

EXPOSE 3000

CMD ["ts-node-dev", "--respawn", "--transpile-only", "src/server.ts"]
