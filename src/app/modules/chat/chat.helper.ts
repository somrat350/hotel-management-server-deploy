import status from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../utils/AppError";
import { PaginationMeta } from "./chat.interface";

// ==================== UNREAD COUNT HELPER ====================

const getUnreadCountForConversation = async (
  conversationId: string,
  userId: string,
  lastSeenAt: Date | null,
) =>
  prisma.message.count({
    where: {
      conversationId,
      createdAt: { gt: lastSeenAt || new Date(0) },
      NOT: { senderId: userId },
    },
  });

// ==================== PAGINATION HELPER ====================

const buildPaginationResponse = (
  page: number,
  limit: number,
  totalCount: number,
): PaginationMeta => ({
  page,
  limit,
  totalCount,
  totalPages: Math.ceil(totalCount / limit),
  hasNextPage: page * limit < totalCount,
  hasPrevPage: page > 1,
});

// ==================== VALIDATION HELPERS ====================

/**
 * Validate that user has access to conversation
 * - Customer: must be the conversation owner (userId)
 * - Vendor/Staff: must be the hotel owner (vendorId matches hotel's vendorId)
 */
const validateAccess = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { hotel: true },
  });

  if (!conversation) {
    throw new AppError(status.NOT_FOUND, "Conversation not found");
  }

  // Customer owns the conversation
  const isOwner = conversation.userId === userId;

  // Vendor owns the hotel
  const isHotelVendor = conversation.hotel?.vendorId === userId;

  if (!isOwner && !isHotelVendor) {
    throw new AppError(
      status.FORBIDDEN,
      "You don't have access to this conversation",
    );
  }

  return conversation;
};

const chatHelper = {
  getUnreadCountForConversation,
  buildPaginationResponse,
  validateAccess,
};

export default chatHelper;
