'use strict'

const express = require('express');
const client = require('prom-client');
const httpRequest = require('./metrics/httpRequest');
const osCpuInfoLinux = require('./metrics/osCpuInfoLinux');
const osMemoryInfoLinux = require('./metrics/osMemoryInfoLinux');

const app = express();
const port = 9300;

const Registry = client.Registry;
const registry = new Registry();

// Runs before each requests
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now();
  next();
})

app.get('/', (req, res, next) => {
  setTimeout(() => {
    res.json({ message: 'Hello World!' });
    next();
  }, Math.round(Math.random() * 200));
});

app.get('/favicon.ico', (req, res) => {
    res.status(204);
});

app.get('/metrics', (req, res, next) => {
  res.end(registry.metrics());
  next();
})

// Error handler
app.use((err, req, res, next) => {
  res.statusCode = 500;
  // Do not expose your error in production
  res.json({ error: err.message });
  next();
})

// Runs after each requests
app.use(httpRequest(registry));
app.use(osCpuInfoLinux(registry));
app.use(osMemoryInfoLinux(registry));

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
