import { Server } from "socket.io";
import { chatService } from "./chat.service";
import { prisma } from "../../lib/prisma";
import { SocketEvents } from "../../constants/socket";
import {
  AuthenticatedSocket,
  JoinConversationPayload,
  LeaveConversationPayload,
  SendMessagePayload,
  TypingPayload,
  DeleteMessagePayload,
} from "./chat.interface";
import chatHelper from "./chat.helper";

// ==================== SOCKET AUTHENTICATION ====================

export const authenticateSocket = async (
  socket: AuthenticatedSocket,
): Promise<boolean> => {
  try {
    // TODO: Enable real authentication when tokens are ready
    // const token =
    //   socket.handshake.auth.token ||
    //   socket.handshake.headers.authorization?.replace("Bearer ", "");

    // if (!token) {
    //   console.error("Socket authentication failed: No token provided");
    //   return false;
    // }

    // const decoded = jwt.verify(token, ENV.JWT_SECRET as string) as {
    //   userId: string;
    // };

    // if (!decoded?.userId) return false;

    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    //   select: { id: true, email: true, name: true },
    // });

    // if (!user) return false;

    // socket.user = user;

    // Fake user for development
    socket.user = {
      id: "1853a7e1-babf-41a9-96ba-86a9c2f75e58",
      email: "fake@example.com",
      name: "Fake User",
    };
    socket.activeConversations = new Set();
    return true;
  } catch (error) {
    console.error("Socket authentication error:", error);
    return false;
  }
};

// ==================== BROADCAST HELPERS ====================

// ==================== ERROR HANDLING ====================

interface SocketError {
  success: false;
  message: string;
  code: string;
  tempId?: string;
  timestamp: string;
}

const emitError = (
  socket: AuthenticatedSocket,
  message: string,
  code: string,
  tempId?: string,
) => {
  const error: SocketError = {
    success: false,
    message,
    code,
    tempId,
    timestamp: new Date().toISOString(),
  };
  socket.emit(SocketEvents.ERROR, error);
};

const broadcastToConversation = (
  io: Server,
  conversationId: string,
  event: string,
  data: unknown,
  excludeSocketId?: string,
) => {
  if (excludeSocketId) {
    io.to(conversationId).except(excludeSocketId).emit(event, data);
  } else {
    io.to(conversationId).emit(event, data);
  }
};

// ==================== SOCKET EVENT HANDLERS ====================

const handleJoinConversation = async (
  socket: AuthenticatedSocket,
  _io: Server,
  payload: JoinConversationPayload,
) => {
  try {
    if (!socket.user)
      return emitError(socket, "Authentication required", "AUTH_REQUIRED");

    const { conversationId } = payload;
    const userId = socket.user.id;

    // Validate access
    await chatHelper.validateAccess(conversationId, userId);

    // Leave previous conversations
    socket.activeConversations?.forEach((id) => {
      if (id !== conversationId) {
        socket.leave(id);
        socket
          .to(id)
          .emit(SocketEvents.USER_LEFT, { userId, conversationId: id });
      }
    });

    socket.join(conversationId);
    socket.activeConversations?.add(conversationId);

    await chatService.updateLastSeen(conversationId, userId);

    socket.to(conversationId).emit(SocketEvents.USER_JOINED, {
      userId,
      conversationId,
      joinedAt: new Date().toISOString(),
    });

    socket.emit(SocketEvents.JOINED_CONVERSATION, {
      conversationId,
      success: true,
    });
  } catch (error: any) {
    console.error("Error joining conversation:", error);
    emitError(
      socket,
      error.message || "Failed to join conversation",
      "JOIN_FAILED",
    );
  }
};

const handleLeaveConversation = async (
  socket: AuthenticatedSocket,
  payload: LeaveConversationPayload,
) => {
  try {
    if (!socket.user)
      return emitError(socket, "Authentication required", "AUTH_REQUIRED");

    const { conversationId } = payload;
    const userId = socket.user.id;

    socket.leave(conversationId);
    socket.activeConversations?.delete(conversationId);

    socket.to(conversationId).emit(SocketEvents.USER_LEFT, {
      userId,
      conversationId,
      leftAt: new Date().toISOString(),
    });

    socket.emit(SocketEvents.LEFT_CONVERSATION, {
      conversationId,
      success: true,
    });
  } catch (error: any) {
    console.error("Error leaving conversation:", error);
    emitError(
      socket,
      error.message || "Failed to leave conversation",
      "LEAVE_FAILED",
    );
  }
};

