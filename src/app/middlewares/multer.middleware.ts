import multer from "multer";
import AppError from "../utils/AppError";
import status from "http-status";

// multer for disk storage configuration

// const storage = multer.diskStorage({
//   destination: function (_req, file, cb) {
//     cb(null, "public/uploads/");
//   },
//   filename: function (_req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, file.fieldname + "-" + uniqueSuffix);
//   },
// });

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(status.BAD_REQUEST, "Only images allowed with .jpeg, .png or .jpg format"));
    }
  },
});
