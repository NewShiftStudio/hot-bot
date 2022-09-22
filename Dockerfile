FROM node:alpine

WORKDIR /hot-bot

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build

CMD [ "node",  "dist/src/main.js" ]