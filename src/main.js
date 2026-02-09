import { Camera, CameraResultType } from "@capacitor/camera";
import { createWorker } from "tesseract.js";

// Elements
const scanBtn = document.getElementById("scan-btn");
const outputText = document.getElementById("output-text");
const previewImg = document.getElementById("preview-img");
const placeholderText = document.getElementById("placeholder-text");
const statusMsg = document.getElementById("status-msg");

let worker = null;

// Initialize OCR Worker (Loads specific language model)
async function initWorker() {
  statusMsg.innerText = "Initializing OCR Engine...";
  worker = await createWorker("eng");
  statusMsg.innerText = "Ready to scan";
}

// Main Scan Function
async function handleScan() {
  try {
    // 1. Capture Image
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true, // Native Android cropper
      resultType: CameraResultType.Uri,
    });

    // 2. Update UI with Image
    previewImg.src = image.webPath;
    previewImg.style.display = "block";
    placeholderText.style.display = "none";

    // 3. Start OCR
    if (!worker) await initWorker();

    statusMsg.innerText = "Extracting text... (This runs locally)";
    scanBtn.disabled = true;
    outputText.value = "Processing...";

    const {
      data: { text },
    } = await worker.recognize(image.webPath);

    // 4. Final Result
    outputText.value = text;
    statusMsg.innerText = "Done!";
  } catch (error) {
    console.error("Scan failed", error);
    statusMsg.innerText = "Error: " + error.message;
  } finally {
    scanBtn.disabled = false;
  }
}

// Bind Button
scanBtn.addEventListener("click", handleScan);

// Pre-load worker on app start for speed
initWorker();
