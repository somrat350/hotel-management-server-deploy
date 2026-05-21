import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routers/index";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { upload } from "./app/middlewares/multer.middleware";
import cloudinary from "./app/utils/cloudinary";
import fs from "fs";
import { uploadToCloudinary } from "./app/utils/uploadToCloudinary";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

// base route for all APIs
app.use("/api/v1", router);

// url check route response
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is Running...",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

// check server health
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Server is Healthy",
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

app.get("/chatTest", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "..", "public", "chat", "index.html"));
});

// example cloudinary upload route
// app.post(
//   "/api/v1/cloudinary",
//   upload.single("image"),
//   async (req: Request, res: Response) => {
//     try {
//       const file = req.file;
//       if (!file) {
//         return res.status(400).send({ message: "No file uploaded" });
//       }

//       const result = await uploadToCloudinary(file.buffer, "images");

//       res.send({ message: "Image url created successfully", result });
//     } catch (err) {
//       console.error("Cloudinary upload error:", err);
//       return res.status(500).send({ message: "Failed to upload image" });
//     }
//   },
// );

app.use(notFound);
app.use(globalErrorHandler);

export default app;
