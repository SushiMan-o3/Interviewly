# Dev-oriented image: runs the Vite dev server with hot reload.
FROM node:22-slim

WORKDIR /app

# Install deps first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host exposes the dev server on all interfaces so it's reachable from the host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
