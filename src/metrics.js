const os = require("os");

const config = require("./config.json");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;
    this.totalGetRequests = 0;

    // This will periodically sent metrics to Grafana
    const timer = setInterval(() => {
      this.postMetricToGrafana("request", "all", "total", this.totalRequests);
      this.postMetricToGrafana(
        "request",
        "get",
        "total",
        this.totalGetRequests
      );
      this.postMetricToGrafana(
        "request",
        "post",
        "total",
        this.totalPostRequests
      );
      this.postMetricToGrafana(
        "request",
        "delete",
        "total",
        this.totalDeleteRequests
      );

      this.postMetricToGrafana(
        "cpu",
        "",
        "cpuUsage",
        this.getCpuUsagePercentage()
      );
      this.postMetricToGrafana(
        "memory",
        "",
        "memoryUsage",
        this.getMemoryUsagePercentage()
      );
    }, 10000);
    timer.unref();
  }

  incrementRequests() {
    this.totalRequests++;
  }
  incrementeGetRequests() {
    this.totalGetRequests++;
  }
  incrementPostRequests() {
    this.totalPostRequests++;
  }
  incrementDeleteRequests() {
    this.totalDeleteRequests++;
  }

  sendHTTPMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;
    this.uploadMetricToGrafana(metric);
  }

  postMetricToGrafana(metricPrefix, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.source} ${metricName}=${metricValue}`;
    this.uploadMetricToGrafana(metric);
  }

  uploadMetricToGrafana(metric) {
    fetch(`${config.url}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana");
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  requestTracker(req, res, next) {
    metrics.incrementRequests();
    if (req.method === "GET") {
      metrics.incrementeGetRequests();
    } else if (req.method === "POST") {
      metrics.incrementPostRequests();
    } else if (req.method === "DELETE") {
      metrics.incrementDeleteRequests();
    }
    next();
  }
}

const metrics = new Metrics();
module.exports = metrics;
