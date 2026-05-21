import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "./cloudinary";

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "random",
): Promise<UploadApiResponse> => {
  // Implementation for uploading to Cloudinary
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined,
      ) => {
        if (error) return reject(error);
        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }
        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
};
