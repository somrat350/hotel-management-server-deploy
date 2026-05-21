export const SocketEvents = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  JOIN_CONVERSATION: "join_conversation",
  LEAVE_CONVERSATION: "leave_conversation",
  JOINED_CONVERSATION: "joined_conversation",
  LEFT_CONVERSATION: "left_conversation",

  SEND_MESSAGE: "send_message",
  NEW_MESSAGE: "new_message",
  MESSAGE_SENT: "message_sent",
  DELETE_MESSAGE: "delete_message",
  MESSAGE_DELETED: "message_deleted",

  TYPING: "typing",

  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  USER_OFFLINE: "user_offline",

  ERROR: "error",
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
