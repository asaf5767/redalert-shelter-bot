FROM node:20-slim

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code and data
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Copy data files to dist
RUN cp -r src/data dist/data

# Remove devDependencies to slim down the image
RUN npm prune --production

# Start the bot
CMD ["node", "dist/index.js"]
