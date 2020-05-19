FROM node:8.11.1-alpine

WORKDIR /usr/src/app

COPY package.json .

RUN npm config set registry http://registry.npmjs.org/ && npm install 

CMD [ "npm", "run", "server" ]