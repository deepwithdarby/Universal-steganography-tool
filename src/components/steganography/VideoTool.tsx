import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { encodeVideo, decodeVideo } from '../../lib/video-steganography';
import { encrypt, decrypt } from '../../lib/crypto';

const VideoTool = () => {
    // Encode state
    const [encodeFile, setEncodeFile] = useState<File | null>(null);
    const [encodeSecretMessage, setEncodeSecretMessage] = useState('');
    const [encodePassword, setEncodePassword] = useState('');
    const [encodedVideoURL, setEncodedVideoURL] = useState<string | null>(null);
    const [isEncoding, setIsEncoding] = useState(false);

    // Decode state
    const [decodeFile, setDecodeFile] = useState<File | null>(null);
    const [decodePassword, setDecodePassword] = useState('');
    const [decodedResult, setDecodedResult] = useState('');
    const [isDecoding, setIsDecoding] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleEncodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setEncodeFile(file);
            setEncodedVideoURL(null);
        } else {
            toast.error('Please select a valid video file.');
        }
    };

    const handleDecodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setDecodeFile(file);
            setDecodedResult('');
        } else {
            toast.error('Please select a valid video file.');
        }
    };

    const handleEncode = async () => {
        if (!encodeFile || !encodeSecretMessage || !videoRef.current || !canvasRef.current) return;

        setIsEncoding(true);
        setEncodedVideoURL(null);
        const loadingToast = toast.loading('Starting video encoding...');

        try {
            let messageToHide = encodeSecretMessage;
            if (encodePassword) {
                toast.loading('Encrypting message...', { id: loadingToast });
                messageToHide = await encrypt(encodeSecretMessage, encodePassword);
            }

            toast.loading('Processing video frames... This may take a while.', { id: loadingToast });
            videoRef.current.src = URL.createObjectURL(encodeFile);

            const resultBlob = await encodeVideo(videoRef.current, canvasRef.current, messageToHide);

            if (resultBlob) {
                const url = URL.createObjectURL(resultBlob);
                setEncodedVideoURL(url);
                toast.success('Video encoding finished!', { id: loadingToast });
            } else {
                toast.error('Failed to encode video.', { id: loadingToast });
            }

        } catch (err) {
            console.error(err);
            toast.error(`An error occurred: ${(err as Error).message}`, { id: loadingToast });
        } finally {
            setIsEncoding(false);
            if (videoRef.current) videoRef.current.src = "";
        }
    };

    const handleDecode = async () => {
        if (!decodeFile || !videoRef.current || !canvasRef.current) return;

        setIsDecoding(true);
        setDecodedResult('');
        const loadingToast = toast.loading('Starting video decoding...');

        try {
            videoRef.current.src = URL.createObjectURL(decodeFile);
            const hiddenMessage = await decodeVideo(videoRef.current, canvasRef.current);

            if (!hiddenMessage) {
                toast.error('Could not find a message. It may have been corrupted.', { id: loadingToast });
                return;
            }

            if (decodePassword) {
                toast.loading('Decrypting message...', { id: loadingToast });
                const decryptedMessage = await decrypt(hiddenMessage, decodePassword);
                if (decryptedMessage) {
                    setDecodedResult(decryptedMessage);
                    toast.success('Decryption successful!', { id: loadingToast });
                } else {
                    toast.error('Decryption failed. Check your password.', { id: loadingToast });
                }
            } else {
                setDecodedResult(hiddenMessage);
                toast.success('Message extracted! (Not decrypted)', { id: loadingToast });
            }
        } catch (err) {
            console.error(err);
            toast.error(`An error occurred: ${(err as Error).message}`, { id: loadingToast });
        } finally {
            setIsDecoding(false);
            if (videoRef.current) videoRef.current.src = "";
        }
    };

    return (
    <div>
        <p className="text-center text-lg text-amber-500 bg-amber-100 dark:bg-amber-900/50 rounded-md p-4 mb-6">
            <strong>Warning:</strong> Client-side video steganography is highly experimental and unreliable.
            The process of re-encoding the video will likely corrupt the hidden message. This feature is for demonstration purposes only.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ENCODE SECTION */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Encode Video</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-lg font-medium mb-1">Upload Video</label>
                        <input type="file" accept="video/*" onChange={handleEncodeFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
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
                        {isEncoding ? 'Encoding...' : 'Encode Video'}
                    </button>
                    {encodedVideoURL && (
                        <div className="mt-4 text-center">
                            <h3 className="text-lg font-semibold">Encoded Video Ready!</h3>
                            <video controls src={encodedVideoURL} className="w-full my-2 rounded" />
                            <a href={encodedVideoURL} download="encoded-video.webm" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                                Download WEBM File
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* DECODE SECTION */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2">Decode Video</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-lg font-medium mb-1">Upload Encoded Video</label>
                        <input type="file" accept="video/webm" onChange={handleDecodeFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/>
                    </div>
                    <div>
                        <label className="block text-lg font-medium mb-1">Password (if used)</label>
                        <input type="password" value={decodePassword} onChange={(e) => setDecodePassword(e.target.value)} placeholder="Enter the password." className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700" />
                    </div>
                    <button onClick={handleDecode} disabled={!decodeFile || isDecoding} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-400">
                        {isDecoding ? 'Decoding...' : 'Decode Video'}
                    </button>
                    {decodedResult && (
                        <div className="mt-4">
                        <label className="block text-lg font-medium mb-1">Decoded Message</label>
                        <textarea value={decodedResult} readOnly className="w-full p-2 border rounded-md bg-gray-100 dark:bg-gray-700" rows={4} />
                        </div>
                    )}
                </div>
            </div>
            {/* Hidden elements for processing */}
            <video ref={videoRef} className="hidden" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
        </div>
    </div>
  );
};

export default VideoTool;
