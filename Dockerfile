# 1. Use Node 18 on Debian Buster (slim) so we can easily install Chrome dependencies
FROM node:18-bullseye-slim

# 2. Install system-level dependencies required by Puppeteer/Chromium
RUN apt-get update && \
    apt-get install -y \
      chromium \
      chromium-driver \
      libnss3 \
      libxss1 \
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
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 3. Tell Puppeteer inside whatsapp-web.js to use the system-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 4. Set working directory inside container
WORKDIR /usr/src/app

# 5. Copy package.json & package-lock.json and install Node dependencies
COPY package*.json ./
RUN npm install

# 6. Copy all source files into container
COPY . .

# 7. By default, run the bot
CMD ["node", "index.js"]
