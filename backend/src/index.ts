import express from "express";
import http from "node:http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { ensureStorage } from "./utils/storage.js";
import apiRouter from "./routes/index.js";
import stripeWebhook from "./routes/stripeWebhook.js";
import { initSocket } from "./services/realtime/io.js";

ensureStorage();

const app = express();
const server = http.createServer(app);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Stripe webhook needs raw body — register before json parser
app.use("/api/stripe", stripeWebhook);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiLimiter, apiRouter);

app.get("/", (_req, res) => {
  res.json({ name: "RefMaster AI API", status: "ok" });
});

app.use(errorHandler);

initSocket(server);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "RefMaster API listening");
});

const shutdown = (signal: string): void => {
  logger.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
