import express, { Router } from 'express';
import { ReviewController } from './review.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { ReviewValidation } from './review.validation';
import { isAuthenticated } from '../../middlewares/isAuthenticated'; // তোমার auth middleware

const router = express.Router();

// Customer: original review create (login required)
router.post(
  '/',
  isAuthenticated,
  validateRequest(ReviewValidation.createReviewSchema),
  ReviewController.createReview
);

// Hotel owner: reply create (login required)
router.post(
  '/reply',
  isAuthenticated ,
  validateRequest(ReviewValidation.createReplySchema),
  ReviewController.createReply
);

// Public: hotel er reviews
router.get('/:hotelId', ReviewController.getReviewsByHotel);

// Review update (login required)
router.patch(
  '/:id',
  isAuthenticated,
  validateRequest(ReviewValidation.updateReviewSchema),
  ReviewController.updateReview
);

// Review delete (login required)
router.delete('/:id', isAuthenticated, ReviewController.deleteReview);

export const ReviewRoutes: Router = router;