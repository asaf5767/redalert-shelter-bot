FROM node:20-slim

WORKDIR /app

# Install Python3, pip, ffmpeg for TTS voice notes
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip ffmpeg && \
    pip3 install --break-system-packages edge-tts && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

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
