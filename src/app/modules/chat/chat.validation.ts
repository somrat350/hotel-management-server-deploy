import { z } from "zod";
export const createConversationSchema = z.object({
  hotelId: z.uuid("Invalid hotel ID"),
  type: z.enum(["USER_HOTEL", "VENDOR_ADMIN"]),
});

export const sendMessageSchema = z.object({
  text: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long"),
});
