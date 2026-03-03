import { Camera, CameraResultType } from "@capacitor/camera";
import { createWorker } from "tesseract.js";

// Elements
const scanBtn = document.getElementById("scan-btn");
const outputText = document.getElementById("output-text");
const previewImg = document.getElementById("preview-img");
const placeholderText = document.getElementById("placeholder-text");
const statusMsg = document.getElementById("status-msg");
const copyBtn = document.getElementById("copy-btn");
const clearBtn = document.getElementById("clear-btn");
const loadingIndicator = document.getElementById("loading-indicator");

let worker = null;

// Helper: Show/Hide Loading
function setLoading(isLoading, message = "Processing...") {
  if (isLoading) {
    loadingIndicator.classList.remove("hidden");
    loadingIndicator.querySelector("p").innerText = message;
    scanBtn.disabled = true;
  } else {
    loadingIndicator.classList.add("hidden");
    scanBtn.disabled = false;
  }
}

// Helper: Toast Notification
function showToast(message, duration = 3000) {
  statusMsg.innerText = message;
  setTimeout(() => {
    if (statusMsg.innerText === message) {
      statusMsg.innerText = "Ready to scan";
    }
  }, duration);
}

// Initialize OCR Worker
async function initWorker() {
  if (!worker) {
    setLoading(true, "Initializing OCR Engine...");
    try {
      worker = await createWorker("eng");
      setLoading(false);
      showToast("OCR Engine Ready");
    } catch (err) {
      console.error("Worker Init Failed", err);
      setLoading(false);
      showToast("Error initializing OCR");
    }
  }
}

// Pre-load worker on app start
initWorker();

// Main Scan Function
async function handleScan() {
  try {
    // 1. Capture Image
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true, // Native Android cropper
      resultType: CameraResultType.Uri,
      source: "CAMERA", // Force camera, not photos
    });

    if (!image.webPath) return;

    // 2. Update UI with Image
    previewImg.src = image.webPath;
    previewImg.style.display = "block";
    placeholderText.style.display = "none";

    // 3. Start OCR
    if (!worker) await initWorker();

    setLoading(true, "Extracting text...");
    outputText.value = ""; // Clear previous

    const {
      data: { text },
    } = await worker.recognize(image.webPath);

    // 4. Final Result
    outputText.value = text;
    setLoading(false);
    showToast("Extraction Complete!");
  } catch (error) {
    console.error("Scan failed", error);
    setLoading(false);
    showToast(error.message || "Scan canceled or failed");
  }
}

// UI Actions
scanBtn.addEventListener("click", handleScan);

copyBtn.addEventListener("click", async () => {
  if (!outputText.value) return;
  try {
    await navigator.clipboard.writeText(outputText.value);
    showToast("Text copied to clipboard!");
  } catch (err) {
    showToast("Failed to copy");
  }
});

clearBtn.addEventListener("click", () => {
  outputText.value = "";
  previewImg.src = "";
  previewImg.style.display = "none";
  placeholderText.style.display = "block";
  showToast("Cleared");
});
