import {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  sendSocketMessage,
} from "../api/socket";
import { useEffect, useState, useRef } from "react";
import {
  getMessages,
  getUserPublicKey,
  sendMessage,
} from "../api/whisperbox";
import { clearSession, getPrivateKey, getSession } from "../auth/sessionStore";
import UserSearch from "../components/UserSearch";
import MessageBubble from "../components/MessageBubble";
import SecureBadge from "../components/SecureBadge";
import { importPublicKeyFromBase64 } from "../crypto/keys";
import {
  createEncryptedMessagePayload,
  decryptMessagePayload,
} from "../crypto/messages";
import "../chatpage.css";

export default function ChatPage({ onLogout }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const session = getSession();
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function handleLogout() {
    clearSession();
    onLogout();
  }

  async function loadHistory(user) {
    const privateKey = getPrivateKey();
    if (!session?.accessToken || !session?.user || !privateKey) {
      setError("Crypto session missing. Please login again.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const encryptedMessages = await getMessages(session.accessToken, user.id);
      const decryptedMessages = [];
      for (const item of encryptedMessages.reverse()) {
        try {
          const isOwnMessage = item.from_user_id === session.user.id;
          const text = await decryptMessagePayload({
            payload: item.payload,
            privateKey,
            isOwnMessage,
          });
          decryptedMessages.push({
            id: item.id,
            text,
            createdAt: item.created_at,
            fromUserId: item.from_user_id,
            toUserId: item.to_user_id,
          });
        } catch {
          decryptedMessages.push({
            id: item.id,
            text: "[Unable to decrypt message]",
            createdAt: item.created_at,
            fromUserId: item.from_user_id,
            toUserId: item.to_user_id,
          });
        }
      }
      setMessages(decryptedMessages);
    } catch (error) {
      setError(error.message || "Failed to load messages.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleSelectUser(user) {
    setSelectedUser(user);
    setMessages([]);
    setSidebarOpen(false); // auto-collapse sidebar on mobile after selection
    await loadHistory(user);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    const privateKey = getPrivateKey();
    if (!session?.accessToken || !session?.user || !privateKey || !selectedUser) {
      setError("Missing session, private key, or recipient.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const recipientKeyResponse = await getUserPublicKey(
        session.accessToken,
        selectedUser.id
      );
      const recipientPublicKey = await importPublicKeyFromBase64(
        recipientKeyResponse.public_key
      );
      const senderPublicKey = await importPublicKeyFromBase64(
        session.user.public_key
      );
      const payload = await createEncryptedMessagePayload({
        plaintext: draft,
        recipientPublicKey,
        senderPublicKey,
      });
    
        let sentMessage = null;

        if (isSocketConnected()) {
        sendSocketMessage(selectedUser.id, payload);

        sentMessage = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
        };
        } else {
        sentMessage = await sendMessage(
            session.accessToken,
            selectedUser.id,
            payload
        );
        }

        setMessages((current) => [
        ...current,
        {
            id: sentMessage.id,
            text: draft,
            createdAt: sentMessage.created_at,
            fromUserId: session.user.id,
            toUserId: selectedUser.id,
        },
        ]);



      setDraft("");
      textareaRef.current?.focus();
    } catch (error) {
      setError(error.message || "Failed to send encrypted message.");
    } finally {
      setStatus("idle");
    }
  }

  useEffect(() => {
    if (selectedUser) loadHistory(selectedUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName =
    session?.user?.display_name || session?.user?.username || "You";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);


useEffect(() => {
  if (!session?.accessToken) return;

  const ws = connectSocket(session.accessToken, {
    onOpen: () => {
      setSocketStatus("connected");
      setError("");
    },

    onClose: () => {
      setSocketStatus("disconnected");
    },

    onError: (message) => {
      setSocketStatus("disconnected");
      setError(message || "WebSocket error. Messages can still send using REST fallback.");
    },

    onUserOnline: (userId) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.add(userId);
        return next;
      });
    },

    onUserOffline: (userId) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    },

    onMessage: async (incomingMessage) => {
      const privateKey = getPrivateKey();

      if (!privateKey || !session?.user) return;

      try {
        const isOwnMessage = incomingMessage.from_user_id === session.user.id;

        const text = await decryptMessagePayload({
          payload: incomingMessage.payload,
          privateKey,
          isOwnMessage,
        });

        setMessages((current) => [
          ...current,
          {
            id: incomingMessage.id,
            text,
            createdAt: incomingMessage.created_at,
            fromUserId: incomingMessage.from_user_id,
            toUserId: incomingMessage.to_user_id,
          },
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: incomingMessage.id,
            text: "[Unable to decrypt message]",
            createdAt: incomingMessage.created_at,
            fromUserId: incomingMessage.from_user_id,
            toUserId: incomingMessage.to_user_id,
          },
        ]);
      }
    },
  });

  return () => {
    // In development, React Strict Mode may mount/unmount quickly.
    // Keeping cleanup controlled avoids reconnect spam.
    if (ws && ws.readyState === WebSocket.OPEN) {
      disconnectSocket();
    }
  };
}, [session?.accessToken]);


  return (
    <div className="wb-shell">
      {/* ── Sidebar ── */}
      <aside className={`wb-sidebar ${sidebarOpen ? "wb-sidebar--open" : "wb-sidebar--closed"}`}>
        {/* Sidebar header */}
        <div className="wb-sidebar__header">
          <div className="wb-avatar wb-avatar--self" title={displayName}>
            {initials}
          </div>
          <div className="wb-sidebar__title">
            <span className="wb-sidebar__app-name">WhisperBox</span>
            <span className="wb-sidebar__username">
              @{session?.user?.username}
            </span>
          </div>
          <button
            className="wb-icon-btn wb-logout-btn"
            onClick={handleLogout}
            title="Logout"
            type="button"
          >
            {/* door-exit icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Lock badge */}
        <div className="wb-sidebar__badge">
          <SecureBadge />
          <p className="muted">
                Realtime status:{" "}
            <strong className={socketStatus === "connected" ? "success" : "error"}>
                {socketStatus}
            </strong>
          </p>
        </div>

        {/* Search */}
        <div className="wb-sidebar__search">
          <UserSearch onSelectUser={handleSelectUser} />
        </div>
      </aside>

      {/* ── Mobile toggle ── */}
      <button
        className="wb-sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        type="button"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <main className="wb-chat">
        {selectedUser ? (
          <>
            {/* Conversation header */}
            <header className="wb-chat__header">
              <button
                className="wb-icon-btn wb-back-btn"
                onClick={() => setSidebarOpen(true)}
                type="button"
                aria-label="Back to contacts"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="wb-avatar wb-avatar--recipient">
                {selectedUser.display_name?.[0]?.toUpperCase() ||
                  selectedUser.username?.[0]?.toUpperCase()}
              </div>

              <div className="wb-chat__header-info">
                <h2 className="wb-chat__header-name">
                  {selectedUser.display_name || selectedUser.username}
                </h2>
                <span className="wb-chat__header-sub">
                  @{selectedUser.username}
                </span>
                <p className="muted">
                    @{selectedUser.username} ·{" "}
                    {onlineUsers.has(selectedUser.id) ? "Online" : "Offline/unknown"}
                </p>
              </div>

              <span className="wb-enc-pill">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                End-to-end encrypted
              </span>
            </header>

            {/* Error bar */}
            {error && (
              <div className="wb-error-bar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Messages */}
            <div className="wb-messages">
              {status === "loading" ? (
                <div className="wb-messages__loading">
                  <span className="wb-dot-pulse" />
                  <span className="wb-dot-pulse wb-dot-pulse--2" />
                  <span className="wb-dot-pulse wb-dot-pulse--3" />
                </div>
              ) : messages.length === 0 ? (
                <div className="wb-messages__empty">
                  <div className="wb-messages__empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p>No messages yet.</p>
                  <span>Send the first encrypted message below.</span>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.fromUserId === session.user.id}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="wb-composer">
              <textarea
                ref={textareaRef}
                className="wb-composer__input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message (Enter to send, Shift+Enter for new line)…"
                rows={1}
              />
              <button
                className={`wb-composer__send ${status === "sending" ? "wb-composer__send--busy" : ""}`}
                type="button"
                onClick={handleSendMessage}
                disabled={status === "sending" || !draft.trim()}
                aria-label="Send message"
              >
                {status === "sending" ? (
                  <span className="wb-spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="wb-chat__empty">
            <div className="wb-chat__empty-graphic">
              <svg viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="56" stroke="var(--wb-accent)" strokeWidth="2" strokeDasharray="8 6" />
                <rect x="28" y="38" width="64" height="44" rx="8" fill="var(--wb-accent)" fillOpacity=".12" stroke="var(--wb-accent)" strokeWidth="1.5" />
                <rect x="36" y="50" width="28" height="4" rx="2" fill="var(--wb-accent)" fillOpacity=".5" />
                <rect x="36" y="60" width="48" height="4" rx="2" fill="var(--wb-accent)" fillOpacity=".3" />
                <rect x="36" y="70" width="36" height="4" rx="2" fill="var(--wb-accent)" fillOpacity=".3" />
              </svg>
            </div>
            <h2>W-Box App</h2>
            <p>Search for a contact on the left and start an end-to-end encrypted conversation.</p>
            <span className="wb-chat__empty-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your messages are always encrypted
            </span>
          </div>
        )}
      </main>
    </div>
  );
}