import { prisma } from "../../lib/prisma.js";
import { Cache } from "../../lib/cache.js";
import {
  CreateHotelInput,
  IPaginationOptions,
} from "../../types/index.js";
import AppError from "../../utils/AppError.js";
import statusCode, { status } from "http-status";
import { calculatePagination } from "../../utils/pagination.js";
import { buildSearchCondition } from "../../utils/search.js";

export const createHotel = async (userId: string, data: CreateHotelInput) => {
  const { location, amenities } = data;

  const user = await prisma.user.findUnique({
    where: { id : userId},
    select: {
      vendors: {
        select: {
          id: true,
        },
      },
      vendorStaff: {
        select: {
          ownerId: true,
        },
      },
    },
  });
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  let vendorId;

  if (user.vendors) {
    vendorId = user.vendors[0]!.id;
  } else if (user.vendorStaff) {
     vendorId = user.vendorStaff?.ownerId;
  }

  const hotelData: any = {
    vendorId,
    creatorId: userId,
    name: data.name,
    description: data.description,
    image: data.image,
    amenities: {
      create: amenities,
    },
    location: {
      create: location,
    },
  };

  const hotel = await prisma.hotel.create({
    data: hotelData,
  });

  await Cache.delByPattern("hotel:list:*");

  return hotel;
};

const getHotels = async (paginationOptions: IPaginationOptions) => {
  const cacheKey = `hotel:list:${JSON.stringify(paginationOptions)}`;

  const cachedHotels = await Cache.get<{
    meta: Record<string, unknown>;
    hotels: unknown[];
  }>(cacheKey);

  if (cachedHotels) {
    return cachedHotels;
  }

  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const cursor = paginationOptions.cursor;
  const offset = paginationOptions.offset
    ? Number(paginationOptions.offset)
    : skip;

  const where = buildSearchCondition(paginationOptions.searchTerm || "", [
    "name",
  ]);
  const total = await prisma.hotel.count({
    where: {
      ...where,
    },
  });

  let result: { meta: Record<string, unknown>; hotels: unknown[] };
 
  const hotels = await prisma.hotel.findMany({
      where: {
        ...where,
      },
      take: limit,
      skip: 1,
      cursor: {
        id: cursor,
      },
      orderBy: {
        id: "asc",
      },
    });

    result = {
      meta: {
        limit,
        cursor,
        page,
        offset,
        total,
        totalPages: Math.ceil(total / limit),
      },
      hotels,
  }

  await Cache.set(cacheKey, result, 300);

  return result;
};

const updateHotel = async (userId: string, hotelId: string, data: CreateHotelInput) => {
  const { location, amenities } = data;

  const user = await prisma.user.findUnique({
    where: { id : userId},
    select: {
      vendors: {
        select: {
          id: true,
        },
      },
      vendorStaff: {
        select: {
          ownerId: true,
        },
      },
    },
  });
  
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found!");
  }

  const existingHotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!existingHotel) {
    throw new AppError(statusCode.NOT_FOUND, "Hotel not found");
  }
  
  if (existingHotel.vendorId !== user.vendors[0]!.id ) {
    throw new AppError(
      statusCode.FORBIDDEN,
      "You are not vendorId",
    );
  }
  
  else if (existingHotel.vendorId !== user.vendorStaff?.ownerId) {
    throw new AppError(
      statusCode.FORBIDDEN,
      "You are not vendorStaff",
    );
  }

  const updatedHotel = await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      name: data.name,
      description: data.description,
      image: data.image,
      amenities: {
        update: amenities,
      },
      location: {
        update: location,
      },
    },
  });

  await Cache.delByPattern("hotel:list:*");
  await Cache.del(`hotel:${hotelId}`);

  return updatedHotel;
};


const deleteHotel = async (hotelId: string) => {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    throw new AppError(statusCode.NOT_FOUND, "Hotel not found");
  }

  const hotelDeleted = await prisma.hotel.delete({
    where: { id: hotelId },
  });

  await Cache.delByPattern("hotel:list:*");
  await Cache.del(`hotel:${hotelId}`);

  return hotelDeleted;
};

export default {
  createHotel,
  getHotels,
  updateHotel,
  deleteHotel,
};
