const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromBase64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));

const getKey = (password, salt) => {
  return window.crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  ).then(baseKey =>
    window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  );
};

export const encrypt = async (plaintext, password) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    textEncoder.encode(plaintext)
  );

  const encodedSalt = toBase64(salt);
  const encodedIv = toBase64(iv);
  const encodedCiphertext = toBase64(ciphertext);

  return `${encodedSalt}.${encodedIv}.${encodedCiphertext}`;
};

export const decrypt = async (encryptedString, password) => {
  try {
    const parts = encryptedString.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted string format.");
    }
    const [encodedSalt, encodedIv, encodedCiphertext] = parts;

    const salt = fromBase64(encodedSalt);
    const iv = fromBase64(encodedIv);
    const ciphertext = encodedCiphertext ? fromBase64(encodedCiphertext) : new Uint8Array(0);

    const key = await getKey(password, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    return textDecoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};
