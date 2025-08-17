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

/**
 * Attempts to encode a secret message into a video stream.
 * NOTE: This is highly experimental and likely to fail due to video compression.
 * @param videoEl The source video element.
 * @param canvasEl The canvas element for frame manipulation.
 * @param secretMessage The message to hide.
 * @returns A promise that resolves to a Blob of the new video file, or null.
 */
export const encodeVideo = (
  videoEl: HTMLVideoElement,
  canvasEl: HTMLCanvasElement,
  secretMessage: string
): Promise<Blob | null> => {
  return new Promise((resolve, reject) => {
    const binaryMessage = toBinary(secretMessage) + MESSAGE_TERMINATOR;
    let bitIndex = 0;

    const stream = canvasEl.captureStream(30); // 30 FPS
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = (e) => {
        reject(e);
    };

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return reject(new Error('Could not get canvas context.'));

    const drawFrame = () => {
      if (videoEl.paused || videoEl.ended) {
        recorder.stop();
        return;
      }

      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      if (bitIndex < binaryMessage.length) {
          const frame = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
          const data = frame.data;

          for (let i = 0; i < data.length; i += 4) {
            if (bitIndex < binaryMessage.length) {
              const bit = parseInt(binaryMessage[bitIndex], 2);
              data[i] = (data[i] & 0xFE) | bit; // Embed in red channel LSB
              bitIndex++;
            } else {
              break;
            }
          }
          ctx.putImageData(frame, 0, 0);
      }

      requestAnimationFrame(drawFrame);
    };

    videoEl.oncanplay = () => {
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        recorder.start();
        videoEl.play();
        drawFrame();
    };

    if (videoEl.readyState >= 3) { // HAVE_FUTURE_DATA
        videoEl.oncanplay(new Event('canplay'));
    }
  });
};

/**
 * Attempts to decode a secret message from a video file.
 * @param videoEl The video element to play the encoded video.
 * @param canvasEl The canvas element for frame extraction.
 * @returns A promise that resolves to the decoded message, or null.
 */
export const decodeVideo = (
  videoEl: HTMLVideoElement,
  canvasEl: HTMLCanvasElement
): Promise<string | null> => {
     return new Promise((resolve) => {
        let binaryMessage = '';
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return resolve(null);

        const extractFrame = () => {
            if (videoEl.paused || videoEl.ended) {
                // End of video, try to decode whatever was found
                const terminatorPos = binaryMessage.indexOf(MESSAGE_TERMINATOR);
                if(terminatorPos !== -1) {
                    const rawMessage = binaryMessage.slice(0, terminatorPos);
                    try {
                        resolve(fromBinary(rawMessage));
                    } catch {
                        resolve(null); // Failed to parse
                    }
                } else {
                    resolve(null); // Terminator not found
                }
                return;
            }

            ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
            const frame = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
            const data = frame.data;

            for (let i = 0; i < data.length; i += 4) {
                const lsb = data[i] & 1;
                binaryMessage += lsb;
                if (binaryMessage.endsWith(MESSAGE_TERMINATOR)) {
                    const rawMessage = binaryMessage.slice(0, -MESSAGE_TERMINATOR.length);
                     try {
                        resolve(fromBinary(rawMessage));
                    } catch {
                        resolve(null);
                    }
                    videoEl.pause();
                    return;
                }
            }
            requestAnimationFrame(extractFrame);
        };

        videoEl.oncanplay = () => {
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            videoEl.play();
            extractFrame();
        };

        if (videoEl.readyState >= 3) {
            videoEl.oncanplay(new Event('canplay'));
        }
    });
};
