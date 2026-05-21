import { Server as HttpServer } from "http";
import { Server } from "socket.io";

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  return io
};
