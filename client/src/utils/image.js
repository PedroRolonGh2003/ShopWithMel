const MAX_IMAGE_BYTES = 800 * 1024;

export async function readImageFile(file) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Imagen muy grande (máx 800 KB). Prueba otra más pequeña.');
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

  return dataUrl;
}
