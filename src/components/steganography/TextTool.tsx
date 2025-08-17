import { useState } from 'react';
import toast from 'react-hot-toast';
import { encodeText, decodeText } from '../../lib/text-steganography';
import { encrypt, decrypt } from '../../lib/crypto';

const TextTool = () => {
  // Encode state
  const [encodeCoverText, setEncodeCoverText] = useState('');
  const [encodeSecretMessage, setEncodeSecretMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [encodedResult, setEncodedResult] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);

  // Decode state
  const [decodeStegoText, setDecodeStegoText] = useState('');
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedResult, setDecodedResult] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  const handleEncode = async () => {
    if (!encodeSecretMessage) {
      toast.error('Please enter a secret message to encode.');
      return;
    }
    setIsEncoding(true);
    setEncodedResult('');
    try {
      let messageToHide = encodeSecretMessage;
      // Encrypt the message if a password is provided
      if (encodePassword) {
        toast.loading('Encrypting message...');
        messageToHide = await encrypt(encodeSecretMessage, encodePassword);
        toast.dismiss();
      }

      toast.loading('Encoding message...');
      const result = encodeText(messageToHide, encodeCoverText);
      setEncodedResult(result);
      toast.dismiss();
      toast.success('Encoding successful!');
    } catch (error) {
      console.error('Encoding failed:', error);
      toast.dismiss();
      toast.error('An error occurred during encoding.');
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeStegoText) {
      toast.error('Please enter the text to decode.');
      return;
    }
    setIsDecoding(true);
    setDecodedResult('');
    try {
      toast.loading('Decoding message...');
      let hiddenMessage = decodeText(decodeStegoText);
      toast.dismiss();

      if (!hiddenMessage) {
        toast.error('No hidden message found.');
        return;
      }

      // Decrypt the message if a password is provided
      if (decodePassword) {
        toast.loading('Decrypting message...');
        const decryptedMessage = await decrypt(hiddenMessage, decodePassword);
        toast.dismiss();
        if (decryptedMessage) {
          setDecodedResult(decryptedMessage);
          toast.success('Decryption successful!');
        } else {
          toast.error('Decryption failed. Check your password.');
        }
      } else {
        // Check if the message looks like it was encrypted
        if (hiddenMessage.includes('.') && hiddenMessage.length > 50) {
            toast.error('This message seems to be encrypted. Please provide a password.');
        } else {
            setDecodedResult(hiddenMessage);
            toast.success('Decoding successful!');
        }
      }
    } catch (error) {
      console.error('Decoding failed:', error);
      toast.dismiss();
      toast.error('An error occurred during decoding.');
    } finally {
      setIsDecoding(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    if (!text) {
      toast.error('Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* ENCODE SECTION */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Encode Text</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium mb-1">Cover Text (Optional)</label>
            <textarea
              value={encodeCoverText}
              onChange={(e) => setEncodeCoverText(e.target.value)}
              placeholder="Text to hide your message in. If empty, the message is hidden in invisible characters."
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Secret Message</label>
            <textarea
              value={encodeSecretMessage}
              onChange={(e) => setEncodeSecretMessage(e.target.value)}
              placeholder="Your secret message."
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Password (Optional)</label>
            <input
              type="password"
              value={encodePassword}
              onChange={(e) => setEncodePassword(e.target.value)}
              placeholder="Encrypts your message for extra security."
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <button onClick={handleEncode} disabled={isEncoding} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-400">
            {isEncoding ? 'Encoding...' : 'Encode'}
          </button>
          {encodedResult && (
            <div className="mt-4">
              <label className="block text-lg font-medium mb-1">Result</label>
              <div className="relative">
                <textarea
                  value={encodedResult}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700"
                  rows={4}
                />
                <button onClick={() => copyToClipboard(encodedResult, 'Result')} className="absolute top-2 right-2 bg-gray-300 dark:bg-gray-600 p-1 rounded hover:bg-gray-400">
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DECODE SECTION */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Decode Text</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium mb-1">Steganographic Text</label>
            <textarea
              value={decodeStegoText}
              onChange={(e) => setDecodeStegoText(e.target.value)}
              placeholder="Paste the text containing the hidden message."
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
              rows={6}
              required
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Password (if used)</label>
            <input
              type="password"
              value={decodePassword}
              onChange={(e) => setDecodePassword(e.target.value)}
              placeholder="Enter the password if one was used."
              className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <button onClick={handleDecode} disabled={isDecoding} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-400">
            {isDecoding ? 'Decoding...' : 'Decode'}
          </button>
          {decodedResult && (
            <div className="mt-4">
              <label className="block text-lg font-medium mb-1">Decoded Message</label>
               <div className="relative">
                <textarea
                  value={decodedResult}
                  readOnly
                  className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700"
                  rows={4}
                />
                <button onClick={() => copyToClipboard(decodedResult, 'Message')} className="absolute top-2 right-2 bg-gray-300 dark:bg-gray-600 p-1 rounded hover:bg-gray-400">
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

export default TextTool;
