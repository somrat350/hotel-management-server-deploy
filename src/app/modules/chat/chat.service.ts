import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import status from "http-status";
import AppError from "../../utils/AppError";
import {
  CreateConversationInput,
  GetConversationsInput,
  GetMessagesInput,
  SendMessageInput,
} from "./chat.interface";
import { calculatePagination } from "../../utils/pagination";
import chatHelper from "./chat.helper";

// ==================== COMMON SELECTS FOR QUERIES ====================
const USER_SELECT = { id: true, name: true, avatar: true };
const HOTEL_SELECT = { id: true, name: true, image: true };

// ==================== CONVERSATION SERVICES ====================

const getOrCreateConversation = async (payload: CreateConversationInput) => {
  const { hotelId, userId, type } = payload;

  // Find existing conversation by hotelId + userId unique combo
  const existingConversation = await prisma.conversation.findUnique({
    where: {
      hotelId_userId: { hotelId, userId },
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create new conversation
  const newConversation = await prisma.conversation.create({
    data: {
      hotelId,
      userId,
      type,
    },
  });

  return newConversation;
};

const getUserConversations = async (payload: GetConversationsInput) => {
  const { userId, page, limit, isVendor } = payload;
  const {
    page: calculatedPage,
    limit: calculatedLimit,
    skip,
  } = calculatePagination({
    page: page,
    limit: limit,
  });

  // Vendor sees conversations where their hotel is involved
  // Customer sees conversations where they are the owner
  const whereClause: Prisma.ConversationWhereInput = isVendor
    ? { hotel: { vendorId: userId } }
    : { userId };

  const [conversations, totalCount] = await Promise.all([
    prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      skip,
      take: calculatedLimit,
      select: {
        id: true,
        lastMessage: true,
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
        hotel: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.conversation.count({ where: whereClause }),
  ]);

  // Compute display names based on viewer's perspective
  const conversationsWithDisplayNames = conversations.map((conversation) => {
    let displayName: string;
    let displayImage: string | null = null;

    if (isVendor) {
      // Vendor sees customer info
      displayName = conversation.user.name;
      displayImage = conversation.user.avatar || null;
    } else {
      // Customer sees hotel info
      displayName = conversation.hotel.name;
      displayImage = conversation.hotel.image[0] || null;
    }

    return {
      id: conversation.id,
      displayName,
      displayImage,
      lastMessage: conversation.lastMessage,
    };
  });

  return {
    pagination: {
      page: calculatedPage,
      limit: calculatedLimit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / calculatedLimit),
    },
    conversations: conversationsWithDisplayNames,
  };
};

const getConversationById = async (conversationId: string, userId: string) => {
  await chatHelper.validateAccess(conversationId, userId);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      user: { select: USER_SELECT },
      hotel: { select: HOTEL_SELECT },
      lastMessage: true,
      messages: {
        select: {
          id: true,
          text: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError(status.NOT_FOUND, "Conversation not found");
  }

  return conversation;
};

const deleteConversation = async (conversationId: string, userId: string) => {
  // Only the conversation owner (customer) can delete
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new AppError(status.NOT_FOUND, "Conversation not found");
  }

  if (conversation.userId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "Only the conversation owner can delete this conversation",
    );
  }

  await prisma.conversation.delete({
    where: { id: conversationId },
  });
};

const updateLastSeen = async (conversationId: string, userId: string) => {
  // Store lastSeen in a separate key-value store or Redis
  // For now, we'll skip this or use a simple approach
  // You can implement this with a LastSeen model if needed
  await chatHelper.validateAccess(conversationId, userId);
  // TODO: Implement last seen tracking (Redis or separate model)
};

// ==================== MESSAGE SERVICES ====================

const getMessages = async (input: GetMessagesInput) => {
  const { conversationId, userId } = input;
  const { skip, limit, page } = calculatePagination({ page: "1", limit: "50" });

  await chatHelper.validateAccess(conversationId, userId);

  const [messages, totalCount] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      include: { sender: { select: USER_SELECT } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    messages: messages.reverse(),
    pagination: chatHelper.buildPaginationResponse(page, limit, totalCount),
  };
};

const sendMessage = async (input: SendMessageInput) => {
  const { conversationId, senderId, text } = input;
  await chatHelper.validateAccess(conversationId, senderId);

  return await prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { conversationId, senderId, text },
      include: { sender: { select: USER_SELECT } },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageId: message.id },
    });

    return message;
  });
};

const getMessageById = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { sender: { select: USER_SELECT } },
  });

  if (!message) {
    throw new AppError(status.NOT_FOUND, "Message not found");
  }

  await chatHelper.validateAccess(message.conversationId, userId);

  return message;
};

const deleteMessage = async (messageId: string, userId: string) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError(status.NOT_FOUND, "Message not found");
  }

  if (message.senderId !== userId) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only delete your own messages",
    );
  }

  await prisma.message.delete({
    where: { id: messageId },
  });
};

// ==================== UTILITY SERVICES ====================

const getUnreadCount = async (userId: string, isVendor: boolean) => {
  // Get conversations based on user type
  const whereClause: Prisma.ConversationWhereInput = isVendor
    ? { hotel: { vendorId: userId } }
    : { userId };

  const conversations = await prisma.conversation.findMany({
    where: whereClause,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { senderId: true, createdAt: true },
      },
    },
  });

  let totalUnreadCount = 0;
  const conversationUnreadCounts: Record<string, number> = {};

  for (const conversation of conversations) {
    const lastMessage = conversation.messages[0];
    // Count as unread if last message is NOT from the current user
    const isUnread = lastMessage && lastMessage.senderId !== userId;
    const unreadCount = isUnread ? 1 : 0;

    totalUnreadCount += unreadCount;
    conversationUnreadCounts[conversation.id] = unreadCount;
  }

  return { totalUnreadCount, conversationUnreadCounts };
};

export const chatService = {
  // Conversation
  getOrCreateConversation,
  getUserConversations,
  getConversationById,
  deleteConversation,
  updateLastSeen,
  // Messages
  getMessages,
  sendMessage,
  getMessageById,
  deleteMessage,
  // Utility
  getUnreadCount,
};
