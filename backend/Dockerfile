FROM node:20-alpine

WORKDIR /app

# Copy only what’s needed for install first
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci --no-cache

# Copy all source files
COPY . . 

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Run compiled server
CMD ["npm", "run", "start"]