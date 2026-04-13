FROM node:18-alpine

WORKDIR /app

# Copy all workspace files
COPY package.json package-lock.json ./
COPY backend ./backend
COPY worker ./worker
COPY frontend ./frontend
COPY processing ./processing

# Install dependencies for all workspaces
RUN npm install --workspaces

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Create required directories
RUN mkdir -p /app/uploads /app/outputs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Return to app root
WORKDIR /app

# Default command (backend + worker)
CMD ["npm", "run", "start-all"]
