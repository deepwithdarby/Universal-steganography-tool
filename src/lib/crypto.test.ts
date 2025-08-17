import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt, decrypt } from './crypto';

// Mock Web Crypto API
const subtleCrypto = {
  importKey: vi.fn(),
  deriveKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
};

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn(),
    subtle: subtleCrypto,
  },
});

describe('Crypto Module', () => {
  const MOCK_KEY = 'mock-key';
  const MOCK_SALT = new Uint8Array(16).fill(1);
  const MOCK_IV = new Uint8Array(12).fill(2);
  const MOCK_CIPHERTEXT = new TextEncoder().encode('encrypted').buffer;
  const MOCK_PLAINTEXT = 'hello world';
  const MOCK_PLAINTEXT_BUFFER = new TextEncoder().encode(MOCK_PLAINTEXT).buffer;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks for a successful round trip
    vi.spyOn(global.crypto, 'getRandomValues').mockImplementation((buffer: Uint8Array) => {
        if (buffer.length === 16) return buffer.fill(1); // Salt
        if (buffer.length === 12) return buffer.fill(2); // IV
        return buffer;
    });

    subtleCrypto.importKey.mockResolvedValue('mock-base-key');
    subtleCrypto.deriveKey.mockResolvedValue(MOCK_KEY);
    subtleCrypto.encrypt.mockResolvedValue(MOCK_CIPHERTEXT);
    subtleCrypto.decrypt.mockResolvedValue(MOCK_PLAINTEXT_BUFFER);
  });

  it('should encrypt and decrypt a message successfully', async () => {
    const password = 'my-password';

    const encrypted = await encrypt(MOCK_PLAINTEXT, password);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');

    const decrypted = await decrypt(encrypted, password);
    expect(decrypted).toBe(MOCK_PLAINTEXT);
  });

  it('should fail to decrypt with a wrong password', async () => {
    const password = 'my-password';
    const wrongPassword = 'wrong-password';

    // Simulate a failure on decrypt
    subtleCrypto.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));

    const encrypted = await encrypt(MOCK_PLAINTEXT, password);
    const decrypted = await decrypt(encrypted, wrongPassword);

    expect(decrypted).toBeNull();
  });

  it('should handle empty message', async () => {
    const password = 'my-password';

    // Adjust mock for empty string
    subtleCrypto.encrypt.mockResolvedValueOnce(new ArrayBuffer(0));
    subtleCrypto.decrypt.mockResolvedValueOnce(new ArrayBuffer(0));

    const encrypted = await encrypt('', password);
    const decrypted = await decrypt(encrypted, password);

    expect(decrypted).toBe('');
  });
});
