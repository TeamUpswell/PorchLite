// Create this new file

/**
 * WebP support detection
 */
export async function supportsWebP(): Promise<boolean> {
  if (typeof window === 'undefined') return false; // SSR check
  
  // Check for createImageBitmap support
  if (!window.createImageBitmap) return false;
  
  // Create a WebP image
  const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  const blob = await fetch(webpData).then(r => r.blob());
  
  // Try to create an ImageBitmap from it
  try {
    return await createImageBitmap(blob) instanceof ImageBitmap;
  } catch (e) {
    return false;
  }
}

/**
 * Convert image to WebP if supported, with resize options
 */
export async function convertToWebP(
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<Blob> {
  // If it's already WebP and small enough, return as is
  if (file.type === 'image/webp' && file.size < 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      // Create canvas and convert
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to WebP if supported, else PNG
      const format = 'webp';
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        `image/${format}`,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}