import { AudioMode, ScaleMode } from './types';

export interface BitrateCalculation {
  totalBitrateKbps: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  targetSizeBytes: number;
  maxRateKbps: number;
  bufSizeKbps: number;
  recommendedScale: string;
}

export function getAudioBitrateKbps(mode: AudioMode): number {
  switch (mode) {
    case 'standard':
      return 128;
    case 'voice':
      return 64;
    case 'mute':
      return 0;
    default:
      return 128;
  }
}

export function calculateVideoBitrates(
  durationSec: number,
  targetMB: number,
  audioMode: AudioMode = 'standard',
  safetyFactor = 0.94
): BitrateCalculation {
  // Enforce minimum duration of 1 second for calculation stability
  const safeDuration = Math.max(1, durationSec);
  const audioBitrateKbps = getAudioBitrateKbps(audioMode);

  // Target size in bytes and kilobits with container safety padding
  const targetSizeBytes = targetMB * 1024 * 1024;
  const targetKilobits = (targetSizeBytes * 8 * safetyFactor) / 1000;

  // Total bitrate budget across video and audio
  const totalBitrateKbps = Math.floor(targetKilobits / safeDuration);

  // Video bitrate is remaining budget after audio
  let videoBitrateKbps = totalBitrateKbps - audioBitrateKbps;

  // Minimum floor so video encoder does not fail
  if (videoBitrateKbps < 64) {
    videoBitrateKbps = 64;
  }

  // Constrained VBR parameters to keep within target without buffer overflow
  const maxRateKbps = Math.floor(videoBitrateKbps * 1.2);
  const bufSizeKbps = Math.floor(videoBitrateKbps * 2.0);

  // Recommend optimal scale to preserve quality when bitrate is low
  let recommendedScale = 'native';
  if (videoBitrateKbps < 500) {
    recommendedScale = '480p';
  } else if (videoBitrateKbps < 1200) {
    recommendedScale = '720p';
  } else if (videoBitrateKbps < 3500) {
    recommendedScale = '1080p';
  }

  return {
    totalBitrateKbps,
    videoBitrateKbps,
    audioBitrateKbps,
    targetSizeBytes,
    maxRateKbps,
    bufSizeKbps,
    recommendedScale,
  };
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatBitrate(kbps: number): string {
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(2)} Mbps`;
  }
  return `${Math.round(kbps)} kbps`;
}

export function getResolutionFilter(
  scaleMode: ScaleMode,
  recommendedScale: string
): string | null {
  const effectiveMode = scaleMode === 'auto' ? recommendedScale : scaleMode;

  switch (effectiveMode) {
    case '480p':
      return 'scale=-2:480';
    case '720p':
      return 'scale=-2:720';
    case '1080p':
      return 'scale=-2:1080';
    case 'native':
    default:
      // Even dimensions required for H.264 (yuv420p)
      return 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
  }
}
