# WhisperBox E2EE Client

A secure messaging frontend built for the WhisperBox API. The app implements client-side end-to-end encryption so the backend only stores encrypted payloads and never sees plaintext messages.

## Objective

Build a secure messaging app where:

- encryption happens before sending data to the backend
- decryption happens only on the recipient device
- the server stores only encrypted blobs
- private keys never leave the client in plaintext

## Tech Stack

- React
- Vite
- Web Crypto API
- WhisperBox API
- Session Storage
- RSA-OAEP
- AES-GCM
- PBKDF2
- AES-KW

## Live Url

https://encryption-app-three.vercel.app

## Git Repo URL

https://github.com/lordrock/encryption-app

## API Base URL

```txt
https://whisperbox.koyeb.app


src/
├── api/
│   └── whisperbox.js
├── auth/
│   ├── authCrypto.js
│   └── sessionStore.js
├── components/
│   ├── MessageBubble.jsx
│   ├── SecureBadge.jsx
│   └── UserSearch.jsx
├── crypto/
│   ├── encoding.js
│   ├── keys.js
│   └── messages.js
├── pages/
│   ├── ChatPage.jsx
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── App.jsx
├── main.jsx
└── index.css