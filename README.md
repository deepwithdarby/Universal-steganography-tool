# Universal Steganography Website

This project is a responsive, accessible web application that allows users to hide (encode) and retrieve (decode) secret messages using text, image, and audio steganography. It also includes an experimental implementation for video steganography.

The application prioritizes user privacy by performing all encoding and decoding operations client-side in the browser. It uses Firebase for Google Sign-In and features a clean, modern UI with options to preview, download, and copy data.

## Features

- **Client-Side Processing:** All steganography and encryption operations happen in your browser. Your files and secret messages are never uploaded to a server.
- **Google Sign-In:** Secure authentication and session management handled by Firebase Authentication.
- **Text Steganography:** Hide messages in text using invisible zero-width characters.
- **Image Steganography:** Hide messages in images using the Least Significant Bit (LSB) technique. The output is a lossless PNG file.
- **Audio Steganography:** Hide messages in any browser-supported audio format. The output is a large, uncompressed WAV file.
- **Video Steganography (Experimental):** An experimental feature to hide messages in video files. **Warning:** This feature is unreliable due to the nature of video compression and is included for demonstration purposes only.
- **AES-256-GCM Encryption:** All hidden messages can be optionally encrypted with a password for an added layer of security.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Authentication:** Firebase
- **Testing:** Vitest

## Getting Started

### Prerequisites

- Node.js and npm
- A Firebase project

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    - Open the file `src/firebase.ts`.
    - Replace the placeholder `firebaseConfig` object with your own Firebase project configuration. You can get this from the Firebase console.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is busy).

### Build for Production

To create a static build of the application, run:

```bash
npm run build
```
This will create a `dist` directory with the optimized production assets.

## Project Structure

-   `src/components`: Contains all React components, including the main `Header` and the steganography tools (`TextTool`, `ImageTool`, etc.).
-   `src/contexts`: Houses React contexts, such as `AuthContext` for managing user authentication state.
-   `src/lib`: Contains the core logic for cryptography (`crypto.ts`) and the various steganography methods.
-   `src/pages`: Contains the main page components for routing, such as `Home`, `About`, `Contact`, and the main `AppLayout`.
-   `src/firebase.ts`: The configuration file for Firebase services.
-   `vite.config.ts`: The configuration for the Vite build tool and Vitest.
