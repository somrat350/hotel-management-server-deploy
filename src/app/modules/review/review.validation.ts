import { z } from 'zod';

// Customer original review
const createReviewSchema = z.object({
  hotelId: z.string({ message: 'Hotel ID is required' }),
  bookingId: z.string({ message: 'Booking ID is required to verify your stay' }),
  rating_staff: z.number({ message: 'Staff rating is required' }).min(0).max(10),
  rating_facilities: z.number({ message: 'Facilities rating is required' }).min(0).max(10),
  rating_cleanliness: z.number({ message: 'Cleanliness rating is required' }).min(0).max(10),
  rating_value: z.number({ message: 'Value rating is required' }).min(0).max(10),
  rating_location: z.number({ message: 'Location rating is required' }).min(0).max(10),
  comment: z.string({ message: 'Comment is required' }).min(3),
});

// Hotel owner  reply — rating fields nei , parentId required
const createReplySchema = z.object({
  hotelId: z.string({ message: 'Hotel ID is required' }),
  parentId: z.string({ message: 'Parent review ID is required for a reply' }),
  comment: z.string({ message: 'Reply comment is required' }).min(3),
});

const updateReviewSchema = z.object({
  rating_staff: z.number().min(0).max(10).optional(),
  rating_facilities: z.number().min(0).max(10).optional(),
  rating_cleanliness: z.number().min(0).max(10).optional(),
  rating_value: z.number().min(0).max(10).optional(),
  rating_location: z.number().min(0).max(10).optional(),
  comment: z.string().min(3).optional(),
  isPublished: z.boolean().optional(),
});

export const ReviewValidation = {
  createReviewSchema,
  createReplySchema,
  updateReviewSchema,
};