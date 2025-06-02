# ───────────────────────────────────────────────────────────────────────────────
# 1) Use Node 18 (Bullseye‐slim) as our base
#    If you prefer Node 20, you could use node:20-bullseye-slim instead.
FROM node:18-bullseye-slim

# ───────────────────────────────────────────────────────────────────────────────
# 2) Create a dedicated session folder for LocalAuth and set permissions
RUN mkdir -p /app/session \
  && chown node:node /app/session \
  && chmod 700 /app/session

# ───────────────────────────────────────────────────────────────────────────────
# 3) Install all the OS packages Chromium/Puppeteer need, plus git
RUN apt-get update && \
  apt-get install -y \
  git \              
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

# ───────────────────────────────────────────────────────────────────────────────
# 4) Switch to the “node” user for better security (optional but recommended)
USER node
WORKDIR /app

# ───────────────────────────────────────────────────────────────────────────────
# 5) Copy package.json + package-lock.json (if you have one) first,
#    then run npm install. Because we installed git above,
#    npm can now clone whatsapp-web.js from GitHub properly.
COPY --chown=node:node package*.json ./
RUN npm install

# ───────────────────────────────────────────────────────────────────────────────
# 6) Copy the rest of your application code
COPY --chown=node:node . .

# ───────────────────────────────────────────────────────────────────────────────
# 7) Expose any ports you need (if your bot has a webserver; otherwise omit)
EXPOSE 3000

# ───────────────────────────────────────────────────────────────────────────────
# 8) Start your bot
CMD ["node", "index.js"]
# ───────────────────────────────────────────────────────────────────────────────
