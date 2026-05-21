import { Server } from "http";
import app from "./app";
import { prisma } from "./app/lib/prisma";
import { initSocket } from "./app/config/socket";
import env from "./app/config/env";
import { registerChatSocket } from "./app/modules/chat/chat.socket";
import { connectRedis } from "./app/config/redis";

const bootstrap = async () => {
  let server: Server;
  try {
    await prisma.$connect();
    console.log("Prisma connected successfully");
    // if (config.AUTO_SEED) {
    //   try {
    //     await seedInitialData();
    //     console.log("Database seeding completed successfully");
    //   } catch (err) {
    //     console.error("Database seeding failed during startup:", err);
    //   }
    // } else {
    //   console.log("Database seeding skipped (AUTO_SEED=false)");
    // }

    // start the server
    server = app.listen(env.port, async () => {
      console.log(`Server is running on http://localhost:${env.port}`);
    });

    // Connect redis
    await connectRedis();

    // Initialize Socket.IO
    const io = initSocket(server);

    registerChatSocket(io);

    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log("Server closed gracefully.");
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    };

    process.on("SIGINT", exitHandler);
    process.on("SIGTERM", exitHandler);

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      console.log(
        "Unhandled Rejection is detected, we are closing our server...",
      );
      console.error("Error:", error);
      console.error("Stack:", (error as Error).stack);
      if (server) {
        server.close(() => {
          console.log(error);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  } catch (err) {
    console.error("Server error", err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

bootstrap();
