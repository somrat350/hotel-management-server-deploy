import { Router } from "express";
import { chatController } from "./chat.controller";
import { isAuthenticated } from "../../middlewares/isAuthenticated";
import { validateRequest } from "../../middlewares/validateRequest";
import { createConversationSchema, sendMessageSchema } from "./chat.validation";

const router: Router = Router();

router.use(isAuthenticated);

// ==================== CONVERSATION ROUTES ====================

// Create a new conversation (user-hotel)
router.post(
  "/conversations",
  validateRequest(createConversationSchema),
  chatController.getOrCreateConversation,
);

// Get all conversations for the current user
router.get("/conversations", chatController.getUserConversations);

// Get a specific conversation by ID
router.get(
  "/conversations/:conversationId",
  chatController.getConversationById,
);

// Delete a conversation
router.delete(
  "/conversations/:conversationId",
  chatController.deleteConversation,
);

// Update conversation last seen
router.patch(
  "/conversations/:conversationId/last-seen",
  chatController.updateLastSeen,
);

// ==================== MESSAGE ROUTES ====================

// Get messages for a conversation with pagination
router.get(
  "/conversations/:conversationId/messages",
  chatController.getMessages,
);

// Send a message (REST API fallback)
// router.post(
//   "/conversations/:conversationId/messages",
//   validateRequest(sendMessageSchema),
//   chatController.sendMessage,
// );

// Get a specific message
router.get("/messages/:messageId", chatController.getMessageById);

// Delete a message
router.delete("/messages/:messageId", chatController.deleteMessage);

// ==================== UTILITY ROUTES ====================

// Get unread message count for all conversations
router.get("/unread-count", chatController.getUnreadCount);

export const ChatRoutes = router;
