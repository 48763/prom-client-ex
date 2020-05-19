'use strict';

const http = require('http');
const port = 9300;
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const requestHandler = (request, response) => {
    if (request.url === '/metrics') {
        response.end(client.register.metrics());
    }
    response.end('Hello Node.js Server!');
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err);
    }

    console.log(`server is listening on ${port}`);
});