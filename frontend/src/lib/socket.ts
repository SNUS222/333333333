"use client";
import { io, type Socket } from "socket.io-client";
import { apiBaseUrl } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(apiBaseUrl, { withCredentials: true, transports: ["websocket", "polling"] });
  }
  return socket;
}
