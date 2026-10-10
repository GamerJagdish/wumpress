import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { BitrateCalculation, getResolutionFilter } from './calculator';
import { CompressionConfig } from './types';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export async function getFFmpeg(onLog?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    if (onLog) {
      ffmpeg.on('log', ({ message }) => {
        onLog(message);
      });
    }

    try {
      const coreURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm');

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (error) {
      console.error('Failed to load FFmpeg WASM core:', error);
      throw new Error(
        'Could not load WebAssembly video encoder. Please check your network connection and reload.'
      );
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export interface VideoCompressionOptions {
  file: File;
  durationSeconds: number;
  config: CompressionConfig;
  calculation: BitrateCalculation;
  onProgress: (percent: number, logLine?: string) => void;
  onLog?: (line: string) => void;
}

export async function compressVideo({
  file,
  durationSeconds,
  config,
  calculation,
  onProgress,
  onLog,
}: VideoCompressionOptions): Promise<{ blob: Blob; fileName: string }> {
  const ffmpeg = await getFFmpeg(onLog);

  const ext = file.name.split('.').pop() || 'mp4';
  const inputFileName = `input_${Date.now()}.${ext}`;
  const outputFileName = `output_${Date.now()}.mp4`;

  // Track progress via ffmpeg's native progress hook
  const progressHandler = ({ progress, time }: { progress: number; time: number }) => {
    let pct = Math.round(progress * 100);
    // If progress is 0 or negative, estimate from time / duration
    if ((pct <= 0 || pct > 100) && durationSeconds > 0 && time > 0) {
      // time is in microseconds (us)
      const currentSeconds = time / 1000000;
      pct = Math.min(99, Math.round((currentSeconds / durationSeconds) * 100));
    }
    pct = Math.max(1, Math.min(99, pct));
    onProgress(pct);
  };

  ffmpeg.on('progress', progressHandler);

  try {
    onProgress(2, 'Loading video file into memory...');
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(inputFileName, fileData);

    onProgress(5, 'Configuring Discord-compliant video stream...');

    // Build FFmpeg command arguments
    const args: string[] = ['-i', inputFileName];

    // Video filter for resolution scaling & even dimension enforcement
    const filter = getResolutionFilter(config.scaleMode, calculation.recommendedScale);
    if (filter) {
      args.push('-vf', filter);
    }

    // Video codec: libx264 with targeted bitrate and buffer bounds
    args.push(
      '-c:v',
      'libx264',
      '-b:v',
      `${calculation.videoBitrateKbps}k`,
      '-maxrate',
      `${calculation.maxRateKbps}k`,
      '-bufsize',
      `${calculation.bufSizeKbps}k`,
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p'
    );

    // Frame rate constraints if specified
    if (config.fpsMode === '30') {
      args.push('-r', '30');
    } else if (config.fpsMode === '60') {
      args.push('-r', '60');
    }

    // Audio encoding settings
    if (config.audioMode === 'mute') {
      args.push('-an');
    } else {
      args.push('-c:a', 'aac', '-b:a', `${calculation.audioBitrateKbps}k`, '-ac', '2');
    }

    // Crucial for Discord: Faststart moves moov atom to beginning of file for instant web stream preview
    args.push('-movflags', '+faststart');

    // Overwrite output
    args.push('-y', outputFileName);

    onProgress(8, 'Crunching frames with WebAssembly...');
    const exitCode = await ffmpeg.exec(args);

    if (exitCode !== 0) {
      throw new Error(`FFmpeg processing failed with exit code ${exitCode}`);
    }

    onProgress(98, 'Extracting compressed output...');
    const data = (await ffmpeg.readFile(outputFileName)) as Uint8Array;
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });

    // Clean up memory in virtual filesystem
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch {
      // Ignore cleanup error
    }

    onProgress(100, 'Video compression complete');

    const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const finalFileName = `${cleanBaseName}_compressed.mp4`;

    return {
      blob,
      fileName: finalFileName,
    };
  } finally {
    // Unhook progress listener
    ffmpeg.off('progress', progressHandler);
  }
}

export async function convertGifToMp4({
  file,
  onProgress,
  onLog,
}: {
  file: File;
  onProgress: (percent: number, logLine?: string) => void;
  onLog?: (line: string) => void;
}): Promise<{ blob: Blob; fileName: string }> {
  const ffmpeg = await getFFmpeg(onLog);
  const inputFileName = `input_${Date.now()}.gif`;
  const outputFileName = `output_${Date.now()}.mp4`;

  try {
    onProgress(10, 'Loading animated GIF...');
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(inputFileName, fileData);

    onProgress(30, 'Converting GIF frames to Discord MP4 video...');
    const args = [
      '-i',
      inputFileName,
      '-movflags',
      'faststart',
      '-pix_fmt',
      'yuv420p',
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v',
      'libx264',
      '-crf',
      '24',
      '-preset',
      'veryfast',
      '-y',
      outputFileName,
    ];

    await ffmpeg.exec(args);

    onProgress(95, 'Reading converted MP4...');
    const data = (await ffmpeg.readFile(outputFileName)) as Uint8Array;
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });

    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch {
      // Ignore cleanup
    }

    const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return {
      blob,
      fileName: `${cleanBaseName}_loop.mp4`,
    };
  } finally {
    //
  }
}
