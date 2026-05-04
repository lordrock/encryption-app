const BASE_URL = "https://whisperbox.koyeb.app";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || "Request failed");
  }

  return data;
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(accessToken) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function refreshAccessToken(refreshToken) {
  return request("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });
}

export function logoutUser(accessToken, refreshToken) {
  return request("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });
}

export function searchUsers(accessToken, query) {
  return request(`/users/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getUserPublicKey(accessToken, userId) {
  return request(`/users/${userId}/public-key`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getConversations(accessToken) {
  return request("/conversations", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getMessages(accessToken, userId) {
  return request(`/conversations/${userId}/messages`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function sendMessage(accessToken, to, payload) {
  return request("/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to,
      payload,
    }),
  });
}