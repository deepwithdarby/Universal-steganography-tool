import { describe, it, expect } from 'vitest';
import { encodeText, decodeText } from './text-steganography';

describe('Text Steganography Module', () => {
  it('should encode and decode a simple message', () => {
    const secretMessage = 'Hello World';
    const coverText = 'This is a normal sentence.';
    const encoded = encodeText(secretMessage, coverText);
    const decoded = decodeText(encoded);
    expect(decoded).toBe(secretMessage);
  });

  it('should work without a cover text', () => {
    const secretMessage = 'Top secret!';
    const encoded = encodeText(secretMessage);
    const decoded = decodeText(encoded);
    expect(decoded).toBe(secretMessage);
    // Ensure the result is just the invisible characters
    expect(encoded.replace(/[\u200B-\u200D]/g, '').length).toBe(0);
  });

  it('should return null when no hidden message is present', () => {
    const normalText = 'Just a regular string with no secrets.';
    const decoded = decodeText(normalText);
    expect(decoded).toBeNull();
  });

  it('should handle special characters and unicode', () => {
    const secretMessage = '你好, world! 123$#@`~©';
    const coverText = 'Here is some text.';
    const encoded = encodeText(secretMessage, coverText);
    const decoded = decodeText(encoded);
    expect(decoded).toBe(secretMessage);
  });

  it('should handle an empty message', () => {
    const secretMessage = '';
    const coverText = 'Cover text.';
    const encoded = encodeText(secretMessage, coverText);
    const decoded = decodeText(encoded);
    expect(decoded).toBe(secretMessage);
  });
});
