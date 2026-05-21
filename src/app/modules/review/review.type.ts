export interface Review {
  customerId: string;
  hotelId: string;
  bookingId?: string | null;   // reply hole lagbe na
  rating?: number | null;      // reply hole null
  rating_staff?: number | null;
  rating_facilities?: number | null;
  rating_cleanliness?: number | null;
  rating_value?: number | null;
  rating_location?: number | null;
  comment: string;
  parentId?: string | null;    // top-level e null
  isPublished?: boolean;
}