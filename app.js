import { auth, provider, signInWithPopup, onAuthStateChanged, signOut } from './firebase.js';
import { encrypt, decrypt } from './lib/crypto.js';
import { encodeText, decodeText } from './lib/text-steganography.js';
import { encodeImage, decodeImage } from './lib/image-steganography.js';
import { encodeAudio, decodeAudio } from './lib/audio-steganography.js';
import { encodeVideo, decodeVideo } from './lib/video-steganography.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('header nav a.logo, header nav a[href="#about"], header nav a[href="#contact"]');
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    const authButton = document.getElementById('auth-button');
    const getStartedButton = document.getElementById('get-started-button');

    let currentUser = null;

    // --- Page & Tab Navigation ---
    const showPage = (pageId) => {
        if (!pageId) pageId = 'home';
        if (pageId === 'app' && !currentUser) pageId = 'home';
        pages.forEach(page => page.classList.toggle('active', page.id === pageId));
        window.location.hash = pageId;
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        });
    });

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');
            tabLinks.forEach(innerLink => innerLink.classList.remove('active'));
            link.classList.add('active');
            tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabId}-tool`));
        });
    });

    // --- Authentication ---
    authButton.addEventListener('click', () => {
        if (currentUser) signOut(auth); else signInWithPopup(auth, provider);
    });

    getStartedButton.addEventListener('click', () => {
        if (currentUser) showPage('app'); else signInWithPopup(auth, provider);
    });

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authButton.textContent = user ? 'Sign Out' : 'Sign In with Google';
        if (user && (window.location.hash === '#home' || !window.location.hash)) showPage('app');
        if (!user && window.location.hash === '#app') showPage('home');
    });

    // --- Text Steganography Tool ---
    const textEncodeCover = document.getElementById('text-encode-cover');
    const textEncodeSecret = document.getElementById('text-encode-secret');
    const textEncodePassword = document.getElementById('text-encode-password');
    const textEncodeButton = document.getElementById('text-encode-button');
    const textEncodeResult = document.getElementById('text-encode-result');

    const textDecodeStego = document.getElementById('text-decode-stego');
    const textDecodePassword = document.getElementById('text-decode-password');
    const textDecodeButton = document.getElementById('text-decode-button');
    const textDecodeResult = document.getElementById('text-decode-result');

    textEncodeButton.addEventListener('click', async () => {
        if (!textEncodeSecret.value) {
            alert('Please enter a secret message.');
            return;
        }
        try {
            let messageToHide = textEncodeSecret.value;
            if (textEncodePassword.value) {
                messageToHide = await encrypt(messageToHide, textEncodePassword.value);
            }
            const result = encodeText(messageToHide, textEncodeCover.value);
            textEncodeResult.value = result;
            alert('Encoding successful!');
        } catch (e) {
            alert('Encoding failed: ' + e.message);
        }
    });

    textDecodeButton.addEventListener('click', async () => {
        if (!textDecodeStego.value) {
            alert('Please enter text to decode.');
            return;
        }
        try {
            let hiddenMessage = decodeText(textDecodeStego.value);
            if (!hiddenMessage && hiddenMessage !== '') {
                alert('No hidden message found.');
                return;
            }
            if (textDecodePassword.value) {
                const decrypted = await decrypt(hiddenMessage, textDecodePassword.value);
                if (decrypted === null) {
                    alert('Decryption failed. Check your password.');
                    return;
                }
                hiddenMessage = decrypted;
            }
            textDecodeResult.value = hiddenMessage;
        } catch(e) {
            alert('Decoding failed: ' + e.message);
        }
    });

    // --- Image Steganography Tool ---
    const imageEncodeInput = document.getElementById('image-encode-input');
    const imageEncodePreview = document.getElementById('image-encode-preview');
    const imageEncodeSecret = document.getElementById('image-encode-secret');
    const imageEncodePassword = document.getElementById('image-encode-password');
    const imageEncodeButton = document.getElementById('image-encode-button');
    const imageDownloadLink = document.getElementById('image-download-link');

    const imageDecodeInput = document.getElementById('image-decode-input');
    const imageDecodePreview = document.getElementById('image-decode-preview');
    const imageDecodePassword = document.getElementById('image-decode-password');
    const imageDecodeButton = document.getElementById('image-decode-button');
    const imageDecodeResult = document.getElementById('image-decode-result');

    imageEncodeInput.addEventListener('change', () => {
        if (imageEncodeInput.files && imageEncodeInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => imageEncodePreview.src = e.target.result;
            reader.readAsDataURL(imageEncodeInput.files[0]);
        }
    });

    imageDecodeInput.addEventListener('change', () => {
        if (imageDecodeInput.files && imageDecodeInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => imageDecodePreview.src = e.target.result;
            reader.readAsDataURL(imageDecodeInput.files[0]);
        }
    });

    imageEncodeButton.addEventListener('click', async () => {
        if (!imageEncodeInput.files[0] || !imageEncodeSecret.value) {
            alert('Please provide an image and a secret message.');
            return;
        }
        try {
            let messageToHide = imageEncodeSecret.value;
            if (imageEncodePassword.value) {
                messageToHide = await encrypt(messageToHide, imageEncodePassword.value);
            }
            const image = new Image();
            image.src = URL.createObjectURL(imageEncodeInput.files[0]);
            image.onload = async () => {
                const resultBlob = await encodeImage(image, messageToHide);
                if (resultBlob) {
                    const url = URL.createObjectURL(resultBlob);
                    imageDownloadLink.href = url;
                    imageDownloadLink.download = 'encoded-image.png';
                    imageDownloadLink.style.display = 'inline-block';
                    alert('Image encoded successfully!');
                } else {
                    alert('Encoding failed. Message may be too large for the image.');
                }
                URL.revokeObjectURL(image.src);
            };
        } catch (e) {
            alert('Encoding failed: ' + e.message);
        }
    });

    imageDecodeButton.addEventListener('click', async () => {
        if (!imageDecodeInput.files[0]) {
            alert('Please upload an image to decode.');
            return;
        }
        try {
            const image = new Image();
            image.src = URL.createObjectURL(imageDecodeInput.files[0]);
            image.onload = async () => {
                let hiddenMessage = await decodeImage(image);
                if (!hiddenMessage && hiddenMessage !== '') {
                    alert('No hidden message found.');
                    return;
                }
                if (imageDecodePassword.value) {
                     const decrypted = await decrypt(hiddenMessage, imageDecodePassword.value);
                    if (decrypted === null) {
                        alert('Decryption failed. Check your password.');
                        return;
                    }
                    hiddenMessage = decrypted;
                }
                imageDecodeResult.value = hiddenMessage;
                URL.revokeObjectURL(image.src);
            };
        } catch(e) {
            alert('Decoding failed: ' + e.message);
        }
    });


    // --- Audio Steganography Tool ---
    const audioEncodeInput = document.getElementById('audio-encode-input');
    const audioEncodeSecret = document.getElementById('audio-encode-secret');
    const audioEncodePassword = document.getElementById('audio-encode-password');
    const audioEncodeButton = document.getElementById('audio-encode-button');
    const audioDownloadLink = document.getElementById('audio-download-link');

    audioEncodeButton.addEventListener('click', async () => {
        if (!audioEncodeInput.files[0] || !audioEncodeSecret.value) {
            alert('Please provide an audio file and a secret message.');
            return;
        }
        try {
            let messageToHide = audioEncodeSecret.value;
            if (audioEncodePassword.value) {
                messageToHide = await encrypt(messageToHide, audioEncodePassword.value);
            }
            const arrayBuffer = await audioEncodeInput.files[0].arrayBuffer();
            const resultBlob = await encodeAudio(arrayBuffer, messageToHide);
            if (resultBlob) {
                const url = URL.createObjectURL(resultBlob);
                audioDownloadLink.href = url;
                audioDownloadLink.download = 'encoded-audio.wav';
                audioDownloadLink.style.display = 'inline-block';
                alert('Audio encoded successfully!');
            } else {
                alert('Encoding failed. Message may be too large.');
            }
        } catch (e) {
            alert('Encoding failed: ' + e.message);
        }
    });

    const audioDecodeInput = document.getElementById('audio-decode-input');
    const audioDecodePassword = document.getElementById('audio-decode-password');
    const audioDecodeButton = document.getElementById('audio-decode-button');
    const audioDecodeResult = document.getElementById('audio-decode-result');

    audioDecodeButton.addEventListener('click', async () => {
        if (!audioDecodeInput.files[0]) {
            alert('Please upload an audio file to decode.');
            return;
        }
        try {
            const arrayBuffer = await audioDecodeInput.files[0].arrayBuffer();
            let hiddenMessage = await decodeAudio(arrayBuffer);
            if (!hiddenMessage && hiddenMessage !== '') {
                alert('No hidden message found.');
                return;
            }
            if (audioDecodePassword.value) {
                const decrypted = await decrypt(hiddenMessage, audioDecodePassword.value);
                if (decrypted === null) {
                    alert('Decryption failed. Check password.');
                    return;
                }
                hiddenMessage = decrypted;
            }
            audioDecodeResult.value = hiddenMessage;
        } catch (e) {
            alert('Decoding failed: ' + e.message);
        }
    });

    // --- Video Steganography Tool ---
    const videoEncodeInput = document.getElementById('video-encode-input');
    const videoEncodeSecret = document.getElementById('video-encode-secret');
    const videoEncodePassword = document.getElementById('video-encode-password');
    const videoEncodeButton = document.getElementById('video-encode-button');
    const videoDownloadLink = document.getElementById('video-download-link');
    const videoPlayer = document.getElementById('video-player');
    const videoCanvas = document.getElementById('video-canvas');

    videoEncodeButton.addEventListener('click', async () => {
        if (!videoEncodeInput.files[0] || !videoEncodeSecret.value) {
            alert('Please provide a video file and a secret message.');
            return;
        }
        try {
            let messageToHide = videoEncodeSecret.value;
            if (videoEncodePassword.value) {
                messageToHide = await encrypt(messageToHide, videoEncodePassword.value);
            }
            videoPlayer.src = URL.createObjectURL(videoEncodeInput.files[0]);
            const resultBlob = await encodeVideo(videoPlayer, videoCanvas, messageToHide);
             if (resultBlob) {
                const url = URL.createObjectURL(resultBlob);
                videoDownloadLink.href = url;
                videoDownloadLink.download = 'encoded-video.webm';
                videoDownloadLink.style.display = 'inline-block';
                alert('Video encoding finished. Note: This is experimental and may not decode correctly.');
            } else {
                alert('Encoding failed.');
            }
        } catch (e) {
            alert('Encoding failed: ' + e.message);
        }
    });

    const videoDecodeInput = document.getElementById('video-decode-input');
    const videoDecodePassword = document.getElementById('video-decode-password');
    const videoDecodeButton = document.getElementById('video-decode-button');
    const videoDecodeResult = document.getElementById('video-decode-result');

    videoDecodeButton.addEventListener('click', async () => {
        if (!videoDecodeInput.files[0]) {
            alert('Please upload a video to decode.');
            return;
        }
        try {
            videoPlayer.src = URL.createObjectURL(videoDecodeInput.files[0]);
            let hiddenMessage = await decodeVideo(videoPlayer, videoCanvas);
            if (!hiddenMessage && hiddenMessage !== '') {
                alert('No hidden message found or it was corrupted.');
                return;
            }
            if (videoDecodePassword.value) {
                const decrypted = await decrypt(hiddenMessage, videoDecodePassword.value);
                if (decrypted === null) {
                    alert('Decryption failed. Check password.');
                    return;
                }
                hiddenMessage = decrypted;
            }
            videoDecodeResult.value = hiddenMessage;
        } catch (e) {
            alert('Decoding failed: ' + e.message);
        }
    });


    // --- Initial State ---
    const initialPage = window.location.hash ? window.location.hash.substring(1) : 'home';
    showPage(initialPage);
    document.querySelector('.tab-link')?.classList.add('active');
    document.querySelector('.tab-content')?.classList.add('active');
});
