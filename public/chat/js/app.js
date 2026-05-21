// Socket event constants (matching backend)
const SocketEvents = {
  CONNECT: "connect", // Socket.IO client event
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
};

// Global state
let socket = null;
let currentConversationId = null;
let currentUserId = null;
const messages = new Map();

function log(message, type = "info") {
  const container = document.getElementById("logsContainer");
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  container.insertBefore(entry, container.firstChild);

  while (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }
}

function toggleConnection() {
  if (socket?.connected) {
    disconnect();
  } else {
    connect();
  }
}

function connect() {
  const serverUrl = document.getElementById("serverUrl").value;
  const token = document.getElementById("jwtToken").value;

  // Note: Token is optional since backend uses fake user for now
  log("Connecting to server...", "info");

  const socketOptions = {
    transports: ["websocket", "polling"],
    ...(token && { auth: { token } }),
  };

  log("Connecting to: " + serverUrl, "info");
  socket = io(serverUrl, socketOptions);

  socket.on(SocketEvents.CONNECT, () => {
    log("✅ Connected with socket ID: " + socket.id, "success");
    updateConnectionStatus(true);
    enableControls(true);
  });

  socket.on(SocketEvents.DISCONNECT, (reason) => {
    log("❌ Disconnected: " + reason, "error");
    updateConnectionStatus(false);
    enableControls(false);
  });

  socket.on("connect_error", (error) => {
    log("❌ Connection error: " + error.message, "error");
    console.error("Full error:", error);
  });

  socket.on("connect_timeout", () => {
    log("❌ Connection timeout", "error");
  });

  socket.on(SocketEvents.JOINED_CONVERSATION, (data) => {
    log("Joined conversation: " + JSON.stringify(data), "success");
    currentConversationId = data.conversationId;
    updateChatHeader(data.conversationId);
  });

  socket.on(SocketEvents.LEFT_CONVERSATION, (data) => {
    log("Left conversation: " + JSON.stringify(data), "info");
    if (currentConversationId === data.conversationId) {
      currentConversationId = null;
      clearMessages();
    }
  });

  socket.on(SocketEvents.NEW_MESSAGE, (data) => {
    log(
      "New message received from: " + (data.sender?.name || "Unknown"),
      "event",
    );
    addMessageToUI(data, data.senderId === currentUserId);
  });

  socket.on(SocketEvents.MESSAGE_SENT, (data) => {
    log("Message confirmed: " + data.tempId, "success");
    // Update temp message with real ID if needed
    const tempElement = document.getElementById("msg-" + data.tempId);
    if (tempElement && data.message) {
      tempElement.id = "msg-" + data.message.id;
    }
  });

  socket.on(SocketEvents.TYPING, (data) => {
    if (data.isTyping) {
      showTypingIndicator(data.userId);
    } else {
      hideTypingIndicator();
    }
  });

  socket.on(SocketEvents.MESSAGE_DELETED, (data) => {
    log("Message deleted: " + data.messageId, "event");
    const msgElement = document.getElementById("msg-" + data.messageId);
    if (msgElement) {
      msgElement.remove();
    }
  });

  socket.on(SocketEvents.ERROR, (data) => {
    log("Error: " + (data.message || JSON.stringify(data)), "error");
  });

  socket.on(SocketEvents.USER_JOINED, (data) => {
    log("User joined: " + data.userId, "event");
  });

  socket.on(SocketEvents.USER_LEFT, (data) => {
    log("User left: " + data.userId, "event");
  });

  socket.on(SocketEvents.USER_OFFLINE, (data) => {
    log("User went offline: " + data.userId, "event");
  });
}

function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  updateConnectionStatus(false);
  enableControls(false);
  clearMessages();
}

function updateConnectionStatus(connected) {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const btn = document.getElementById("connectBtn");

  if (connected) {
    dot.classList.add("connected");
    text.textContent = "Connected";
    btn.textContent = "Disconnect";
  } else {
    dot.classList.remove("connected");
    text.textContent = "Disconnected";
    btn.textContent = "Connect";
  }
}

