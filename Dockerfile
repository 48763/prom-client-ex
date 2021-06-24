FROM node:8.11.1-alpine

WORKDIR /usr/app/prom-client

COPY src .

RUN set -x \
	&& npm config set registry http://registry.npmjs.org/ \
	&& npm install 

CMD [ "npm", "run", "server" ]
