const SESSION_KEY = "whisperbox_session";

let inMemoryPrivateKey = null;
let inMemoryUser = null;

export function saveSession({ accessToken, refreshToken, user }) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      accessToken,
      refreshToken,
      user,
    })
  );

  inMemoryUser = user;
}

export function getSession() {
  const rawSession = sessionStorage.getItem(SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  inMemoryPrivateKey = null;
  inMemoryUser = null;
}

export function setPrivateKey(privateKey) {
  inMemoryPrivateKey = privateKey;
}

export function getPrivateKey() {
  return inMemoryPrivateKey;
}

export function setCurrentUser(user) {
  inMemoryUser = user;
}

export function getCurrentUserFromMemory() {
  return inMemoryUser;
}