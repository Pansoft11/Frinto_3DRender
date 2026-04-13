FROM node:18-alpine

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
COPY backend ./backend

# Install dependencies
RUN npm install --workspace=plan2render-backend

# Create required directories
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run backend
CMD ["npm", "run", "start", "--workspace=plan2render-backend"]
