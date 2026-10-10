import { MediaMetadata, MediaType } from './types';

export async function inspectFile(file: File): Promise<MediaMetadata> {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  let type: MediaType = 'image';
  if (mime.includes('video') || /\.(mp4|mov|webm|mkv|avi|m4v|flv|wmv)$/i.test(name)) {
    type = 'video';
  } else if (mime.includes('gif') || name.endsWith('.gif')) {
    type = 'gif';
  }

  const previewUrl = URL.createObjectURL(file);

  if (type === 'video') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanUp = () => {
        video.src = '';
      };

      video.onloadedmetadata = () => {
        const durationSeconds = video.duration || 1;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        cleanUp();
        resolve({
          file,
          name: file.name,
          type: 'video',
          originalSizeBytes: file.size,
          mimeType: file.type || 'video/mp4',
          width,
          height,
          durationSeconds,
          previewUrl,
        });
      };

      video.onerror = () => {
        cleanUp();
        // Fallback if metadata read fails
        resolve({
          file,
          name: file.name,
          type: 'video',
          originalSizeBytes: file.size,
          mimeType: file.type || 'video/mp4',
          durationSeconds: 10,
          previewUrl,
        });
      };

      video.src = previewUrl;
    });
  }

  if (type === 'image' || type === 'gif') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          file,
          name: file.name,
          type,
          originalSizeBytes: file.size,
          mimeType: file.type || 'image/png',
          width: img.naturalWidth,
          height: img.naturalHeight,
          previewUrl,
        });
      };
      img.onerror = () => {
        resolve({
          file,
          name: file.name,
          type,
          originalSizeBytes: file.size,
          mimeType: file.type || 'image/png',
          previewUrl,
        });
      };
      img.src = previewUrl;
    });
  }

  return {
    file,
    name: file.name,
    type,
    originalSizeBytes: file.size,
    mimeType: file.type,
    previewUrl,
  };
}
