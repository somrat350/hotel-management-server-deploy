import status from "http-status";
import AppError from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import { IRoomCreateInput, IRoomUpdateInput } from "./room.validation";
import { cacheDel, cacheGet, cacheSet, CacheKeys } from "../room/room.redis"; // আপনার redis ফাইলের সঠিক পাথ দিন

// 1. Create a new room
const createRoom = async (hotelId: string, payload: IRoomCreateInput) => {
  // Validate hotel existence
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    throw new AppError(status.NOT_FOUND, "Hotel not found");
  }

  const roomData = {
    name: payload.name,
    capacity: payload.capacity,
    basePrice: payload.basePrice,
    description: payload.description,
    bedType: payload.bedType,
    size: payload.size,
    amenities: payload.amenities,
    images: payload.images,
  };

  // DB-তে রুম তৈরি করা
  const newRoom = await prisma.room.create({
    data: {
      ...roomData,
      hotelId,
    },
  });

  // নতুন রুম তৈরি হলে ঐ হোটেলের রুম লিস্টের ক্যাশ ডিলিট করে দিচ্ছি
  await cacheDel(CacheKeys.roomsByHotel(hotelId));

  return newRoom;
};

// 2. Get all rooms by hotel id (With Caching)
const getRoomsByHotel = async (hotelId: string) => {
  const cacheKey = CacheKeys.roomsByHotel(hotelId);

  // প্রথমে Redis ক্যাশ চেক করছি
  const cachedRooms = await cacheGet<any[]>(cacheKey);
  if (cachedRooms) {
    return cachedRooms; // ক্যাশে ডেটা থাকলে সরাসরি রিটার্ন
  }

  // ক্যাশে না থাকলে হোটেল ভ্যালিডেশন এবং DB কুয়েরি
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    throw new AppError(status.NOT_FOUND, "Hotel not found");
  }

  const rooms = await prisma.room.findMany({
    where: { hotelId },
    orderBy: { createdAt: "desc" },
  });

  // DB থেকে আনা ডেটা Redis ক্যাশে ৫ মিনিটের জন্য সেভ করে রাখছি
  await cacheSet(cacheKey, rooms);

  return rooms;
};

// 3. Get single room by id (With Caching)
const getRoomById = async (roomId: string) => {
  const cacheKey = CacheKeys.roomDetails(roomId);

  // প্রথমে Redis ক্যাশ চেক করছি
  const cachedRoom = await cacheGet<any>(cacheKey);
  if (cachedRoom) {
    return cachedRoom;
  }

  // ক্যাশে না থাকলে DB থেকে আনা
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new AppError(status.NOT_FOUND, "Room not found");
  }

  // Redis ক্যাশে সেভ করে রাখা
  await cacheSet(cacheKey, room);

  return room;
};

// 4. Update room (With Cache Invalidation)
const updateRoom = async (roomId: string, payload: IRoomUpdateInput) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new AppError(status.NOT_FOUND, "Room not found");
  }

  // DB-তে আপডেট করা
  const updatedRoom = await prisma.room.update({
    where: { id: roomId },
    data: payload,
  });

  // ডেটা আপডেট হওয়ায় সিঙ্গেল রুম এবং ওই হোটেলের রুম লিস্টের ক্যাশ ডিলিট (Invalidate) করছি
  await cacheDel(CacheKeys.roomDetails(roomId), CacheKeys.roomsByHotel(room.hotelId));

  return updatedRoom;
};

// 5. Delete room (With Cache Invalidation)
const deleteRoom = async (roomId: string) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) {
    throw new AppError(status.NOT_FOUND, "Room not found");
  }

  // DB থেকে ডিলিট করা
  await prisma.room.delete({
    where: { id: roomId },
  });

  // ডেটা ডিলিট হওয়ায় ক্যাশ থেকেও পুরোনো ডেটা ডিলিট করে দিচ্ছি
  await cacheDel(CacheKeys.roomDetails(roomId), CacheKeys.roomsByHotel(room.hotelId));

  return null;
};

export const RoomService = {
  createRoom,
  getRoomsByHotel,
  getRoomById,
  updateRoom,
  deleteRoom,
};