import { useState } from "react";
import { loginWithCrypto } from "../auth/authCrypto";
import "../chatpage.css";

export default function LoginPage({ onRegisterClick, onAuthSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("loading");

    try {
      await loginWithCrypto({
        username,
        password,
      });

      onAuthSuccess();
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Unlock your encrypted inbox.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
            <button
              className="primary-btn"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Unlocking..." : "Login"}
            </button>

            <button className="link-btn" type="button" onClick={onRegisterClick}>
              Need an account? Register
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}