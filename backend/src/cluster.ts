import cluster from "cluster";
import os from "os";
import { env } from "@config/env";
import { logger } from "@config/logger";

const numWorkers = env.CLUSTER_WORKERS > 0 ? env.CLUSTER_WORKERS : os.cpus().length;

if (cluster.isPrimary) {
  logger.info(`Primary ${process.pid} starting ${numWorkers} workers`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (code=${code}, signal=${signal}). Restarting...`);
    cluster.fork(); // auto-restart crashed workers to keep the platform stable under load
  });
} else {
  // Each worker runs the full server (HTTP + Socket.IO with shared Redis adapter/state)
  require("./server");
}
