FROM node:20-alpine

RUN addgroup -S kitchen-kabinet-back && adduser -S podman-kabinet -G kitchen-kabinet-back

WORKDIR /app

COPY package*.json tsconfig.json ./

RUN npm ci --no-cache

COPY . .

RUN node node_modules/.bin/prisma generate

RUN npm run build

RUN chown -R podman-kabinet:kitchen-kabinet-back /app

USER podman-kabinet

EXPOSE 3001

CMD ["npm", "run", "start"]
