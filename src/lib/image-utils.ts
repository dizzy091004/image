/**
 * Resizes an image using a canvas.
 * @param image The original image element.
 * @param width The target width.
 * @param height The target height.
 * @param format The output format (e.g., 'image/jpeg', 'image/png').
 * @param quality The quality of the output image (0 to 1).
 * @returns A promise that resolves to the resized image's data URL and blob.
 */
export async function resizeImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  format: string = 'image/jpeg',
  quality: number = 0.9
): Promise<{ dataUrl: string; blob: Blob; size: number }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Use smooth scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(image, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const dataUrl = canvas.toDataURL(format, quality);
        resolve({
          dataUrl,
          blob,
          size: blob.size,
        });
      },
      format,
      quality
    );
  });
}

/**
 * Formats a byte size into a human-readable string.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
