FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files and data
COPY dist/ ./dist/
COPY src/data/ ./dist/data/

# Start the bot
CMD ["node", "dist/index.js"]
