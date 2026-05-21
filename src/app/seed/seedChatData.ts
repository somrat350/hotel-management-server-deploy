import { ConversationType } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Sample chat messages for realistic conversations
 */
const sampleMessages = [
  "Hi, I'm interested in booking a room at your hotel.",
  "Hello! I'd be happy to help you with your booking. What dates are you looking at?",
  "I'm planning to visit from May 15th to May 20th. Do you have any rooms available?",
  "Yes, we have several rooms available during that period. Would you prefer a standard room or a suite?",
  "What's the difference in amenities?",
  "Our suites include a separate living area, mini-bar, and ocean view. Standard rooms are cozy with city views.",
  "The suite sounds great! What's the price per night?",
  "Our suites are $200 per night, and standard rooms are $120 per night. Both include breakfast.",
  "That's reasonable. Can I get a discount for the 5-night stay?",
  "We can offer you a 10% discount for stays longer than 4 nights. That would be $180 per night for the suite.",
  "Perfect! Can I book it now?",
  "Absolutely! I'll need your full name, contact number, and a credit card for the reservation.",
  "Great, my name is John Smith. I'll provide the details.",
  "Thank you! I've noted that. Is there anything else I can help you with?",
  "Do you offer airport pickup?",
  "Yes, we provide complimentary airport transfers for suite bookings.",
  "Excellent! That settles it then.",
  "Wonderful! We look forward to welcoming you. You'll receive a confirmation email shortly.",
  "Thank you for your assistance!",
  "You're very welcome! Have a great day!",
  "Hi, I have a question about my upcoming reservation.",
  "Of course! Could you please provide your booking reference number?",
  "It's #BK12345 under the name Sarah Johnson.",
  "Thank you, Sarah. I found your reservation. What would you like to know?",
  "Can I request a late checkout?",
  "We can arrange a late checkout until 2 PM at no extra charge. Would that work for you?",
  "Yes, that would be perfect!",
  "Great, I've updated your reservation with a late checkout. Is there anything else?",
  "No, that's all. Thank you!",
];

/**
 * Seed Chat Data
 * Creates sample conversations and messages for testing
 */
