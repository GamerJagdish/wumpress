export type MediaType = 'video' | 'image' | 'gif';

export type AudioMode = 'standard' | 'voice' | 'mute';
export type ScaleMode = 'auto' | 'native' | '1080p' | '720p' | '480p';
export type FpsMode = 'auto' | '30' | '60';

export interface MediaMetadata {
  file: File;
  name: string;
  type: MediaType;
  originalSizeBytes: number;
  mimeType: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  previewUrl: string;
}

export interface CompressionConfig {
  targetSizeMB: number;
  safetyFactor: number; // e.g. 0.94 - 0.96 to prevent container overhead overshoot
  audioMode: AudioMode;
  scaleMode: ScaleMode;
  fpsMode: FpsMode;
  imageFormat: 'auto' | 'webp' | 'jpeg' | 'png';
  convertToMp4IfGif: boolean;
}

export type CompressionStatus =
  | 'idle'
  | 'loading-core'
  | 'analyzing'
  | 'compressing'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface CompressionProgress {
  status: CompressionStatus;
  progress: number; // 0 to 100
  currentStage: string;
  timeElapsed: number; // in seconds
  error: string | null;
  logLine?: string;
}

export interface CompressionResult {
  blob: Blob;
  downloadUrl: string;
  outputSizeBytes: number;
  originalSizeBytes: number;
  savingsPercentage: number;
  fileName: string;
  mediaType: MediaType;
  durationSeconds?: number;
}
