FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.* ./

RUN yarn install

COPY . .

RUN yarn run build

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main"]