import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { BitrateCalculation, getResolutionFilter } from './calculator';
import { CompressionConfig, EncodingStats } from './types';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export function parseEncodingStats(logLine: string): EncodingStats | null {
  if (!logLine || !logLine.includes('time=')) return null;

  const frameMatch = logLine.match(/frame=\s*(\d+)/);
  const fpsMatch = logLine.match(/fps=\s*([\d.]+)/);
  const timeMatch = logLine.match(/time=\s*([\d:.]+)/);
  const speedMatch = logLine.match(/speed=\s*([\d.]+x)/);
  const bitrateMatch = logLine.match(/bitrate=\s*([\d.]+kbits\/s)/);

  return {
    frame: frameMatch ? parseInt(frameMatch[1], 10) : undefined,
    fps: fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : undefined,
    time: timeMatch ? timeMatch[1].split('.')[0] : undefined,
    speed: speedMatch ? speedMatch[1] : undefined,
    bitrate: bitrateMatch ? bitrateMatch[1] : undefined,
  };
}

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
      console.error('Failed to load FFmpeg:', error);
      throw new Error(
        'Could not initialize video encoder. Please check your internet connection.'
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
  onProgress: (percent: number, stage?: string, stats?: EncodingStats) => void;
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
  let currentStats: EncodingStats | undefined;

  const logHandler = ({ message }: { message: string }) => {
    if (onLog) onLog(message);
    const parsed = parseEncodingStats(message);
    if (parsed) {
      currentStats = parsed;
      let stageDesc = 'Encoding video';
      if (parsed.frame && parsed.fps) {
        stageDesc = `Frame ${parsed.frame} • ${parsed.fps} fps`;
        if (parsed.speed) stageDesc += ` • ${parsed.speed}`;
      } else if (parsed.time) {
        stageDesc = `${parsed.time} encoded`;
      }
      onProgress(-1, stageDesc, parsed);
    }
  };

  const ffmpeg = await getFFmpeg();
  ffmpeg.on('log', logHandler);

  const ext = file.name.split('.').pop() || 'mp4';
  const inputFileName = `input_${Date.now()}.${ext}`;
  const outputFileName = `output_${Date.now()}.mp4`;

  const progressHandler = ({ progress, time }: { progress: number; time: number }) => {
    let pct = Math.round(progress * 100);
    if ((pct <= 0 || pct > 100) && durationSeconds > 0 && time > 0) {
      const currentSeconds = time / 1000000;
      pct = Math.min(99, Math.round((currentSeconds / durationSeconds) * 100));
    }
    pct = Math.max(1, Math.min(99, pct));
    onProgress(pct, undefined, currentStats);
  };

  ffmpeg.on('progress', progressHandler);

  try {
    onProgress(2, 'Loading video file...');
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(inputFileName, fileData);

    onProgress(5, 'Setting up target bitrate...');

    const args: string[] = ['-i', inputFileName];

    const filter = getResolutionFilter(config.scaleMode, calculation.recommendedScale);
    if (filter) {
      args.push('-vf', filter);
    }

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

    if (config.fpsMode === '30') {
      args.push('-r', '30');
    } else if (config.fpsMode === '60') {
      args.push('-r', '60');
    }

    if (config.audioMode === 'mute') {
      args.push('-an');
    } else {
      args.push('-c:a', 'aac', '-b:a', `${calculation.audioBitrateKbps}k`, '-ac', '2');
    }

    args.push('-movflags', '+faststart');
    args.push('-y', outputFileName);

    onProgress(8, 'Encoding video...');
    const exitCode = await ffmpeg.exec(args);

    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with error code ${exitCode}`);
    }

    onProgress(98, 'Finalizing output file...');
    const data = (await ffmpeg.readFile(outputFileName)) as Uint8Array;
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });

    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch {
      // Ignore cleanup error
    }

    onProgress(100, 'Complete');

    const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return {
      blob,
      fileName: `${cleanBaseName}_wumpressed.mp4`,
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    ffmpeg.off('log', logHandler);
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

    onProgress(30, 'Converting GIF frames to MP4...');
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

    onProgress(95, 'Writing video file...');
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
      fileName: `${cleanBaseName}_wumpressed.mp4`,
    };
  } finally {
    //
  }
}
