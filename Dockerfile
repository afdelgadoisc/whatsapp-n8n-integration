FROM node:18-bullseye-slim

# 1) Create session folder (root-owned is fine here)
RUN mkdir -p /app/session \
  && chmod 700 /app/session

# 2) Install Chrome/Puppeteer dependencies and git (still as root)
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

WORKDIR /app

# 3) Copy package files and install as root, so node_modules can be created
COPY package*.json ./
RUN npm install

# 4) Now switch to the unprivileged 'node' user
RUN chown -R node:node /app
USER node

# 5) Copy the rest of your application code (ownership is already set to node)
COPY --chown=node:node . .

# 6) Expose ports if needed (omit if you have no HTTP server)
EXPOSE 3000

# 7) Launch the bot as the 'node' user
CMD ["npm", "start"]
