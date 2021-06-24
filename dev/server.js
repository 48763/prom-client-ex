'use strict'

const express = require('express');
const app = express();
const port = 9400;

const client = require('prom-client');
const Registry = client.Registry;
const register = new Registry();
const collectDefaultMetrics = client.collectDefaultMetrics;

const httpRequest = require('./metrics/httpRequest');
const registryModule = require('./registryModule');

registryModule({register, timeout : 2000 });
collectDefaultMetrics({register});

// Runs before each requests
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now();
  next();
});

app.get('/favicon.ico', (req, res) => {
    res.status(204);
});

app.get('/', (req, res, next) => {
  setTimeout(() => {
    res.json({ message: 'Hello World!' });
    next();
  }, Math.round(Math.random() * 200));
});

app.get('/metrics', (req, res, next) => {
  res.end(register.metrics());
  next();
});

// Error handler
app.use((err, req, res, next) => {
  res.statusCode = 500;
  // Do not expose your error in production
  res.json({ error: err.message });
  next();
})

// Runs after each requests
app.use(httpRequest(register));

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(metricsInterval);

  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    process.exit(0);
  })
})
