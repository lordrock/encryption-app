import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import { getSession } from "./auth/sessionStore";

export default function App() {
  const [view, setView] = useState(() => {
    return getSession() ? "chat" : "login";
  });

  const [authVersion, setAuthVersion] = useState(0);

  function handleAuthSuccess() {
    setAuthVersion((value) => value + 1);
    setView("chat");
  }

  function handleLogout() {
    setView("login");
  }

  if (view === "register") {
    return (
      <RegisterPage
        onLoginClick={() => setView("login")}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === "chat") {
    return <ChatPage key={authVersion} onLogout={handleLogout} />;
  }

  return (
    <LoginPage
      onRegisterClick={() => setView("register")}
      onAuthSuccess={handleAuthSuccess}
    />
  );
}