import { useState } from 'react';
import toast from 'react-hot-toast';
import { encodeAudio, decodeAudio } from '../../lib/audio-steganography';
import { encrypt, decrypt } from '../../lib/crypto';

const AudioTool = () => {
  // Encode state
  const [encodeFile, setEncodeFile] = useState<File | null>(null);
  const [encodeSecretMessage, setEncodeSecretMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [encodedAudioURL, setEncodedAudioURL] = useState<string | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);

  // Decode state
  const [decodeFile, setDecodeFile] = useState<File | null>(null);
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedResult, setDecodedResult] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: Function) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload a valid audio file.');
        e.target.value = '';
        return;
      }
      setFile(file);
    }
  };

  const handleEncode = async () => {
    if (!encodeFile || !encodeSecretMessage) {
      toast.error('Please provide an audio file and a secret message.');
      return;
    }
    setIsEncoding(true);
    setEncodedAudioURL(null);
    const loadingToast = toast.loading('Starting encoding process...');

    try {
      let messageToHide = encodeSecretMessage;
      if (encodePassword) {
        toast.loading('Encrypting message...', { id: loadingToast });
        messageToHide = await encrypt(encodeSecretMessage, encodePassword);
      }

      const arrayBuffer = await encodeFile.arrayBuffer();
      toast.loading('Embedding message into audio...', { id: loadingToast });
      const resultBlob = await encodeAudio(arrayBuffer, messageToHide);

      if (resultBlob) {
        const url = URL.createObjectURL(resultBlob);
        setEncodedAudioURL(url);
        toast.success('Audio encoded successfully!', { id: loadingToast });
      } else {
        toast.error('Failed to encode audio. The message might be too large.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Encoding failed:', error);
      toast.error(`An error occurred: ${(error as Error).message}`, { id: loadingToast });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeFile) {
      toast.error('Please upload an audio file to decode.');
      return;
    }
    setIsDecoding(true);
    setDecodedResult('');
    const loadingToast = toast.loading('Starting decoding process...');

    try {
      const arrayBuffer = await decodeFile.arrayBuffer();
      toast.loading('Extracting message from audio...', { id: loadingToast });
      const hiddenMessage = await decodeAudio(arrayBuffer);

      if (!hiddenMessage) {
        toast.error('No hidden message found in this audio file.', { id: loadingToast });
        return;
      }

      if (decodePassword) {
        toast.loading('Decrypting message...', { id: loadingToast });
        const decryptedMessage = await decrypt(hiddenMessage, decodePassword);
        if (decryptedMessage) {
          setDecodedResult(decryptedMessage);
          toast.success('Message decrypted successfully!', { id: loadingToast });
        } else {
          toast.error('Decryption failed. Check your password.', { id: loadingToast });
        }
      } else {
        if (hiddenMessage.includes('.') && hiddenMessage.length > 50) {
          toast.error('This message seems to be encrypted. Please provide a password.', { id: loadingToast });
        } else {
          setDecodedResult(hiddenMessage);
          toast.success('Message decoded successfully!', { id: loadingToast });
        }
      }
    } catch (error) {
      console.error('Decoding failed:', error);
      toast.error(`An error occurred: ${(error as Error).message}`, { id: loadingToast });
    } finally {
      setIsDecoding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Decoded message copied to clipboard!');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* ENCODE SECTION */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Encode Audio</h2>
        <p className="text-sm text-gray-500 mb-4">Note: The output will be an uncompressed WAV file, which may be large.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium mb-1">Upload Audio</label>
            <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, setEncodeFile)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            {encodeFile && <p className="text-sm mt-2">Selected: {encodeFile.name}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Secret Message</label>
            <textarea value={encodeSecretMessage} onChange={(e) => setEncodeSecretMessage(e.target.value)} placeholder="Your secret message." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" rows={4} />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Password (Optional)</label>
            <input type="password" value={encodePassword} onChange={(e) => setEncodePassword(e.target.value)} placeholder="Encrypts your message." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" />
          </div>
          <button onClick={handleEncode} disabled={!encodeFile || !encodeSecretMessage || isEncoding} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-400">
            {isEncoding ? 'Encoding...' : 'Encode Audio'}
          </button>
          {encodedAudioURL && (
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold">Encoded Audio Ready!</h3>
              <audio controls src={encodedAudioURL} className="w-full my-2" />
              <a href={encodedAudioURL} download="encoded-audio.wav" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Download WAV File
              </a>
            </div>
          )}
        </div>
      </div>

      {/* DECODE SECTION */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Decode Audio</h2>
        <div className="space-y-4">
           <div>
            <label className="block text-lg font-medium mb-1">Upload Encoded WAV File</label>
            <input type="file" accept="audio/wav,audio/wave" onChange={(e) => handleFileChange(e, setDecodeFile)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
            {decodeFile && <p className="text-sm mt-2">Selected: {decodeFile.name}</p>}
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Password (if used)</label>
            <input type="password" value={decodePassword} onChange={(e) => setDecodePassword(e.target.value)} placeholder="Enter the password if one was used." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" />
          </div>
          <button onClick={handleDecode} disabled={!decodeFile || isDecoding} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-400">
            {isDecoding ? 'Decoding...' : 'Decode Audio'}
          </button>
          {decodedResult && (
            <div className="mt-4">
              <label className="block text-lg font-medium mb-1">Decoded Message</label>
               <div className="relative">
                <textarea value={decodedResult} readOnly className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700" rows={4} />
                <button onClick={() => copyToClipboard(decodedResult)} className="absolute top-2 right-2 bg-gray-300 dark:bg-gray-600 p-1 rounded hover:bg-gray-400">
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioTool;
