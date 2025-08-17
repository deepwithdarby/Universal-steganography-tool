# Universal Steganography Website (Vanilla JS Version)

This project is a responsive, accessible web application that allows users to hide (encode) and retrieve (decode) secret messages using text, image, audio, and video steganography.

This version of the application is built entirely with plain HTML, CSS, and JavaScript, with no external build tools or frameworks required. It prioritizes user privacy by performing all encoding and decoding operations client-side in the browser. It uses Firebase for Google Sign-In.

## Features

- **Zero Dependencies:** Runs in any modern web browser without any installation or build steps.
- **Client-Side Processing:** All steganography and encryption operations happen in your browser. Your files and secret messages are never uploaded to a server.
- **Google Sign-In:** Secure authentication and session management handled by Firebase Authentication.
- **Text Steganography:** Hide messages in text using invisible zero-width characters.
- **Image Steganography:** Hide messages in images using the Least Significant Bit (LSB) technique. The output is a lossless PNG file.
- **Audio Steganography:** Hide messages in any browser-supported audio format. The output is a large, uncompressed WAV file.
- **Video Steganography (Experimental):** An experimental feature to hide messages in video files. **Warning:** This feature is unreliable due to the nature of video compression and is included for demonstration purposes only.
- **AES-256-GCM Encryption:** All hidden messages can be optionally encrypted with a password for an added layer of security.

## Tech Stack

-   **HTML5**
-   **CSS3** (Flexbox & Grid for layout)
-   **Vanilla JavaScript** (ES Modules)
-   **Firebase** (via CDN import)

## Getting Started

### Prerequisites

- A modern web browser.
- A Firebase project.

### Running the Application

1.  **Clone the repository or download the files.**
2.  **Configure Firebase:**
    - Open the file `firebase.js`.
    - Replace the placeholder `firebaseConfig` object with your own Firebase project configuration. You can get this from the Firebase console.
3.  **Open `index.html`:**
    - Simply open the `index.html` file in your web browser. Due to browser security policies around ES Modules (`import`/`export`), you may need to serve the files from a simple local server. You can do this easily with Python or a VS Code extension:

    **Using Python:**
    ```bash
    # If you have Python 3
    python -m http.server
    ```
    Then navigate to `http://localhost:8000` in your browser.

    **Using VS Code:**
    - Install the "Live Server" extension.
    - Right-click on `index.html` and choose "Open with Live Server".

## Project Structure

-   `index.html`: The main and only HTML file, containing the structure for the entire application.
-   `style.css`: Contains all CSS styles for the application.
-   `app.js`: The main JavaScript file that controls all UI interactivity, navigation, and event handling.
-   `firebase.js`: The configuration and initialization for Firebase services.
-   `lib/`: A directory containing the standalone JavaScript modules for cryptography and the various steganography methods.
