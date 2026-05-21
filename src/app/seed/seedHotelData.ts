import { HotelStatus, RoomStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Seed Hotels
 * Creates sample hotels with locations, amenities, and rooms
 */
const seedHotels = async () => {
  try {
    console.log("🔄 Seeding hotels...");

    // Get vendors from Vendor model (includes users who are vendors)
    let vendorsWithUsers = await prisma.vendor.findMany({
      include: { user: true },
    });

    if (!vendorsWithUsers || vendorsWithUsers.length === 0) {
      console.log(
        "❌ No vendors found. Please run seedInitialData first to create users with roles.",
      );
      return;
    }

    // Extract vendor objects (not just users) - we need Vendor.id for hotel.vendorId
    const vendors = vendorsWithUsers;

    const hotelsToCreate = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        vendorId: vendors[0]!.id, // This is Vendor.id (not User.id)
        name: "Grand Plaza Hotel",
        description:
          "A luxurious hotel in the heart of the city with world-class amenities.",
        status: HotelStatus.ACTIVE,
        location: {
          id: "550e8400-e29b-41d4-a716-446655440011",
          country: "Bangladesh",
          city: "Dhaka",
          address: "123 Gulshan Avenue, Gulshan-2, Dhaka 1212",
          latitude: 23.7809,
          longitude: 90.4071,
        },
        amenities: {
          id: "550e8400-e29b-41d4-a716-446655440021",
          wifi: true,
          parking: true,
          pool: true,
          gym: true,
          resturant: true,
        },
        rooms: [
          {
            id: "550e8400-e29b-41d4-a716-446655440031",
            name: "Deluxe Room",
            capacity: 2,
            basePrice: 150.0,
            status: RoomStatus.ACTIVE,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440032",
            name: "Suite",
            capacity: 4,
            basePrice: 300.0,
            status: RoomStatus.ACTIVE,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440033",
            name: "Standard Room",
            capacity: 2,
            basePrice: 100.0,
            status: RoomStatus.ACTIVE,
          },
        ],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        vendorId: vendors.length > 1 ? vendors[1]!.id : vendors[0]!.id, // Vendor.id
        name: "Ocean View Resort",
        description:
          "A beachfront resort offering stunning ocean views and relaxation.",
        status: HotelStatus.ACTIVE,
        location: {
          id: "550e8400-e29b-41d4-a716-446655440012",
          country: "Bangladesh",
          city: "Cox's Bazar",
          address: "456 Marine Drive, Cox's Bazar 4700",
          latitude: 21.4272,
          longitude: 92.0058,
        },
        amenities: {
          id: "550e8400-e29b-41d4-a716-446655440022",
          wifi: true,
          parking: true,
          pool: true,
          gym: false,
          resturant: true,
        },
        rooms: [
          {
            id: "550e8400-e29b-41d4-a716-446655440034",
            name: "Ocean View Suite",
            capacity: 2,
            basePrice: 250.0,
            status: RoomStatus.ACTIVE,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440035",
            name: "Beach Villa",
            capacity: 6,
            basePrice: 500.0,
            status: RoomStatus.ACTIVE,
          },
        ],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        vendorId: vendors[0]!.id, // Vendor.id
        name: "Mountain Retreat",
        description:
          "A peaceful retreat in the mountains, perfect for nature lovers.",
        status: HotelStatus.ACTIVE,
        location: {
          id: "550e8400-e29b-41d4-a716-446655440013",
          country: "Bangladesh",
          city: "Sylhet",
          address: "789 Hill Road, Sylhet 3100",
          latitude: 24.8949,
          longitude: 91.8687,
        },
        amenities: {
          id: "550e8400-e29b-41d4-a716-446655440023",
          wifi: true,
          parking: true,
          pool: false,
          gym: true,
          resturant: true,
        },
        rooms: [
          {
            id: "550e8400-e29b-41d4-a716-446655440036",
            name: "Mountain Cabin",
            capacity: 2,
            basePrice: 120.0,
            status: RoomStatus.ACTIVE,
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440037",
            name: "Family Suite",
            capacity: 4,
            basePrice: 200.0,
            status: RoomStatus.ACTIVE,
          },
        ],
      },
    ];

    let hotelCount = 0;
    let roomCount = 0;

    for (const hotelData of hotelsToCreate) {
      // Create hotel first without locationId
      const hotel = await prisma.hotel.upsert({
        where: { id: hotelData.id },
        update: {},
        create: {
          id: hotelData.id,
          vendorId: hotelData.vendorId,
          creatorId: vendors.find((v) => v.id === hotelData.vendorId)!.user!.id,
          name: hotelData.name,
          description: hotelData.description,
          status: hotelData.status,
        },
      });

      // Create location
      const location = await prisma.location.upsert({
        where: { id: hotelData.location.id },
        update: {},
        create: {
          id: hotelData.location.id,
          country: hotelData.location.country,
          city: hotelData.location.city,
          address: hotelData.location.address,
          latitude: hotelData.location.latitude,
          longitude: hotelData.location.longitude,
          hotelId: hotel.id,
        },
      });

      // Create amenities
      const amenities = await prisma.amenities.upsert({
        where: { id: hotelData.amenities.id },
        update: {},
        create: {
          id: hotelData.amenities.id,
          wifi: hotelData.amenities.wifi,
          parking: hotelData.amenities.parking,
          pool: hotelData.amenities.pool,
          gym: hotelData.amenities.gym,
          resturant: hotelData.amenities.resturant,
          hotelId: hotel.id,
        },
      });

      // Create rooms
      for (const roomData of hotelData.rooms) {
        await prisma.room.upsert({
          where: { id: roomData.id },
          update: {},
          create: {
            id: roomData.id,
            hotelId: hotel.id,
            name: roomData.name,
            capacity: roomData.capacity,
            basePrice: roomData.basePrice,
            status: roomData.status,
            description: (roomData as any).description || "",
            bedType: (roomData as any).bedType || "SINGLE",
          },
        });
        roomCount++;
      }

      hotelCount++;
    }

    console.log(
      `✅ Successfully seeded ${hotelCount} hotels with ${roomCount} rooms`,
    );
    return { hotelCount, roomCount };
  } catch (error) {
    console.error("❌ Error seeding hotels:", error);
    throw error;
  }
};

/**
 * Main seed function for hotels
 * Can be called independently or integrated into main seed
 */
async function seedHotelsData() {
  try {
    console.log("🌱 Starting hotel seeding...\n");

    await seedHotels();
    console.log("");

    console.log("✨ Hotel seeding completed successfully!");
  } catch (error) {
    console.error("❌ Hotel seeding failed:", error);
    process.exit(1);
  }
}

seedHotelsData();

export default seedHotelsData;