const seedChatData = async () => {
  try {
    console.log("🔄 Seeding chat data...\n");

    // Get existing users
    const users = await prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    if (users.length < 2) {
      console.log("⚠️  Not enough users found. Please seed users first.");
      return;
    }

    // Get existing hotels
    const hotels = await prisma.hotel.findMany({
      take: 2,
    });

    if (hotels.length === 0) {
      console.log("⚠️  No hotels found. Please seed hotels first.");
      return;
    }

    const hotel1 = hotels[0]!;
    const hotel2 = hotels[1] || hotels[0]!;

    // Find vendors by checking Vendor model
    const vendorsWithUsers = await prisma.vendor.findMany({
      take: 2,
      include: { user: true },
    });

    const vendor = vendorsWithUsers[0]?.user || users[0]!;
    const vendor2 = vendorsWithUsers[1]?.user || users[1]!;

    // Use remaining users as customers
    const customer1 =
      users.find((u) => u.id !== vendor.id) || users[2]! || users[0]!;
    const customer2 =
      users.find((u) => u.id !== vendor.id && u.id !== customer1.id) ||
      users[3]! ||
      users[1]!;

    // Find an admin user
    const adminWithUser = await prisma.admin.findFirst({
      include: { user: true },
    });
    const admin = adminWithUser?.user || users[4]! || users[0]!;

    // Conversation 1: Customer to Hotel (USER_HOTEL)
    console.log("💬 Creating conversation 1: Customer ↔ Hotel...");
    const conversation1 = await prisma.conversation.upsert({
      where: { id: "chat-001-customer-hotel" },
      update: {},
      create: {
        id: "chat-001-customer-hotel",
        hotelId: hotel1.id,
        userId: customer1.id,
        type: ConversationType.USER_HOTEL,
      },
    });

    // Add messages for conversation 1
    const messages1 = [
      { text: sampleMessages[0], sender: customer1.id },
      { text: sampleMessages[1], sender: vendor.id },
      { text: sampleMessages[2], sender: customer1.id },
      { text: sampleMessages[3], sender: vendor.id },
      { text: sampleMessages[4], sender: customer1.id },
      { text: sampleMessages[5], sender: vendor.id },
      { text: sampleMessages[6], sender: customer1.id },
      { text: sampleMessages[7], sender: vendor.id },
      { text: sampleMessages[8], sender: customer1.id },
      { text: sampleMessages[9], sender: vendor.id },
      { text: sampleMessages[10], sender: customer1.id },
      { text: sampleMessages[11], sender: vendor.id },
      { text: sampleMessages[12], sender: customer1.id },
      { text: sampleMessages[13], sender: vendor.id },
      { text: sampleMessages[14], sender: customer1.id },
      { text: sampleMessages[15], sender: vendor.id },
      { text: sampleMessages[16], sender: customer1.id },
      { text: sampleMessages[17], sender: vendor.id },
      { text: sampleMessages[18], sender: customer1.id },
      { text: sampleMessages[19], sender: vendor.id },
    ];

    for (let i = 0; i < messages1.length; i++) {
      const msg = messages1[i]!;
      await prisma.message.create({
        data: {
          conversationId: conversation1.id,
          senderId: msg.sender,
          text: msg.text,
          createdAt: new Date(Date.now() - (messages1.length - i) * 60000),
        },
      });
    }

    // Update last message
    const lastMessage1 = await prisma.message.findFirst({
      where: { conversationId: conversation1.id },
      orderBy: { createdAt: "desc" },
    });
    if (lastMessage1) {
      await prisma.conversation.update({
        where: { id: conversation1.id },
        data: { lastMessageId: lastMessage1.id },
      });
    }

    console.log(
      `   ✅ Conversation 1 created with ${messages1.length} messages`,
    );

    // Conversation 2: Customer to Hotel (different customer)
    console.log("💬 Creating conversation 2: Another Customer ↔ Hotel...");
    const conversation2 = await prisma.conversation.upsert({
      where: { id: "chat-002-customer-hotel" },
      update: {},
      create: {
        id: "chat-002-customer-hotel",
        hotelId: hotel1.id,
        userId: customer2.id,
        type: ConversationType.USER_HOTEL,
      },
    });

    const messages2 = [
      { text: sampleMessages[20], sender: customer2.id },
      { text: sampleMessages[21], sender: vendor.id },
      { text: sampleMessages[22], sender: customer2.id },
      { text: sampleMessages[23], sender: vendor.id },
      { text: sampleMessages[24], sender: customer2.id },
      { text: sampleMessages[25], sender: vendor.id },
      { text: sampleMessages[26], sender: customer2.id },
      { text: sampleMessages[27], sender: vendor.id },
      { text: sampleMessages[28], sender: customer2.id },
      { text: sampleMessages[29], sender: vendor.id },
    ];

    for (let i = 0; i < messages2.length; i++) {
      const msg = messages2[i]!;
      await prisma.message.create({
        data: {
          conversationId: conversation2.id,
          senderId: msg.sender,
          text: msg.text,
          createdAt: new Date(Date.now() - (messages2.length - i) * 90000),
        },
      });
    }

    const lastMessage2 = await prisma.message.findFirst({
      where: { conversationId: conversation2.id },
      orderBy: { createdAt: "desc" },
    });
    if (lastMessage2) {
      await prisma.conversation.update({
        where: { id: conversation2.id },
        data: { lastMessageId: lastMessage2.id },
      });
    }

    console.log(
      `   ✅ Conversation 2 created with ${messages2.length} messages`,
    );

    // Conversation 3: Vendor to Admin (VENDOR_ADMIN)
    console.log("💬 Creating conversation 3: Vendor ↔ Admin...");
    const conversation3 = await prisma.conversation.upsert({
      where: { id: "chat-003-vendor-admin" },
      update: {},
      create: {
        id: "chat-003-vendor-admin",
        hotelId: hotel1.id, // Associate with a hotel for VENDOR_ADMIN type
        userId: vendor.id,
        type: ConversationType.VENDOR_ADMIN,
      },
    });

    const vendorAdminMessages = [
      {
        text: "Hi Admin, I need to update my hotel information.",
        sender: vendor.id,
      },
      {
        text: "Hello! Sure, what information would you like to update?",
        sender: admin.id,
      },
      {
        text: "I want to add more rooms and update the amenities list.",
        sender: vendor.id,
      },
      {
        text: "I can help with that. Please provide the new room details.",
        sender: admin.id,
      },
      {
        text: "I'll send you the updated room inventory shortly.",
        sender: vendor.id,
      },
      { text: "Perfect! I'll wait for your update.", sender: admin.id },
    ];

    for (let i = 0; i < vendorAdminMessages.length; i++) {
      const msg = vendorAdminMessages[i]!;
      await prisma.message.create({
        data: {
          conversationId: conversation3.id,
          senderId: msg.sender,
          text: msg.text,
          createdAt: new Date(
            Date.now() - (vendorAdminMessages.length - i) * 120000,
          ),
        },
      });
    }

    const lastMessage3 = await prisma.message.findFirst({
      where: { conversationId: conversation3.id },
      orderBy: { createdAt: "desc" },
    });
    if (lastMessage3) {
      await prisma.conversation.update({
        where: { id: conversation3.id },
        data: { lastMessageId: lastMessage3.id },
      });
    }

    console.log(
      `   ✅ Conversation 3 created with ${vendorAdminMessages.length} messages`,
    );

    // Conversation 4: Empty conversation (for testing join)
    console.log("💬 Creating conversation 4: Empty conversation...");
    await prisma.conversation.upsert({
      where: { id: "chat-004-empty" },
      update: {},
      create: {
        id: "chat-004-empty",
        hotelId: hotel2.id,
        userId: users[4]?.id || customer1.id,
        type: ConversationType.USER_HOTEL,
      },
    });

    console.log("   ✅ Empty conversation 4 created");

    console.log("\n✅ Chat data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   • 4 conversations created");
    console.log("   • Conversation 1: Customer ↔ Hotel (20 messages)");
    console.log("   • Conversation 2: Customer ↔ Hotel (10 messages)");
    console.log("   • Conversation 3: Vendor ↔ Admin (6 messages)");
    console.log("   • Conversation 4: Empty conversation");
  } catch (error) {
    console.error("\n❌ Error seeding chat data:", error);
    throw error;
  }
};

/**
 * Main seed function for chat
 */
async function seedChat() {
  try {
    await seedChatData();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedChat();

export default seedChatData;
