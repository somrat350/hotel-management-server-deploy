import { z } from "zod";

export const askFAQSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(300, "Question too long"),
});

export const answerFAQSchema = z.object({
  answer: z.string().min(3, "Answer too short").max(500, "Answer too long"),
});