const handleSendMessage = async (
  socket: AuthenticatedSocket,
  io: Server,
  payload: SendMessagePayload,
) => {
  try {
    if (!socket.user)
      return emitError(
        socket,
        "Authentication required",
        "AUTH_REQUIRED",
        payload.tempId,
      );

    console.log(socket.user);

    const { conversationId, text, tempId } = payload;

    if (!text?.trim()) {
      return emitError(
        socket,
        "Message text is required",
        "VALIDATION_ERROR",
        tempId,
      );
    }

    const message = await chatService.sendMessage({
      conversationId,
      senderId: socket.user.id,
      text: text.trim(),
    });

    broadcastToConversation(io, conversationId, SocketEvents.NEW_MESSAGE, {
      ...message,
      tempId,
    });

    socket.emit(SocketEvents.MESSAGE_SENT, { message, tempId, success: true });
  } catch (error: any) {
    console.error("Error sending message:", error);
    emitError(
      socket,
      error.message || "Failed to send message",
      "SEND_FAILED",
      payload.tempId,
    );
  }
};

const handleTyping = (socket: AuthenticatedSocket, payload: TypingPayload) => {
  try {
    if (!socket.user)
      return emitError(socket, "Authentication required", "AUTH_REQUIRED");

    const { conversationId, isTyping } = payload;

    if (!conversationId) {
      return emitError(socket, "Conversation ID required", "VALIDATION_ERROR");
    }

    socket.to(conversationId).emit(SocketEvents.TYPING, {
      userId: socket.user.id,
      conversationId,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error handling typing event:", error);
    emitError(
      socket,
      error.message || "Failed to send typing status",
      "TYPING_FAILED",
    );
  }
};

const handleDeleteMessage = async (
  socket: AuthenticatedSocket,
  io: Server,
  payload: DeleteMessagePayload,
) => {
  try {
    if (!socket.user)
      return emitError(socket, "Authentication required", "AUTH_REQUIRED");

    const { messageId } = payload;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true },
    });

    if (!message) return emitError(socket, "Message not found", "NOT_FOUND");

    await chatService.deleteMessage(messageId, socket.user.id);

    broadcastToConversation(
      io,
      message.conversationId,
      SocketEvents.MESSAGE_DELETED,
      {
        messageId,
        conversationId: message.conversationId,
        deletedBy: socket.user.id,
        deletedAt: new Date().toISOString(),
      },
    );
  } catch (error: any) {
    console.error("Error deleting message:", error);
    emitError(
      socket,
      error.message || "Failed to delete message",
      "DELETE_FAILED",
    );
  }
};

// ==================== MAIN SOCKET REGISTRATION ====================

export const registerChatSocket = (io: Server) => {
  // Enable authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const isAuthenticated = await authenticateSocket(socket);
    if (isAuthenticated) {
      next();
    } else {
      next(new Error("Authentication failed"));
    }
  });

  io.on(SocketEvents.CONNECTION, (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.id} connected (${socket.id})`);

    socket.join(`user_${socket.user?.id}`);

    // Conversation events
    socket.on(
      SocketEvents.JOIN_CONVERSATION,
      (payload: JoinConversationPayload) => {
        handleJoinConversation(socket, io, payload);
      },
    );

    socket.on(
      SocketEvents.LEAVE_CONVERSATION,
      (payload: LeaveConversationPayload) => {
        handleLeaveConversation(socket, payload);
      },
    );

    // Message events
    socket.on(SocketEvents.SEND_MESSAGE, (payload: SendMessagePayload) => {
      handleSendMessage(socket, io, payload);
    });

    socket.on(SocketEvents.DELETE_MESSAGE, (payload: DeleteMessagePayload) => {
      handleDeleteMessage(socket, io, payload);
    });

    socket.on(SocketEvents.TYPING, (payload: TypingPayload) => {
      handleTyping(socket, payload);
    });

    // Disconnection
    socket.on(SocketEvents.DISCONNECT, () => {
      console.log(`User ${socket.user?.id} disconnected (${socket.id})`);

      socket.activeConversations?.forEach((conversationId) => {
        socket.to(conversationId).emit(SocketEvents.USER_OFFLINE, {
          userId: socket.user?.id,
          conversationId,
          offlineAt: new Date().toISOString(),
        });
      });
    });
  });
};
