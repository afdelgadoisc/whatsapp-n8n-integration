# Use Node 18 (Debian Bullseye slim) so that we can install a system
# Chromium that Puppeteer can point at.
FROM node:20-bullseye-slim


# 1) Install all libraries needed by Chromium/Puppeteer
#    and the "chromium" package itself
RUN apt-get update && \
  apt-get install -y \
  chromium \
  chromium-driver \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango1.0-0 \
  libpangocairo-1.0-0 \
  libgtk-3-0 \
  libx11-6 \
  libxkbcommon0 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# 2) Tell Puppeteer to skip its own Chromium download and use our system-installed one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 3) Create application directory inside container
WORKDIR /usr/src/app

# 4) Copy package.json / package-lock.json, install Node modules
COPY package*.json ./
RUN npm install

# 5) Copy the rest of the code
COPY . .

# 6) By default, run index.js
CMD ["node", "index.js"]
