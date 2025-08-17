const ZERO_WIDTH_SPACE = '\u200B';
const ZERO_WIDTH_NON_JOINER = '\u200C';
const ZERO_WIDTH_JOINER = '\u200D';

const toBinary = (str) => {
  const textEncoder = new TextEncoder();
  const encoded = textEncoder.encode(str);
  return Array.from(encoded)
    .map(byte => byte.toString(2).padStart(8, '0'))
    .join('');
};

const fromBinary = (binary) => {
  const bytes = new Uint8Array(binary.length / 8);
  for (let i = 0; i < binary.length; i += 8) {
    bytes[i / 8] = parseInt(binary.substring(i, i + 8), 2);
  }
  const textDecoder = new TextDecoder();
  return textDecoder.decode(bytes);
};

export const encodeText = (secretMessage, coverText = '') => {
  const binaryMessage = toBinary(secretMessage);

  const stegoMessage = binaryMessage
    .split('')
    .map((bit) => (bit === '1' ? ZERO_WIDTH_SPACE : ZERO_WIDTH_NON_JOINER))
    .join('');

  const finalMessage = stegoMessage + ZERO_WIDTH_JOINER;

  if (!coverText.trim()) {
    return finalMessage;
  }

  const middleIndex = Math.floor(coverText.length / 2);
  return coverText.slice(0, middleIndex) + finalMessage + coverText.slice(middleIndex);
};

export const decodeText = (stegoText) => {
  const zeroWidthChars = stegoText.match(/[\u200B-\u200D]/g);
  if (!zeroWidthChars) {
    return null;
  }

  const terminator = ZERO_WIDTH_JOINER;
  const terminatorIndex = zeroWidthChars.indexOf(terminator);

  if (terminatorIndex === -1) {
    return null;
  }

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
      return null;
  }

  try {
    return fromBinary(binaryMessage);
  } catch (e) {
    console.error("Failed to decode binary string:", e);
    return null;
  }
};
