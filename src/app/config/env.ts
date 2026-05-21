import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

const ENV = {
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASS: process.env.SUPER_ADMIN_PASS,
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
  SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE,
  AUTH_DEVICES_COUNT: process.env.AUTH_DEVICES_COUNT,
  node_env: process.env.NODE_ENV || "development",
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  database_url: process.env.DATABASE_URL as string,
  // Redis Cloud Credential
  REDIS_URL: process.env.REDIS_URL,
  // Nodemailer Credential
  EMAIL_FROM: process.env.EMAIL_FROM as string,
  EMAIL_USER: process.env.EMAIL_USER as string,
  EMAIL_PASS: process.env.EMAIL_PASS as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  NODE_ENV: process.env.NODE_ENV as string,
  SAME_SITE: process.env.SAME_SITE as string,
  BASE_URL: process.env.BASE_URL as string,
  FRONTEND_URL: process.env.FRONTEND_URL as string,
  STORE_PASSWORD: process.env.STORE_PASSWORD as string,
  STORE_ID: process.env.STORE_ID as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  AUTO_SEED: process.env.AUTO_SEED,
  // Cloudinary configuration
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
};

export default ENV;
