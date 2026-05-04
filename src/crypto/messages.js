import {
  arrayBufferToBase64,
  arrayBufferToString,
  base64ToArrayBuffer,
  stringToArrayBuffer,
} from "./encoding";

export async function generateAesKey() {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export function generateIv() {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function encryptTextWithAes(text, aesKey, iv) {
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    stringToArrayBuffer(text)
  );

  return arrayBufferToBase64(encrypted);
}

export async function decryptTextWithAes(ciphertextBase64, aesKey, ivBase64) {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(base64ToArrayBuffer(ivBase64)),
    },
    aesKey,
    base64ToArrayBuffer(ciphertextBase64)
  );

  return arrayBufferToString(decrypted);
}

export async function exportAesKey(aesKey) {
  return crypto.subtle.exportKey("raw", aesKey);
}

export async function importAesKey(rawKeyBuffer) {
  return crypto.subtle.importKey(
    "raw",
    rawKeyBuffer,
    {
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAesKeyWithRsa(aesKey, publicKey) {
  const rawAesKey = await exportAesKey(aesKey);

  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    rawAesKey
  );

  return arrayBufferToBase64(encryptedKey);
}

export async function decryptAesKeyWithRsa(encryptedKeyBase64, privateKey) {
  const rawAesKey = await crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    base64ToArrayBuffer(encryptedKeyBase64)
  );

  return importAesKey(rawAesKey);
}

export async function createEncryptedMessagePayload({
  plaintext,
  recipientPublicKey,
  senderPublicKey,
}) {
  const aesKey = await generateAesKey();
  const iv = generateIv();

  const ciphertext = await encryptTextWithAes(plaintext, aesKey, iv);

  const encryptedKey = await encryptAesKeyWithRsa(aesKey, recipientPublicKey);
  const encryptedKeyForSelf = await encryptAesKeyWithRsa(aesKey, senderPublicKey);

  return {
    ciphertext,
    iv: arrayBufferToBase64(iv.buffer),
    encryptedKey,
    encryptedKeyForSelf,
  };
}

export async function decryptMessagePayload({
  payload,
  privateKey,
  isOwnMessage,
}) {
  const encryptedAesKey = isOwnMessage
    ? payload.encryptedKeyForSelf
    : payload.encryptedKey;

  const aesKey = await decryptAesKeyWithRsa(encryptedAesKey, privateKey);

  return decryptTextWithAes(payload.ciphertext, aesKey, payload.iv);
}