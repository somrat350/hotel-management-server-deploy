import { Review } from './review.type';
import { prisma } from '../../lib/prisma';
import { cacheGet, cacheSet, cacheDel, CacheKeys } from './review.redis';


//average calculate
const calculateAverageRating = (payload: Partial<Review>): number => {
  const ratings: number[] = [
    Number(payload.rating_staff)       || 0,
    Number(payload.rating_facilities)  || 0,
    Number(payload.rating_cleanliness) || 0,
    Number(payload.rating_value)       || 0,
    Number(payload.rating_location)    || 0,
  ];
  const total = ratings.reduce((sum, r) => sum + r, 0);
  return Number((total / ratings.length).toFixed(1));
};

const invalidateHotelReviewCache = async (hotelId: string): Promise<void> => {
  await cacheDel(CacheKeys.hotelReviews(hotelId));
};


//customer orginal review create
const createReview = async (payload: Review) => {
  const { bookingId, customerId, hotelId } = payload;

  // Booking validation
  const isValidBooking = await prisma.booking.findFirst({
    where: { id: bookingId!, userId: customerId },
  });
  if (!isValidBooking) {
    throw new Error('Invalid request: This booking does not exist or does not belong to this customer.');
  }

  // Duplicate check
  const existingReview = await prisma.review.findFirst({
    where: { bookingId: bookingId!, customerId },
  });
  if (existingReview) {
    throw new Error('A review already exists for this booking.');
  }

  const averageRating = calculateAverageRating(payload);

  const created = await prisma.review.create({
    data: {
      customerId,
      hotelId: hotelId!,
      bookingId,
      rating: averageRating,
      rating_staff:       payload.rating_staff       || 0,
      rating_facilities:  payload.rating_facilities  || 0,
      rating_cleanliness: payload.rating_cleanliness || 0,
      rating_value:       payload.rating_value       || 0,
      rating_location:    payload.rating_location    || 0,
      comment: payload.comment,
      isPublished: true,
    },
  });

  // catch invalid
  await invalidateHotelReviewCache(hotelId!);

  return created;
};

//hotel owner reply create
const createReply = async (payload: {
  customerId: string;
  hotelId: string;
  parentId: string;
  comment: string;
}) => {
  const { customerId, hotelId, parentId, comment } = payload;

  // Parent review existing  check
  const parentReview = await prisma.review.findFirst({
    where: { id: parentId, hotelId },
  });
  if (!parentReview) {
    throw new Error('Parent review not found for this hotel.');
  }

  // Nested reply prevent (reply to a reply)
  if (parentReview.parentId) {
    throw new Error('Cannot reply to a reply. Only top-level reviews can be replied to.');
  }

  const reply = await prisma.review.create({
    data: {
      customerId,
      hotelId,
      parentId,
      comment,
      rating:             undefined,
      rating_staff:       undefined,
      rating_facilities:  undefined,
      rating_cleanliness: undefined,
      rating_value:       undefined,
      rating_location:    undefined,
      isPublished: true,
    },
  });

  //cacth invalid
  await invalidateHotelReviewCache(hotelId);

  return reply;
};


//  Hotel reviews (with replies) — Redis cached

const getReviewsByHotel = async (hotelId: string) => {
  const cacheKey = CacheKeys.hotelReviews(hotelId);

  // Cache hit check
  const cached = await cacheGet<{
    reviews: Awaited<ReturnType<typeof fetchReviewsFromDB>>;
    aggregates: Awaited<ReturnType<typeof fetchAggregatesFromDB>>;
  }>(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss -> DB to data fatch
  const [reviews, aggregates] = await Promise.all([
    fetchReviewsFromDB(hotelId),
    fetchAggregatesFromDB(hotelId),
  ]);

  const payload = { reviews, aggregates };

  // catch store (Fire-and-forget)
  cacheSet(cacheKey, payload, 300).catch((err) =>
    console.error('[Redis] Background cacheSet failed:', err)
  );

  return payload;
};



const fetchReviewsFromDB = (hotelId: string) =>
  prisma.review.findMany({
    where: { hotelId, parentId: null, isPublished: true },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      replies: {
        where: { isPublished: true },
        select: {
          id: true,
          comment: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

const fetchAggregatesFromDB = (hotelId: string) =>
  prisma.review.aggregate({
    where: { hotelId, parentId: null, isPublished: true },
    _avg: {
      rating: true,
      rating_staff: true,
      rating_facilities: true,
      rating_cleanliness: true,
      rating_value: true,
      rating_location: true,
    },
    _count: { id: true },
  });

/**
 * 4. Review update
 */
const updateReview = async (id: string, payload: Partial<Review>) => {
  const existingReview = await prisma.review.findUnique({ where: { id } });
  if (!existingReview) throw new Error('Review not found.');

  // Rating recalculate —  top-level review
  let newRating = existingReview.rating;
  if (
    !existingReview.parentId &&
    (payload.rating_staff       !== undefined ||
      payload.rating_facilities  !== undefined ||
      payload.rating_cleanliness !== undefined ||
      payload.rating_value       !== undefined ||
      payload.rating_location    !== undefined)
  ) {
    const merged = {
      rating_staff:       payload.rating_staff       ?? existingReview.rating_staff,
      rating_facilities:  payload.rating_facilities  ?? existingReview.rating_facilities,
      rating_cleanliness: payload.rating_cleanliness ?? existingReview.rating_cleanliness,
      rating_value:       payload.rating_value       ?? existingReview.rating_value,
      rating_location:    payload.rating_location    ?? existingReview.rating_location,
    };
    newRating = calculateAverageRating(merged);
  }

  const { customerId, hotelId, bookingId, parentId, ...reviewPayload } = payload;

  const updated = await prisma.review.update({
    where: { id },
    data: { ...reviewPayload, rating: newRating } as any,
  });

  // cacth invalid
  await invalidateHotelReviewCache(existingReview.hotelId);

  return updated;
};

/**
 * 5. Review delete
 */
const deleteReview = async (id: string) => {
  const review = await prisma.review.findUnique({
    where: { id },
    select: { hotelId: true },
  });
  if (!review) throw new Error('Review not found.');

  const deleted = await prisma.review.delete({ where: { id } });

  // cache invalied
  await invalidateHotelReviewCache(review.hotelId);

  return deleted;
};


export const ReviewService = {
  createReview,
  createReply,
  getReviewsByHotel,
  updateReview,
  deleteReview,
};