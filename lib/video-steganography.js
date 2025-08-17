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

export const encodeVideo = (videoEl, canvasEl, secretMessage) => {
  return new Promise((resolve, reject) => {
    const binaryMessage = toBinary(secretMessage) + MESSAGE_TERMINATOR;
    let bitIndex = 0;

    const stream = canvasEl.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = reject;

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
              data[i] = (data[i] & 0xFE) | bit;
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

    if (videoEl.readyState >= 3) {
        videoEl.oncanplay(new Event('canplay'));
    }
  });
};

export const decodeVideo = (videoEl, canvasEl) => {
     return new Promise((resolve) => {
        let binaryMessage = '';
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return resolve(null);

        const extractFrame = () => {
            if (videoEl.paused || videoEl.ended) {
                const terminatorPos = binaryMessage.indexOf(MESSAGE_TERMINATOR);
                if(terminatorPos !== -1) {
                    const rawMessage = binaryMessage.slice(0, terminatorPos);
                    try { resolve(fromBinary(rawMessage)); } catch { resolve(null); }
                } else {
                    resolve(null);
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
                     try { resolve(fromBinary(rawMessage)); } catch { resolve(null); }
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
