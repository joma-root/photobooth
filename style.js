const video = document.getElementById('video');
const captureButton = document.getElementById('capture');
const canvas = document.getElementById('canvas');
const framesContainer = document.getElementById('framesContainer');
const downloadButton = document.getElementById('downloadAll');
const landscapePrompt = document.getElementById('landscapePrompt');
let photoCount = 0;

// Check device orientation
function checkOrientation() {
    if (window.innerHeight > window.innerWidth) {
        // Portrait mode
        landscapePrompt.style.display = 'flex';
    } else {
        // Landscape mode
        landscapePrompt.style.display = 'none';
    }
}

// Listen for orientation changes
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);

// Initial check
checkOrientation();

// Camera access
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.play(); // Ensure the video starts playing
    } catch (err) {
        console.error(`Error accessing camera: ${err}`);
        alert("Camera access failed. Please check your browser permissions or try again.");
    }
}

// Initialize the camera
setupCamera();

// Capture photo with countdown
captureButton.addEventListener('click', () => {
    if (photoCount >= 4) return; // Allow only 4 photos

    // Countdown timer
    let countdown = 3;
    captureButton.disabled = true;
    captureButton.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown--;
        captureButton.textContent = countdown || '📸'; // Show camera emoji at 0
        if (countdown === 0) {
            clearInterval(countdownInterval);
            captureButton.textContent = 'Take Photo';
            captureButton.disabled = false;

            // Trigger flash animation
            const flashOverlay = document.createElement('div');
            flashOverlay.className = 'flash-overlay';
            video.parentElement.appendChild(flashOverlay);

            // Remove the flash overlay after the animation ends
            setTimeout(() => {
                flashOverlay.remove();
            }, 300); // Matches the duration of the flash animation

            // Capture photo
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Flip the canvas horizontally to match the video feed
            context.translate(canvas.width, 0); // Move the origin to the right edge
            context.scale(-1, 1); // Flip horizontally
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Reset the canvas transformation for further use
            context.setTransform(1, 0, 0, 1, 0, 0);

            // Create frame
            const frame = document.createElement('div');
            frame.className = 'photo-frame';

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            frame.appendChild(img);

            // Add date only to the last photo
            if (photoCount === 3) {
                const dateDiv = document.createElement('div');
                dateDiv.className = 'date';
                dateDiv.textContent = new Date().toLocaleDateString(); // Current date
                frame.appendChild(dateDiv);
            }

            framesContainer.appendChild(frame);
            photoCount++;

            // Show download button after 4 photos
            if (photoCount === 4) {
                downloadButton.style.display = 'block';
            }
        }
    }, 1000);
});

// Download functionality
downloadButton.addEventListener('click', () => {
    // Create temporary canvas
    const downloadCanvas = document.createElement('canvas');
    const ctx = downloadCanvas.getContext('2d');

    // Set canvas dimensions
    downloadCanvas.width = 400; // Width of the strip
    downloadCanvas.height = 1200; // Height of the strip
    ctx.fillStyle = '#FFFFFF'; // White background
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw all frames
    const frames = document.querySelectorAll('.photo-frame');
    const frameWidth = 380; // Width of each frame
    const frameHeight = 280; // Height of each frame
    const gap = 20; // Gap between frames

    frames.forEach((frame, index) => {
        const img = new Image();
        img.src = frame.querySelector('img').src;
        img.onload = () => {
            const y = index * (frameHeight + gap) + gap; // Y position

            // Draw image
            ctx.drawImage(img, 10, y, frameWidth, frameHeight - 50);

            // Draw date text centered below the image
            if (index === frames.length - 1) {
                const dateText = frame.querySelector('.date').textContent;
                ctx.font = 'italic bold 20px Arial'; // Aesthetic font styling
                ctx.fillStyle = 'black'; // Black color for the date
                ctx.textAlign = 'center'; // Center the text
                ctx.fillText(dateText, downloadCanvas.width / 2, y + frameHeight - 20);
            }

            // Trigger download when last image is drawn
            if (index === frames.length - 1) {
                const link = document.createElement('a');
                link.download = '4cut-photo-strip.png';
                link.href = downloadCanvas.toDataURL();
                link.click();
            }
        };
    });
});