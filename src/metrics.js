const os = require("os");
const config = require("./config");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;
    this.totalGetRequests = 0;
    this.totalPutRequests = 0;

    this.activeUsers = 0;
    this.successfulAuthAttempts = 0;
    this.failedAuthAttempts = 0;

    this.pizzasSold = 0;
    this.pizzaCreationErrors = 0;
    this.revenue = 0;

    // This will periodically sent metrics to Grafana
    const timer = setInterval(() => {
      // MARK: - HTTP Metrics
      this.sendHTTPMetricToGrafana(
        "request",
        "all",
        "total",
        this.totalRequests
      );
      this.sendHTTPMetricToGrafana(
        "request",
        "get",
        "total",
        this.totalGetRequests
      );
      this.sendHTTPMetricToGrafana(
        "request",
        "post",
        "total",
        this.totalPostRequests
      );
      this.sendHTTPMetricToGrafana(
        "request",
        "delete",
        "total",
        this.totalDeleteRequests
      );
      this.sendHTTPMetricToGrafana(
        "request",
        "put",
        "total",
        this.totalPutRequests
      );

      // MARK: - Auth Metrics
      this.sendMetricToGrafana(
        "auth",
        "successful",
        this.successfulAuthAttempts
      );
      this.sendMetricToGrafana("auth", "failed", this.failedAuthAttempts);

      // MARK: - User Metrics
      this.sendMetricToGrafana("user", "active", this.activeUsers);

      // MARK: - Pizza Metrics
      this.sendMetricToGrafana("pizza", "sold", this.pizzasSold);
      this.sendMetricToGrafana(
        "pizza",
        "creationErrors",
        this.pizzaCreationErrors
      );
      this.sendMetricToGrafana("pizza", "revenue", this.revenue);

      // MARK: - System Metrics
      this.sendMetricToGrafana("cpu", "cpuUsage", this.getCpuUsagePercentage());
      this.sendMetricToGrafana(
        "memory",
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
  incrementPutRequests() {
    this.totalPutRequests++;
  }

  incrementSuccessfulAuthAttempts() {
    this.successfulAuthAttempts++;
  }
  incrementFailedAuthAttempts() {
    this.failedAuthAttempts++;
  }

  incrementActiveUsers() {
    this.activeUsers++;
  }
  decrementActiveUsers() {
    if (this.activeUsers > 0) {
      this.activeUsers--;
    }
  }

  incrementPizzasSold() {
    this.pizzasSold++;
  }
  incrementPizzaCreationErrors() {
    this.pizzaCreationErrors++;
  }
  incrementRevenue(amount) {
    this.revenue += amount;
  }

  sendHTTPMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;
    this.uploadMetricToGrafana(metric);
  }

  sendMetricToGrafana(metricPrefix, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source} ${metricName}=${metricValue}`;
    this.uploadMetricToGrafana(metric);
  }

  uploadMetricToGrafana(metric) {
    fetch(`${config.metrics.url}`, {
      method: "post",
      body: metric,
      headers: {
        Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}`,
      },
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

  requestLatencyTracker(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      metrics.sendMetricToGrafana("request", "latency", duration);
    });
    next();
  }

  requestTracker(req, res, next) {
    console.log("Method", req.method);
    metrics.incrementRequests();
    if (req.method === "GET") {
      metrics.incrementeGetRequests();
    } else if (req.method === "POST") {
      metrics.incrementPostRequests();
    } else if (req.method === "DELETE") {
      metrics.incrementDeleteRequests();
    } else if (req.method === "PUT") {
      metrics.incrementPutRequests();
    }
    next();
  }
}

const metrics = new Metrics();
module.exports = metrics;
