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

# Install Python3, pip, ffmpeg for TTS voice notes (after Node setup to avoid breaking SSL/DNS)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates python3 python3-pip ffmpeg && \
    pip3 install --break-system-packages edge-tts && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Start the bot
CMD ["node", "dist/index.js"]
