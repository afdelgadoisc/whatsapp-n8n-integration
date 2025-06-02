FROM node:20-alpine
WORKDIR /usr/src/app
COPY src/package*.json ./
RUN npm ci --only=production
COPY src/ .
CMD [ "npm", "start" ]