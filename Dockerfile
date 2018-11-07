FROM node:8-alpine

RUN mkdir /app

WORKDIR /app

RUN chown -R node:node .

COPY package.json .

RUN npm i --silent

COPY dist/ ./

USER node

EXPOSE 3000

CMD ["npm", "start"]