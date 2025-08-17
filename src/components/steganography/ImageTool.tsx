import { useState } from 'react';
import toast from 'react-hot-toast';
import { encodeImage, decodeImage } from '../../lib/image-steganography';
import { encrypt, decrypt } from '../../lib/crypto';

const ImageTool = () => {
  // Encode state
  const [encodeFile, setEncodeFile] = useState<File | null>(null);
  const [encodePreview, setEncodePreview] = useState<string | null>(null);
  const [encodeSecretMessage, setEncodeSecretMessage] = useState('');
  const [encodePassword, setEncodePassword] = useState('');
  const [encodedImageURL, setEncodedImageURL] = useState<string | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);

  // Decode state
  const [decodeFile, setDecodeFile] = useState<File | null>(null);
  const [decodePreview, setDecodePreview] = useState<string | null>(null);
  const [decodePassword, setDecodePassword] = useState('');
  const [decodedResult, setDecodedResult] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: Function, setPreview: Function) => {
    const file = e.target.files?.[0];
    if (file) {
      // Allow any image type that the browser can render to a canvas
      if (!file.type.startsWith('image/')) {
        toast.error('Unsupported file type. Please upload an image.');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEncode = async () => {
    if (!encodeFile || !encodeSecretMessage) {
      toast.error('Please provide an image and a secret message.');
      return;
    }
    setIsEncoding(true);
    setEncodedImageURL(null);
    const loadingToast = toast.loading('Starting encoding process...');

    try {
      let messageToHide = encodeSecretMessage;
      if (encodePassword) {
        toast.loading('Encrypting message...', { id: loadingToast });
        messageToHide = await encrypt(encodeSecretMessage, encodePassword);
      }

      const image = new Image();
      image.src = URL.createObjectURL(encodeFile);
      image.onload = async () => {
        toast.loading('Embedding message into image...', { id: loadingToast });
        const resultDataURL = await encodeImage(image, messageToHide);
        URL.revokeObjectURL(image.src); // Clean up object URL

        if (resultDataURL) {
          setEncodedImageURL(resultDataURL);
          toast.success('Image encoded successfully!', { id: loadingToast });
        } else {
          toast.error('Failed to encode image. The message might be too large for this image.', { id: loadingToast });
        }
      };
      image.onerror = () => {
        toast.error('Failed to load the image.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Encoding failed:', error);
      toast.error('An error occurred during encoding.', { id: loadingToast });
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeFile) {
      toast.error('Please upload an image to decode.');
      return;
    }
    setIsDecoding(true);
    setDecodedResult('');
    const loadingToast = toast.loading('Starting decoding process...');

    try {
      const image = new Image();
      image.src = URL.createObjectURL(decodeFile);
      image.onload = async () => {
        toast.loading('Extracting message from image...', { id: loadingToast });
        const hiddenMessage = await decodeImage(image);
        URL.revokeObjectURL(image.src);

        if (!hiddenMessage) {
          toast.error('No hidden message found in this image.', { id: loadingToast });
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
      };
      image.onerror = () => {
        toast.error('Failed to load the image.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Decoding failed:', error);
      toast.error('An error occurred during decoding.', { id: loadingToast });
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
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Encode Image</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-lg font-medium mb-1">Upload Image (PNG recommended)</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setEncodeFile, setEncodePreview)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
          </div>
          {encodePreview && <img src={encodePreview} alt="Encode Preview" className="max-w-full h-auto rounded-md shadow-inner" />}
          <div>
            <label className="block text-lg font-medium mb-1">Secret Message</label>
            <textarea value={encodeSecretMessage} onChange={(e) => setEncodeSecretMessage(e.target.value)} placeholder="Your secret message." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" rows={4} />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Password (Optional)</label>
            <input type="password" value={encodePassword} onChange={(e) => setEncodePassword(e.target.value)} placeholder="Encrypts your message." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" />
          </div>
          <button onClick={handleEncode} disabled={!encodeFile || !encodeSecretMessage || isEncoding} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-400">
            {isEncoding ? 'Encoding...' : 'Encode Image'}
          </button>
          {encodedImageURL && (
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold">Encoded Image Ready!</h3>
              <img src={encodedImageURL} alt="Encoded Result" className="max-w-full h-auto rounded-md shadow-inner my-2" />
              <a href={encodedImageURL} download={encodeFile?.name || 'encoded-image.png'} className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Download Image
              </a>
            </div>
          )}
        </div>
      </div>

      {/* DECODE SECTION */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Decode Image</h2>
        <div className="space-y-4">
           <div>
            <label className="block text-lg font-medium mb-1">Upload Encoded Image</label>
            <input type="file" accept="image/png,image/bmp" onChange={(e) => handleFileChange(e, setDecodeFile, setDecodePreview)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
          </div>
          {decodePreview && <img src={decodePreview} alt="Decode Preview" className="max-w-full h-auto rounded-md shadow-inner" />}
          <div>
            <label className="block text-lg font-medium mb-1">Password (if used)</label>
            <input type="password" value={decodePassword} onChange={(e) => setDecodePassword(e.target.value)} placeholder="Enter the password if one was used." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" />
          </div>
          <button onClick={handleDecode} disabled={!decodeFile || isDecoding} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-400">
            {isDecoding ? 'Decoding...' : 'Decode Image'}
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

export default ImageTool;
