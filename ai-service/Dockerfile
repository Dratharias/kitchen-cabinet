FROM node:20-alpine

WORKDIR /app

# Install Python for potential AI CLI tools and utilities
RUN apk add --no-cache python3 py3-pip curl bash wget git jq

# Install AI CLI tools globally
RUN npm install -g @google/generative-ai

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install Gemini CLI via pip
RUN pip3 install --break-system-packages gemini-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Create directories for config
RUN mkdir -p /root/.config/claude-code /root/.claude

# Copy Claude Code settings with pre-allowed permissions BEFORE source code
COPY .claude/settings.local.json /root/.claude/settings.local.json

# Copy source code
COPY . .

EXPOSE 3002

CMD ["npm", "run", "dev"]
