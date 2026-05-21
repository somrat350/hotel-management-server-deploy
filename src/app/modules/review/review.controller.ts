import { Request, Response } from 'express';
import status from 'http-status';
import { ReviewService } from './review.service';
import { catchAsync } from '../../utils/catchAsync';
import ApiResponse from '../../utils/ApiResponse';

// Customer original review 

const createReview = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  const result = await ReviewService.createReview({ ...req.body, customerId });
  ApiResponse.success(res, result, 'Review created successfully', status.CREATED);
});

//Hotel owner reply

const createReply = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user?.userId;
  const result = await ReviewService.createReply({ ...req.body, customerId });
  ApiResponse.success(res, result, 'Reply added successfully', status.CREATED);
});

// Hotel reviews fetch (Redis cached) 

const getReviewsByHotel = catchAsync(async (req: Request, res: Response) => {
  const hotelId = req.params.hotelId as string;

  const { reviews, aggregates } = await ReviewService.getReviewsByHotel(hotelId);

  const metaInfo = {
    totalReviews: aggregates._count.id,
    averageRatings: {
      overall:     aggregates._avg.rating?.toFixed(1)             || '0',
      staff:       aggregates._avg.rating_staff?.toFixed(1)       || '0',
      facilities:  aggregates._avg.rating_facilities?.toFixed(1)  || '0',
      cleanliness: aggregates._avg.rating_cleanliness?.toFixed(1) || '0',
      value:       aggregates._avg.rating_value?.toFixed(1)        || '0',
      location:    aggregates._avg.rating_location?.toFixed(1)    || '0',
    },
  };

  ApiResponse.success(
    res,
    { data: reviews, meta: metaInfo },
    'Reviews fetched successfully',
    status.OK
  );
});

//Review update

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ReviewService.updateReview(id, req.body);
  ApiResponse.success(res, result, 'Review updated successfully', status.OK);
});

//Review delete

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ReviewService.deleteReview(id);
  ApiResponse.success(res, result, 'Review deleted successfully', status.OK);
});


export const ReviewController = {
  createReview,
  createReply,
  getReviewsByHotel,
  updateReview,
  deleteReview,
};
