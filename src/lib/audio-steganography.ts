// This terminator is used to signify the end of the hidden message.
const MESSAGE_TERMINATOR = '0101010101010101'; // 16 bits

// --- Binary conversion helpers ---
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

// --- WAV conversion helper (from user prompt) ---
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  const channels = [];
  let offset = 0, pos = 0;

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byteRate
  setUint16(numOfChan * 2); // blockAlign
  setUint16(16); // bitsPerSample
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return bufferArray;
};


/**
 * Encodes a secret message into an audio file.
 * @param audioData The ArrayBuffer of the source audio file.
 * @param secretMessage The message to hide.
 * @returns A promise that resolves to a Blob of the new WAV file, or null.
 */
export const encodeAudio = async (audioData: ArrayBuffer, secretMessage: string): Promise<Blob | null> => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(audioData);
  const channelData = audioBuffer.getChannelData(0); // Use the left channel

  const binaryMessage = toBinary(secretMessage) + MESSAGE_TERMINATOR;

  if (binaryMessage.length > channelData.length) {
    console.error('Message is too long for this audio file.');
    return null;
  }

  for (let i = 0; i < binaryMessage.length; i++) {
    const sample = Math.round(channelData[i] * 32767); // Convert to 16-bit integer
    const bit = parseInt(binaryMessage[i], 2);
    const newSample = (sample & 0xFFFE) | bit; // Replace LSB
    channelData[i] = newSample / 32767;
  }

  const wavBuffer = audioBufferToWav(audioBuffer);
  return new Blob([wavBuffer], { type: 'audio/wav' });
};

/**
 * Decodes a secret message from an audio file.
 * @param audioData The ArrayBuffer of the WAV file containing the message.
 * @returns A promise that resolves to the decoded message, or null.
 */
export const decodeAudio = async (audioData: ArrayBuffer): Promise<string | null> => {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(audioData);
  const channelData = audioBuffer.getChannelData(0);

  let binaryMessage = '';
  for (let i = 0; i < channelData.length; i++) {
    const sample = Math.round(channelData[i] * 32767);
    const lsb = sample & 1;
    binaryMessage += lsb;

    if (binaryMessage.endsWith(MESSAGE_TERMINATOR)) {
      const rawMessage = binaryMessage.slice(0, -MESSAGE_TERMINATOR.length);
      try {
        return fromBinary(rawMessage);
      } catch (e) {
        console.error("Failed to decode binary string:", e);
        return null;
      }
    }
  }

  return null; // Terminator not found
};
