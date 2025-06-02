# Use Alpine-based Node, but we’ll install git as well
FROM node:20-alpine

# 1. Install git (and ca-certificates so HTTPS works)
#    - update indices
#    - install git
#    - clean up apk caches
RUN apk update \
  && apk add --no-cache git ca-certificates \
  && rm -rf /var/cache/apk/*

# 2. Create and set working directory inside container
WORKDIR /usr/src/app

# 3. Copy package.json + package-lock.json (if present)
COPY src/package*.json ./

# 4. Run npm ci now that git is available
RUN npm ci --only=production

# 5. Copy application source code into the container
COPY src/ .

# 6. Expose ports only if you run an HTTP server (optional)
#    EXPOSE 3000

# 7. Default command
CMD [ "npm", "start" ]
