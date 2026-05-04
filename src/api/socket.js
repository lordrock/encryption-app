const WS_BASE_URL = "wss://whisperbox.koyeb.app/ws";

let socket = null;
let currentToken = null;

export function connectSocket(accessToken, handlers = {}) {
  if (!accessToken) {
    handlers.onError?.("Missing WebSocket token.");
    return null;
  }

  if (
    socket &&
    currentToken === accessToken &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return socket;
  }

  if (socket) {
    socket.close();
  }

  currentToken = accessToken;
  socket = new WebSocket(`${WS_BASE_URL}?token=${encodeURIComponent(accessToken)}`);

  socket.addEventListener("open", () => {
    handlers.onOpen?.();
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.event === "message.receive") {
        handlers.onMessage?.(data);
      }

      if (data.event === "user.online") {
        handlers.onUserOnline?.(data.user_id);
      }

      if (data.event === "user.offline") {
        handlers.onUserOffline?.(data.user_id);
      }

      if (data.event === "error") {
        handlers.onError?.(data.detail);
      }
    } catch {
      handlers.onError?.("Invalid WebSocket message received.");
    }
  });

  socket.addEventListener("close", () => {
    handlers.onClose?.();
  });

  socket.addEventListener("error", () => {
    handlers.onError?.("WebSocket connection failed.");
  });

  return socket;
}

export function sendSocketMessage(to, payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    throw new Error("WebSocket is not connected.");
  }

  socket.send(
    JSON.stringify({
      event: "message.send",
      to,
      payload,
    })
  );
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
  }

  socket = null;
  currentToken = null;
}

export function isSocketConnected() {
  return socket?.readyState === WebSocket.OPEN;
}