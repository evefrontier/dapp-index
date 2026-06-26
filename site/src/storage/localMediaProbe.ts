import type { DraftMedia } from '@/storage/draftStorage';
import type { DraftStorage } from '@/storage/draftStorage';

export type LocalMediaDescriptor = {
  content: Blob;
  media: DraftMedia;
  sha256: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSeconds?: number;
};

export async function readLocalMediaDescriptor(
  draftId: string,
  media: DraftMedia,
  storage: DraftStorage,
): Promise<LocalMediaDescriptor> {
  const content = await storage.getLocalMedia(draftId, media.id);
  if (!content) {
    throw new Error(`Local media is missing for ${media.name}.`);
  }

  const [sha256, dimensions] = await Promise.all([
    sha256BlobHex(content),
    readMediaDimensions(content, media),
  ]);

  return {
    content,
    media,
    sha256,
    sizeBytes: content.size,
    ...dimensions,
  };
}

async function readMediaDimensions(
  content: Blob,
  media: DraftMedia,
): Promise<{
  width: number;
  height: number;
  durationSeconds?: number;
}> {
  return media.kind === 'video'
    ? readVideoDimensions(content)
    : readImageDimensions(content);
}

function readImageDimensions(content: Blob): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(content);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions.'));
    };
    image.src = url;
  });
}

function readVideoDimensions(content: Blob): Promise<{
  width: number;
  height: number;
  durationSeconds: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(content);

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const durationSeconds = video.duration;
      if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        reject(new Error('Could not read video duration.'));
        return;
      }
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        durationSeconds,
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read video metadata.'));
    };
    video.src = url;
  });
}

async function sha256BlobHex(content: Blob): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', await content.arrayBuffer());
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
