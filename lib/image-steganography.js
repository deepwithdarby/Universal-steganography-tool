const MESSAGE_TERMINATOR = '0101010101010101';

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

export const encodeImage = (image, secretMessage) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const binaryMessage = toBinary(secretMessage) + MESSAGE_TERMINATOR;

    if (binaryMessage.length > data.length) {
      console.error('Message is too long for this image.');
      return resolve(null);
    }

    for (let i = 0; i < binaryMessage.length; i++) {
      const pixelIndex = i * 4 + 3; // Alpha channel
      data[pixelIndex] = (data[pixelIndex] & 0xFE) | parseInt(binaryMessage[i], 2);
    }

    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
};

export const decodeImage = (image) => {
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
    for (let i = 3; i < data.length; i += 4) { // Read from Alpha channel
      const lsb = data[i] & 1;
      binaryMessage += lsb;

      if (binaryMessage.endsWith(MESSAGE_TERMINATOR)) {
        const rawMessage = binaryMessage.slice(0, -MESSAGE_TERMINATOR.length);
        try {
          return resolve(fromBinary(rawMessage));
        } catch (e) {
          return resolve(null);
        }
      }
    }
    resolve(null);
  });
};
