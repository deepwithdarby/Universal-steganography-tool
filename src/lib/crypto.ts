// A simple text encoder for converting strings to Uint8Array
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// --- Helper functions for Base64 encoding/decoding ---
const toBase64 = (buffer: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromBase64 = (str: string): Uint8Array => Uint8Array.from(atob(str), c => c.charCodeAt(0));

/**
 * Derives a key from a password and salt using PBKDF2.
 * @param password The user's password.
 * @param salt A random salt.
 * @returns A CryptoKey suitable for AES-GCM.
 */
const getKey = (password: string, salt: Uint8Array): Promise<CryptoKey> => {
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
        iterations: 100000, // A good starting point
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  );
};

/**
 * Encrypts a plaintext message with a password.
 * @param plaintext The message to encrypt.
 * @param password The password to use for encryption.
 * @returns A promise that resolves to a base64 string: "salt.iv.ciphertext".
 */
export const encrypt = async (plaintext: string, password: string): Promise<string> => {
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

/**
 * Decrypts a ciphertext with a password.
 * @param encryptedString The base64 string in "salt.iv.ciphertext" format.
 * @param password The password to use for decryption.
 * @returns A promise that resolves to the decrypted plaintext, or null if decryption fails.
 */
export const decrypt = async (encryptedString: string, password: string): Promise<string | null> => {
  try {
    const parts = encryptedString.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted string format.");
    }
    const [encodedSalt, encodedIv, encodedCiphertext] = parts;

    const salt = fromBase64(encodedSalt);
    const iv = fromBase64(encodedIv);
    // Allow ciphertext to be empty for the case of an empty encrypted string
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
    return null; // Return null on any error (e.g., wrong password, tampered data)
  }
};
