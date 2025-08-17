// A special string of bits to mark the end of the hidden message
const MESSAGE_TERMINATOR = '0101010101010101'; // 16 bits of alternating 0s and 1s

// Converts a string to its binary representation
const toBinary = (str: string): string => {
  return str
    .split('')
    .map((char) => {
      const binary = char.charCodeAt(0).toString(2);
      return '0'.repeat(8 - binary.length) + binary; // Pad to 8 bits
    })
    .join('');
};

// Converts a binary string back to a regular string
const fromBinary = (binary: string): string => {
  const bytes = binary.match(/.{1,8}/g) || [];
  return bytes
    .map((byte) => String.fromCharCode(parseInt(byte, 2)))
    .join('');
};

/**
 * Encodes a secret message into an image using LSB steganography.
 * @param image The source image element.
 * @param secretMessage The message to hide.
 * @returns A promise that resolves to a data URL of the new image, or null if it fails.
 */
export const encodeImage = (image: HTMLImageElement, secretMessage: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data; // Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]

    const binaryMessage = toBinary(secretMessage) + MESSAGE_TERMINATOR;

    if (binaryMessage.length > data.length) {
      console.error('Message is too long for this image.');
      return resolve(null);
    }

    // Embed the message bits into the alpha channel of each pixel
    for (let i = 0; i < binaryMessage.length; i++) {
      const pixelIndex = i * 4 + 3; // Point to the Alpha channel
      // Modify the LSB of the alpha value
      data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(binaryMessage[i], 2);
    }

    ctx.putImageData(imageData, 0, 0);
    resolve(canvas.toDataURL('image/png'));
  });
};

/**
 * Decodes a secret message from an image.
 * @param image The image containing the hidden message.
 * @returns A promise that resolves to the decoded message, or null if no message is found.
 */
export const decodeImage = (image: HTMLImageElement): Promise<string | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let binaryMessage = '';
    for (let i = 3; i < data.length; i += 4) { // Read from the Alpha channel
      const lsb = data[i] & 1;
      binaryMessage += lsb;

      // Check if we've found the terminator
      if (binaryMessage.endsWith(MESSAGE_TERMINATOR)) {
        const rawMessage = binaryMessage.slice(0, -MESSAGE_TERMINATOR.length);
        resolve(fromBinary(rawMessage));
        return;
      }
    }

    resolve(null); // Terminator not found
  });
};
