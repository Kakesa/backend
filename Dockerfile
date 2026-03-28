# Stage 1: Build Frontend (Sushi)
FROM oven/bun:1 AS builder-frontend
WORKDIR /app/sushi
COPY sushi/package.json sushi/bun.lockb ./
RUN bun install
COPY sushi/ ./
RUN bun run build

# Stage 2: Build Backend (Shadow) and Serve
FROM node:20-alpine
WORKDIR /app/shadow

# Copy backend dependencies
COPY shadow/package.json ./
RUN npm install --production

# Copy backend source code
COPY shadow/ ./

# Copy built frontend assets from the first stage
COPY --from=builder-frontend /app/sushi/dist /app/sushi/dist

# Expose the backend port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]
