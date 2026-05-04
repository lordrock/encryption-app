import { useState } from "react";
import { registerWithCrypto } from "../auth/authCrypto";

export default function RegisterPage({ onLoginClick, onAuthSuccess }) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("loading");

    try {
      await registerWithCrypto({
        username,
        displayName,
        password,
      });

      onAuthSuccess();
    } catch (error) {
      setError(error.message || "Registration failed");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Create secure account</h1>
        <p className="muted">
          Your browser creates your encryption keys before registration.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={32}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-display-name">Display name</label>
            <input
              id="register-display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
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
              {status === "loading"
                ? "Generating keys..."
                : "Register securely"}
            </button>

            <button className="link-btn" type="button" onClick={onLoginClick}>
              Already have an account? Login
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}