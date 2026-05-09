import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { env } from "../../config/env.js";

let io: IOServer | null = null;

export function initSocket(server: HttpServer): IOServer {
  io = new IOServer(server, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });
  io.on("connection", (socket) => {
    socket.on("subscribe", (reportId: string) => {
      if (typeof reportId === "string") socket.join(`report:${reportId}`);
    });
    socket.on("unsubscribe", (reportId: string) => {
      if (typeof reportId === "string") socket.leave(`report:${reportId}`);
    });
  });
  return io;
}

export function getIO(): IOServer | null {
  return io;
}

export function emitReportProgress(reportId: string, payload: unknown): void {
  io?.to(`report:${reportId}`).emit("report:progress", payload);
}
