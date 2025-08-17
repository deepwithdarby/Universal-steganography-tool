const ZERO_WIDTH_SPACE = '\u200B'; // Represents a '1'
const ZERO_WIDTH_NON_JOINER = '\u200C'; // Represents a '0'
const ZERO_WIDTH_JOINER = '\u200D'; // Terminator

// --- Binary conversion helpers using TextEncoder for proper UTF-8 support ---
const toBinary = (str: string): string => {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(str);
  return Array.from(encoded)
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
};

const fromBinary = (binary: string): string => {
  const bytes = new Uint8Array(binary.length / 8);
  for (let i = 0; i < binary.length; i += 8) {
    bytes[i / 8] = parseInt(binary.substring(i, i + 8), 2);
  }
  const textDecoder = new TextDecoder();
  return textDecoder.decode(bytes);
};

/**
 * Encodes a secret message into a cover text using zero-width characters.
 * @param secretMessage The message to hide.
 * @param coverText The text to hide the message in. If not provided, an empty string is used.
 * @returns The cover text with the secret message embedded.
 */
export const encodeText = (secretMessage: string, coverText: string = ''): string => {
  const binaryMessage = toBinary(secretMessage);

  const stegoMessage = binaryMessage
    .split('')
    .map((bit) => (bit === '1' ? ZERO_WIDTH_SPACE : ZERO_WIDTH_NON_JOINER))
    .join('');

  const finalMessage = stegoMessage + ZERO_WIDTH_JOINER;

  if (!coverText.trim()) {
    return finalMessage;
  }

  // Embed the message in the middle of the text for better concealment
  const middleIndex = Math.floor(coverText.length / 2);
  return coverText.slice(0, middleIndex) + finalMessage + coverText.slice(middleIndex);
};

/**
 * Decodes a secret message from a string containing zero-width characters.
 * @param stegoText The text containing the hidden message.
 * @returns The decoded secret message.
 */
export const decodeText = (stegoText: string): string | null => {
  // Find all zero-width characters
  const zeroWidthChars = stegoText.match(/[\u200B-\u200D]/g);
  if (!zeroWidthChars) {
    return null;
  }

  const terminator = ZERO_WIDTH_JOINER;
  const terminatorIndex = zeroWidthChars.indexOf(terminator);

  if (terminatorIndex === -1) {
    return null; // No message terminator found
  }

  // Handle empty message case
  if (terminatorIndex === 0) {
      return '';
  }

  const binaryMessage = zeroWidthChars
    .slice(0, terminatorIndex)
    .map(char => {
      if (char === ZERO_WIDTH_SPACE) return '1';
      if (char === ZERO_WIDTH_NON_JOINER) return '0';
      return '';
    }).join('');

  if (binaryMessage.length % 8 !== 0) {
      // Data is likely corrupt
      return null;
  }

  try {
    return fromBinary(binaryMessage);
  } catch (e) {
    console.error("Failed to decode binary string:", e);
    return null;
  }
};
