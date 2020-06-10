'use strict';

const client = require('prom-client');
const globalRegistry = new client.Registry();

const osCpuInfoLinux = require('./osCpuInfoLinux');
const osMemoryInfoLinux = require('./osMemoryInfoLinux');

const metrics = {
	osCpuInfoLinux,
	osMemoryInfoLinux
};
const metricsList = Object.keys(metrics);

let existingInterval = null;
let init = true;

module.exports = function startDefaultMetrics(config) {
	let normalizedConfig = config;
	if (typeof config === 'number') {

		normalizedConfig = { timeout: config };
	}

	normalizedConfig = Object.assign({ timeout: 10000 }, normalizedConfig);

	if (existingInterval !== null) {
		clearInterval(existingInterval);
	}

	const initialisedMetrics = metricsList.map(metric => {
		const defaultMetric = metrics[metric];
		if (!init) {
			defaultMetric.metricNames.map(
				globalRegistry.removeSingleMetric,
				globalRegistry
			);
		}

		return defaultMetric(normalizedConfig.register, config);
	});

	function updateAllMetrics() {
		initialisedMetrics.forEach(metric => metric.call());
	}

	updateAllMetrics();

	existingInterval = setInterval(
		updateAllMetrics,
		normalizedConfig.timeout
	).unref();

	init = false;

	return existingInterval;
};

module.exports.metricsList = metricsList;