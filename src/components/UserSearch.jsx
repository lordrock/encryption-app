import { useState } from "react";
import { searchUsers } from "../api/whisperbox";
import { getSession } from "../auth/sessionStore";
import "../chatpage.css";

export default function UserSearch({ onSelectUser }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    const session = getSession();

    if (!session?.accessToken) {
      setError("You must be logged in.");
      return;
    }

    if (!query.trim()) {
      setError("Enter a username or display name.");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const result = await searchUsers(session.accessToken, query);
      setUsers(result);
    } catch (error) {
      setError(error.message || "User search failed.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="panel">
      <h2>Find recipient</h2>
      <p className="muted">Search for another user to start encrypted chat.</p>

      <form onSubmit={handleSearch} className="search-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search username..."
        />

        <button className="primary-btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <div className="user-list">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            className="user-item"
            onClick={() => onSelectUser(user)}
          >
            <strong>{user.display_name}</strong>
            <span>@{user.username}</span>
          </button>
        ))}
      </div>
    </section>
  );
}