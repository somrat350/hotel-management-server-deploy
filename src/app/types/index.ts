import { HotelStatus, SystemLevel } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  email: string;
  systemLevel: SystemLevel;
  permissions?: string[];
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  stack?: string;
  error?: any;
}

export interface IPaginationOptions {
  page?: string;
  limit?: string;
  offset?: string;
  cursor?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type TPaginationQuery = {
  page?: string;
  limit?: string;
  status?: string;
};

export interface hotelLocation {
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface amenities {
    wifi: boolean;
    parking: boolean;
    pool: boolean;
    gym: boolean;
  };

export interface CreateHotelInput {
  name: string;
  description?: string;
  image: string[];
  status: HotelStatus;
  location: hotelLocation;
  amenities: amenities;
};
