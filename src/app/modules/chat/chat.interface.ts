import { ConversationType } from "@prisma/client";
import { Socket } from "socket.io";

// ==================== SOCKET ====================

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  activeConversations?: Set<string>;
}

// ==================== CONVERSATION ====================

export interface CreateConversationInput {
  hotelId: string;
  userId: string;
  type: ConversationType;
}

export interface GetConversationsInput {
  userId: string;
  page?: string;
  limit?: string;
  isVendor?: boolean;
}

// ==================== MESSAGE ====================

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  text: string;
}

export interface GetMessagesInput {
  conversationId: string;
  userId: string;
}

// ==================== SOCKET PAYLOADS ====================

export interface JoinConversationPayload {
  conversationId: string;
}

export interface LeaveConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
  tempId?: string;
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface DeleteMessagePayload {
  messageId: string;
}

// ==================== PAGINATION ====================

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationMeta;
}

// ==================== SERVICE RESPONSES ====================

export type ServiceResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: number };

export interface UnreadCountResponse {
  totalUnreadCount: number;
  conversationUnreadCounts: Record<string, number>;
}
