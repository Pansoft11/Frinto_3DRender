FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PYTHON_PATH=/opt/venv/bin/python
ENV PATH="/opt/venv/bin:${PATH}"

COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY worker/package.json ./worker/package.json
COPY frontend/package.json ./frontend/package.json
COPY processing/requirements.txt ./processing/requirements.txt

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv python3-pip \
  && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv \
  && pip install --no-cache-dir -r processing/requirements.txt

RUN npm install --workspaces --include-workspace-root --include=dev

COPY backend ./backend
COPY worker ./worker
COPY frontend ./frontend
COPY processing ./processing
COPY scripts ./scripts

RUN npm run build --workspace=plan2render-frontend \
  && mkdir -p /var/data/uploads /var/data/outputs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => { if (r.statusCode !== 200) process.exit(1) }).on('error', () => process.exit(1))"

CMD ["node", "scripts/render-start.mjs"]
