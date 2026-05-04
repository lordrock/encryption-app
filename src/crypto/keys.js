import { arrayBufferToBase64, base64ToArrayBuffer } from "./encoding";

export async function generateRsaKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportPublicKeyToBase64(publicKey) {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(exported);
}

export async function importPublicKeyFromBase64(publicKeyBase64) {
  return crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(publicKeyBase64),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

export function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

export async function deriveWrappingKey(password, salt) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250000,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-KW",
      length: 256,
    },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

export async function wrapPrivateKey(privateKey, wrappingKey) {
  const wrapped = await crypto.subtle.wrapKey(
    "pkcs8",
    privateKey,
    wrappingKey,
    "AES-KW"
  );

  return arrayBufferToBase64(wrapped);
}

export async function unwrapPrivateKey(wrappedPrivateKeyBase64, wrappingKey) {
  return crypto.subtle.unwrapKey(
    "pkcs8",
    base64ToArrayBuffer(wrappedPrivateKeyBase64),
    wrappingKey,
    "AES-KW",
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}