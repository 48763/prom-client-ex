# ex-prom-client
*prom_client* 是用 *node.js* 製作而成的 *Prometheus* 用戶端套件。支援 histogram、summary、gauges 和 counters 這四種有關資料的測量指標（metric）。

**[!!!本專案善在建構中!!!]**

## Preface
因為在 `prom-client` 原專案中，有許多部分覺得描述不齊全，所以建立此專案，以詳述如何使用套件，並穿插官方文件解釋，最後教客製化的監控模組製作。

如本專案有遺漏或缺失，甚至描述的不夠完善，都蒞臨指教。

## Tables of content
- [安裝套件](#install-package)
- [伺服器範例](#server-example)
- [預設集成器](#default-collectors)
- [測量指標](#metric)
- [標籤](#labels)
- [時間戳](#timestamps)

## Install package

透過 `npm` 安裝 *prom-client*。
```
$ npm install prom-client
```

或者可以參考 [docker-dev 頁面](docker-dev/) ，使用 Docker 提升開發速度。

## Server example

本文件使用的伺服器範例，在後面的範例中將不會重複提及，僅以部分程式碼呈現。

```js
const http = require('http');
const port = 9200;

const requestHandler = (request, response) => {
    response.end('Hello world!');
};

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
    if (err) {
        return console.log('Oops! something bad happened', err);
    }

    console.log(`Server listening on ${port}`);
});
```

## Default collectors

*Prometheus* 的[官方文件](https://prometheus.io/docs/instrumenting/writing_clientlibs/#standard-and-runtime-collectors)中有推薦一些默認指標。而在 *prom-client* 中，已經有實作這些測量指標 - `collectDefaultMetrics`。可透過下面範例運行。

```js
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const requestHandler = (request, response) => {
    if (request.url === '/metrics') {
        response.end(client.register.metrics());
    }
    response.end('Hello Node.js Server!');
};
```

`collectDefaultMetrics` 可以傳入一個選項物件，而該物件內可帶三個項目。分別是：

- **Probe interval**

設定資料探測的間隔。
```js
// Probe every 5th second.
collectDefaultMetrics({ timeout: 5000 });
```

- **Join other registry**

加入其它的註冊表（registry）至預設註冊表（registry）中。
```js
const Registry = client.Registry;
const register = new Registry();

collectDefaultMetrics({ register });
```

[關於註冊表（registry）](#registry)創建使用。

- **To prefix metric names**

替測量指標（metric）添加自訂義的前綴。
```js
collectDefaultMetrics({ prefix: 'my_application_' });
```

列出所有測量指標（metric）的類別名稱。
```js
console.log(client.collectDefaultMetrics.metricsList);
```

## Metric
*prom-client* 提供了 [*Prometheus* 定義](https://prometheus.io/docs/concepts/metric_types/)的四種核心數據類型：
- [Counter](#counter)
- [Gauge](#gauge)
- [Histogram](#histogram)
- [Summary](#summary)

如果要製作一系列測量指標的模組，通常會以這種樣式去編寫。
```js
const client = require('prom-client');
const Gauge = client.Gauge;

const METRIC_NAME = 'metric_name';

// something to do

module.exports = (registry, config = {}) => {
    const registers = registry ? [registry] : undefined;
    const namePrefix = config.prefix ? config.prefix : '';

	const metricNameGauge = new Counter({
		name: namePrefix + METRIC_NAME,
		help: 'You need to description something.',
		registers
    });

    return () => {
        const now = Date.now();
        // something to do
        
        // Setting metricNameGauge.
	};

};

module.exports.metricNames = [
    cpuUserUsageCounter
];
```

### Counter

*計數器（counter）* 是一個累計類型端 *metrics* ，它代表了一個只有每次累計的數值。

擷取 [`prom-client/lib/metrics/processCpuTotal.js`](https://github.com/siimon/prom-client/blob/master/lib/metrics/processCpuTotal.js) 部分程式碼。
```js
const Counter = require('../counter');

//...

module.exports = (registry, config = {}) => {
    //...
    
    const cpuUserUsageCounter = new Counter({
            name: namePrefix + PROCESS_CPU_USER_SECONDS,
            help: 'Total user CPU time spent in seconds.',
            registers
    });

    return () => {
        //...

        // Increase default value with 1.
        cpuUserUsageCounter.inc(userUsageMicros / 1e6, now);
    };

};
```

如果在某個時機，想要重置計數器（counter）的話：
```js 
cpuUserUsageCounter.reset();
```

### Gauge

*測量（gauge）* 代表一個可以任意上下的單個數值。

擷取 [`prom-client/lib/metrics/osMemoryHeapLinux.js`](https://github.com/siimon/prom-client/blob/master/lib/metrics/osMemoryHeapLinux.js)
 部分程式碼。
```js
const Gauge = require('../gauge');

//...

module.exports = (registry, config = {}) => {
	//...

	const residentMemGauge = new Gauge({
		name: namePrefix + PROCESS_RESIDENT_MEMORY,
		help: 'Resident memory size in bytes.',
		registers
    });

    
    return () => {
        //...
        const now = Date.now();
        const structuredOutput = structureOutput(status);

        // Set value to current value.
        residentMemGauge.set(structuredOutput.VmRSS, now);
    };

};
```

或是可以用 `inc` 和 `dec` 來改變數值：
```js
residentMemGauge.inc(10); // Increase with 10.
residentMemGauge.dec(10); // decrease with 10. 
```

如果在某個時機，想要重置測量（gauge）的話：
```js 
residentMemGauge.reset();
```

### Histogram
*直方圖（histogram）* 對觀察結果進行採樣（通常是請求持續時間或響應大小），並將其計入可配置的 *buckets* 中。它提供了所有觀測值的總和。

在 `prom-client` 套件中，並沒實作有關 *直方圖（histogram）* 的功能。故這邊擷取 [`ex-prom-client/src/httpRequest.js`](https://github.com/48763/prom-client/blob/master/src/httpRequest.js) 並修改部分程式碼。有關於 [*labelNames* 點此](#labels)。
```js
const client = require('prom-client');
const Histogram = client.histogram;

//...

module.exports = (registry, config = {}) => {
    //...

    const httpRequestDurationMs = new Histogram({
        name: namePrefix + DURATION_MS,
        help: 'Duration of HTTP requests in ms',
        labelNames: ['route', 'method', 'code'],
        buckets: [0.1, 1, 4, 16, 64, 128, 256],
        registers
    })

    return (req, res, next) => {
        httpRequestDurationMs
            .labels(req.route.path, req.method, res.statusCode)
            .observe(Date.now() - res.locals.startEpoch);
        
        next();
    };
};
```

如果在某個時機，想要重置直方圖（histogram）的話：
```js
histogram.reset();
```

### Summary
*概要（summary）* 提供與 *直方圖（histogram）* 類似的功能。但它可以添加計算用的 *分位數（quantiles）* 。
```js
const client = require('prom-client');
const Summary = client.summary;

const client = require('prom-client');
new client.Summary({
    name: 'metric_name',
    help: 'metric_help',
    percentiles: [0.01, 0.1, 0.9, 0.99]
});
```

如果在某個時機，想要重置概要（summary）的話：
```js
summary.reset();
```

## Labels
*labels* 讓 *Prometheus* 的多維度數據模型成為可能：相同的測量指標（metric）名稱中，指定一個指標的特定維度實例，給予任意標籤組合（如：所有 HTTP 請求中，使用 `POST` 方法到 `/api/tracks` 處理器）。

有兩種方法可以為標籤添加值：
```js
const client = require('prom-client');
const httpRequestDurationMs = new client.Histogram({
    name: namePrefix + DURATION_MS,
    help: 'Duration of HTTP requests in ms.',
    labelNames: ['method', 'code']
});

httpRequestDurationMs.set({ method: 'GET', statusCode: '200' }, 100); 
httpRequestDurationMs.labels('GET', '200').set(100);
```

>另請參閱命名 *metrics* 和標籤的[最佳實踐](https://prometheus.io/docs/practices/naming/)。

### Default Labels 

```js
const client = require('prom-client');
const defaultLabels = { serviceName: 'api-v1' };
client.register.setDefaultLabels(defaultLabels);
```

## Timestamps

```js
gauge.set(100, 1485531442231); // Set gauge value and timestamp as milliseconds since Unix epoch
gauge.set(100, Date.now()); // Set gauge value and timestamp as milliseconds since Unix epoch
gauge.set(100, new Date()); // Set gauge value and timestamp as Date
gauge.set({ method: 'GET', statusCode: '200' }, 100, new Date()); // Set gauge value and timestamp with labels
gauge.labels('GET', '200').set(100, new Date()); // Same as above

counter.inc(1, new Date()); // Increment counter with timestamp
```

## Registry

### Multiple registries

## Pushgateway 

## Utilities
