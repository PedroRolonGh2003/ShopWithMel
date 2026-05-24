const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_DIMENSION = 1200;

function isImageFile(file) {
  if (file.type?.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || '');
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

function resizeToCanvas(img) {
  let { width, height } = img;
  const max = MAX_DIMENSION;

  if (width > max || height > max) {
    if (width >= height) {
      height = Math.round((height * max) / width);
      width = max;
    } else {
      width = Math.round((width * max) / height);
      height = max;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo procesar la imagen'));
    reader.readAsDataURL(blob);
  });
}

async function compressImage(file) {
  const img = await loadImage(file);
  const canvas = resizeToCanvas(img);

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);

  while (blob && blob.size > MAX_OUTPUT_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob) {
    throw new Error('No se pudo comprimir la imagen');
  }

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error('La imagen sigue siendo muy grande. Intenta con menos zoom o más luz.');
  }

  return blobToDataUrl(blob);
}

export async function readImageFile(file) {
  if (!file) return null;

  if (!isImageFile(file)) {
    throw new Error('Solo se permiten archivos de imagen');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Archivo demasiado grande (máx 20 MB)');
  }

  return compressImage(file);
}
