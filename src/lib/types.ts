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
  safetyFactor: number;
  audioMode: AudioMode;
  scaleMode: ScaleMode;
  fpsMode: FpsMode;
  imageFormat: 'auto' | 'webp' | 'jpeg' | 'png';
}

export type CompressionStatus =
  | 'idle'
  | 'loading-core'
  | 'analyzing'
  | 'compressing'
  | 'finalizing'
  | 'completed'
  | 'error';

export interface EncodingStats {
  frame?: number;
  fps?: number;
  time?: string;
  speed?: string;
  bitrate?: string;
}

export interface CompressionProgress {
  status: CompressionStatus;
  progress: number;
  currentStage: string;
  timeElapsed: number;
  error: string | null;
  stats?: EncodingStats;
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
  timeElapsed?: number;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  originalSizeBytes: number;
  outputSizeBytes: number;
  savingsPercentage: number;
  mediaType: MediaType;
  durationSeconds?: number;
  timeElapsed?: number;
  timestamp: number;
  blob: Blob;
}

export interface QueuedCompression {
  id: string;
  metadata: MediaMetadata;
  config: CompressionConfig;
}

