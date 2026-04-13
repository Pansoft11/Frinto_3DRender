FROM node:18-alpine

WORKDIR /app

# Copy files
COPY package.json package-lock.json ./
COPY worker ./worker
COPY processing ./processing

# Install Node dependencies
RUN npm install --workspace=plan2render-worker

# Install Python
RUN apk add --no-cache python3 py3-pip

# Install Python dependencies
RUN pip install -r processing/requirements.txt

# Run worker
CMD ["npm", "run", "start", "--workspace=plan2render-worker"]
