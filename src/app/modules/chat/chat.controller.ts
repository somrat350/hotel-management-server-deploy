import { catchAsync } from "../../utils/catchAsync";
import { Request, Response } from "express";
import { chatService } from "./chat.service";
import { prisma } from "../../lib/prisma";
import status from "http-status";
import AppError from "../../utils/AppError";
import ApiResponse from "../../utils/ApiResponse";

// ==================== CONVERSATION CONTROLLERS ====================

const getOrCreateConversation = catchAsync(
  async (req: Request, res: Response) => {
    const { hotelId, type = "USER_HOTEL" } = req.body;
    const userId = req.user.userId;

    const conversation = await chatService.getOrCreateConversation({
      hotelId,
      userId,
      type,
    });

    ApiResponse.success(
      res,
      conversation,
      "Conversation retrieved successfully",
      status.OK,
    );
  },
);

const getUserConversations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const page = req.query.page as string;
  const limit = req.query.limit as string;

  // Check if user is a vendor
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
  });
  const isVendor = !!vendor;

  const {conversations, pagination} = await chatService.getUserConversations({
    userId,
    page,
    limit,
    isVendor,
  });

  ApiResponse.paginated(res, conversations, pagination, "Conversations retrieved successfully");
});

const getConversationById = catchAsync(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user.userId as string;

  const conversation = await chatService.getConversationById(
    conversationId,
    userId,
  );

  res.status(status.OK).json({
    success: true,
    message: "Conversation retrieved successfully",
    data: conversation,
  });
});

const deleteConversation = catchAsync(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user.userId as string;

  await chatService.deleteConversation(conversationId, userId);

  res.status(status.OK).json({
    success: true,
    message: "Conversation deleted successfully",
    data: null,
  });
});

const updateLastSeen = catchAsync(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user.userId as string;

  await chatService.updateLastSeen(conversationId, userId);

  res.status(status.OK).json({
    success: true,
    message: "Last seen updated successfully",
    data: null,
  });
});

// ==================== MESSAGE CONTROLLERS ====================

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user.userId as string;

  const result = await chatService.getMessages({
    conversationId,
    userId,
  });

  res.status(status.OK).json({
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const conversationId = req.params.conversationId as string;
  const userId = req.user.userId as string;
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    throw new AppError(status.BAD_REQUEST, "Message text is required");
  }

  const message = await chatService.sendMessage({
    conversationId,
    senderId: userId,
    text: text.trim(),
  });

  res.status(status.CREATED).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
});

const getMessageById = catchAsync(async (req: Request, res: Response) => {
  const messageId = req.params.messageId as string;
  const userId = req.user.userId as string;

  const message = await chatService.getMessageById(messageId, userId);

  res.status(status.OK).json({
    success: true,
    message: "Message retrieved successfully",
    data: message,
  });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const messageId = req.params.messageId as string;
  const userId = req.user.userId as string;

  await chatService.deleteMessage(messageId, userId);

  res.status(status.OK).json({
    success: true,
    message: "Message deleted successfully",
    data: null,
  });
});

// ==================== UTILITY CONTROLLERS ====================

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId as string;

  // Check if user is a vendor
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
  });
  const isVendor = !!vendor;

  const result = await chatService.getUnreadCount(userId, isVendor);

  res.status(status.OK).json({
    success: true,
    message: "Unread count retrieved successfully",
    data: result,
  });
});

export const chatController = {
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
