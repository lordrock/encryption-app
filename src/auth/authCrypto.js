import {
  deriveWrappingKey,
  exportPublicKeyToBase64,
  generateRsaKeyPair,
  generateSalt,
  unwrapPrivateKey,
  wrapPrivateKey,
} from "../crypto/keys";

import { arrayBufferToBase64, base64ToArrayBuffer } from "../crypto/encoding";

import { loginUser, registerUser } from "../api/whisperbox";

import { saveSession, setCurrentUser, setPrivateKey } from "./sessionStore";

export async function registerWithCrypto({
  username,
  displayName,
  password,
}) {
  const keyPair = await generateRsaKeyPair();

  const salt = generateSalt();
  const wrappingKey = await deriveWrappingKey(password, salt);

  const publicKeyBase64 = await exportPublicKeyToBase64(keyPair.publicKey);
  const wrappedPrivateKeyBase64 = await wrapPrivateKey(
    keyPair.privateKey,
    wrappingKey
  );

  const response = await registerUser({
    username,
    display_name: displayName,
    password,
    public_key: publicKeyBase64,
    wrapped_private_key: wrappedPrivateKeyBase64,
    pbkdf2_salt: arrayBufferToBase64(salt.buffer),
  });

  saveSession({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    user: response.user,
  });

  setCurrentUser(response.user);
  setPrivateKey(keyPair.privateKey);

  return response;
}

export async function loginWithCrypto({ username, password }) {
  const response = await loginUser({
    username,
    password,
  });

  const user = response.user;

  const salt = new Uint8Array(base64ToArrayBuffer(user.pbkdf2_salt));
  const wrappingKey = await deriveWrappingKey(password, salt);

  const privateKey = await unwrapPrivateKey(
    user.wrapped_private_key,
    wrappingKey
  );

  saveSession({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    user,
  });

  setCurrentUser(user);
  setPrivateKey(privateKey);

  return response;
}