import { normalizeExam } from "./exam";
import { embedExamImages } from "./portable";

declare global {
  interface Window {
    examImages?: { download: (url: string) => Promise<string> };
  }
}

async function imageElement(data: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const timeout = setTimeout(() => { image.src = ""; reject(new Error("Could not open the downloaded image.")); }, 15000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error("The downloaded file could not be opened as an image.")); };
    image.src = data;
  });
}

export async function downloadImage(url: string): Promise<string> {
  let data: string;
  if (window.examImages) data = await window.examImages.download(url);
  else {
    const response = await fetch(url, { credentials: "omit", signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`The image server returned HTTP ${response.status}.`);
    const blob = await response.blob();
    if (blob.size > 8 * 1024 * 1024) throw new Error("The image is too large to embed (maximum 8 MB).");
    if (!/^image\/(png|jpeg|gif|webp|avif|svg\+xml)$/.test(blob.type)) throw new Error("Use a direct link to a supported image.");
    data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
  }
  const image = await imageElement(data);
  if (/^data:image\/svg\+xml[;,]/i.test(data)) {
    const scale = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not convert this SVG image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  }
  return data;
}

export async function makeExamPortable(json: string) {
  normalizeExam(JSON.parse(json));
  const result = await embedExamImages(json, downloadImage);
  normalizeExam(JSON.parse(result.json));
  if (new Blob([result.json]).size > 20 * 1024 * 1024) throw new Error("The embedded exam exceeds 20 MB. Use smaller images and try again.");
  return result;
}