function enableControls(enabled) {
  document.getElementById("joinBtn").disabled = !enabled;
  document.getElementById("messageInput").disabled = !enabled;
  document.getElementById("sendBtn").disabled = !enabled;
}

function joinConversation() {
  const conversationId = document.getElementById("conversationId").value;
  if (!conversationId) {
    alert("Please enter a conversation ID");
    return;
  }

  log("Joining conversation: " + conversationId, "info");
  socket.emit(SocketEvents.JOIN_CONVERSATION, { conversationId });
}

function leaveConversation() {
  if (!currentConversationId) return;
  socket.emit(SocketEvents.LEAVE_CONVERSATION, {
    conversationId: currentConversationId,
  });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if (!text || !currentConversationId) return;

  const tempId = "temp-" + Date.now();
  const messageData = {
    conversationId: currentConversationId,
    text: text,
    tempId: tempId,
  };

  socket.emit(SocketEvents.SEND_MESSAGE, messageData);
  log("Sending message: " + tempId, "info");

  // Optimistically add to UI
  addMessageToUI(
    {
      id: tempId,
      text: text,
      senderId: currentUserId,
      sender: { name: "You" },
      createdAt: new Date().toISOString(),
    },
    true,
  );

  input.value = "";
  sendTyping(false);
}

function deleteMessage(messageId) {
  if (!socket || !currentConversationId) return;
  socket.emit(SocketEvents.DELETE_MESSAGE, { messageId });
}

let typingTimeout = null;
function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
    return;
  }
  // Send typing indicator
  sendTyping(true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => sendTyping(false), 2000);
}

function sendTyping(isTyping) {
  if (!socket || !currentConversationId) return;
  socket.emit(SocketEvents.TYPING, {
    conversationId: currentConversationId,
    isTyping,
  });
}

function addMessageToUI(message, isSent) {
  const container = document.getElementById("messagesContainer");

  const welcomeScreen = container.querySelector(".welcome-screen");
  if (welcomeScreen) {
    welcomeScreen.remove();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isSent ? "sent" : "received"}`;
  messageDiv.id = "msg-" + message.id;

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <div class="message-content">
      ${!isSent ? `<div class="message-sender">${message.sender?.name || "Unknown"}</div>` : ""}
      <div>${escapeHtml(message.text)}</div>
      <div class="message-meta">${time}</div>
    </div>
  `;

  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;

  messages.set(message.id, message);
}

function clearMessages() {
  const container = document.getElementById("messagesContainer");
  container.innerHTML = `
    <div class="welcome-screen">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
      <h3>Welcome to Chat Test</h3>
      <p>Connect to the server and join a conversation to start testing</p>
    </div>
  `;
  currentConversationId = null;
  currentUserId = null;
  messages.clear();
}

function updateChatHeader(conversationId) {
  document.getElementById("chatTitle").textContent =
    "Conversation: " + conversationId.substring(0, 8) + "...";
  document.getElementById("chatSubtitle").textContent =
    "Connected and ready to chat";
}

function loadMessages() {
  if (!currentConversationId) {
    log("No active conversation", "error");
    return;
  }

  log("Loading messages from API...", "info");

  const token = document.getElementById("jwtToken").value;
  const headers = token ? { Authorization: "Bearer " + token } : {};

  const serverUrl = document.getElementById("serverUrl").value;
  const apiBaseUrl = serverUrl.replace(/\/$/, "");

  fetch(
    `${apiBaseUrl}/api/v1/chat/conversations/${currentConversationId}/messages`,
    {
      headers,
    },
  )
    .then((res) => res.json())
    .then((result) => {
      if (result.success && result.data?.messages) {
        document.getElementById("messagesContainer").innerHTML = "";
        result.data.messages.forEach((msg) => {
          addMessageToUI(msg, msg.senderId === currentUserId);
        });
        log(`Loaded ${result.data.messages.length} messages`, "success");
      }
    })
    .catch((err) => {
      log("Failed to load messages: " + err.message, "error");
    });
}

function showTypingIndicator(userId) {
  document.getElementById("typingIndicator").classList.add("visible");
}

function hideTypingIndicator() {
  document.getElementById("typingIndicator").classList.remove("visible");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
log("Chat test interface loaded", "info");
