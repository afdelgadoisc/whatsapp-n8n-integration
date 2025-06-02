# 1. Start from Node 18 (or 20, if you like)
FROM node:18-bullseye-slim

# 2. Create a session folder and ensure permissions
RUN mkdir -p /app/session && \
  chown node:node /app/session && \
  chmod 700 /app/session

# 3. Install all the libraries Chromium needs
RUN apt-get update && \
  apt-get install -y \
  gconf-service \
  libgbm-dev \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  wget && \
  rm -rf /var/lib/apt/lists/*

# 4. Set working dir and copy only package files first
WORKDIR /app
COPY package*.json ./

# 5. Install from the Docker-friendly fork of whatsapp-web.js
RUN npm install

# 6. Copy the rest of your code
COPY . .

# 7. Run your bot code
CMD ["node", "index.js"]
