import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { BitrateCalculation, getResolutionFilter } from './calculator';
import { CompressionConfig, EncodingStats } from './types';

export type FFmpegCoreType = '@ffmpeg/core-mt' | '@ffmpeg/core';

let ffmpegInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;
let isMultiThreaded = false;
const coreListeners = new Set<() => void>();

const CORE_VERSION = '0.12.10';
const MT_BASE_URL = `https://unpkg.com/@ffmpeg/core-mt@${CORE_VERSION}/dist/umd`;
const ST_BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

export function isMultiThreadSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.crossOriginIsolated === true &&
    typeof SharedArrayBuffer !== 'undefined'
  );
}

export function getIsMultiThreaded(): boolean {
  return isMultiThreaded;
}

export function getDetectedCore(): FFmpegCoreType {
  if (typeof window === 'undefined') {
    return '@ffmpeg/core-mt';
  }
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return isMultiThreaded ? '@ffmpeg/core-mt' : '@ffmpeg/core';
  }
  return isMultiThreadSupported() ? '@ffmpeg/core-mt' : '@ffmpeg/core';
}

export function subscribeCoreChange(listener: () => void): () => void {
  coreListeners.add(listener);
  return () => {
    coreListeners.delete(listener);
  };
}

function notifyCoreChange() {
  coreListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in core listener:', e);
    }
  });
}

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

    // Attempt multi-threaded core when Cross-Origin Isolation and SharedArrayBuffer are available
    if (isMultiThreadSupported()) {
      try {
        if (onLog) onLog('[Wumpress] Initializing multi-threaded WebAssembly engine (core-mt)...');
        const coreURL = await toBlobURL(`${MT_BASE_URL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${MT_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm');
        const workerURL = await toBlobURL(`${MT_BASE_URL}/ffmpeg-core.worker.js`, 'text/javascript');

        await ffmpeg.load({
          coreURL,
          wasmURL,
          workerURL,
        });

        isMultiThreaded = true;
        ffmpegInstance = ffmpeg;
        notifyCoreChange();
        if (onLog) onLog('[Wumpress] Multi-threaded engine active (all CPU cores engaged)');
        return ffmpeg;
      } catch (mtError) {
        const errorMsg = mtError instanceof Error ? mtError.message : String(mtError);
        console.warn('Multi-threaded FFmpeg initialization failed, falling back to single-threaded:', mtError);
        if (onLog) onLog(`[Wumpress] Multi-thread init failed (${errorMsg}), switching to single-thread fallback...`);
      }
    }

    // Single-threaded fallback
    try {
      if (onLog) onLog('[Wumpress] Initializing single-threaded WebAssembly engine...');
      const coreURL = await toBlobURL(`${ST_BASE_URL}/ffmpeg-core.js`, 'text/javascript');
      const wasmURL = await toBlobURL(`${ST_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm');

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      isMultiThreaded = false;
      ffmpegInstance = ffmpeg;
      notifyCoreChange();
      if (onLog) onLog('[Wumpress] Single-threaded engine active');
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
      onProgress(-1, undefined, parsed);
    }
  };

  const ffmpeg = await getFFmpeg(onLog);
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

    if (isMultiThreaded) {
      args.push('-threads', '2');
    }

    if (config.fpsMode === '30') {
      args.push('-r', '30');
    } else if (config.fpsMode === '60') {
      args.push('-r', '60');
    } else {
      // Prevent MP4 muxer from forcing CFR at input stream's container timebase (e.g. 90k tbr),
      // which causes massive duplicate frame generation ("More than 1000 frames duplicated")
      // and encoder deadlocks on Android screen recordings and VFR videos.
      args.push('-fps_mode:v', 'vfr');
    }

    if (config.audioMode === 'mute') {
      args.push('-an');
    } else {
      args.push('-c:a', 'aac', '-b:a', `${calculation.audioBitrateKbps}k`, '-ac', '2');
    }

    args.push('-max_muxing_queue_size', '1024');
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

export async function compressGif({
  file,
  config,
  onProgress,
  onLog,
}: {
  file: File;
  config: CompressionConfig;
  onProgress: (percent: number, logLine?: string) => void;
  onLog?: (line: string) => void;
}): Promise<{ blob: Blob; fileName: string }> {
  const ffmpeg = await getFFmpeg(onLog);
  const inputFileName = `input_${Date.now()}.gif`;
  const outputFileName = `output_${Date.now()}.gif`;

  try {
    onProgress(10, 'Loading animated GIF...');
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(inputFileName, fileData);

    onProgress(30, 'Optimizing GIF palette and frames...');

    const targetBytes = config.targetSizeMB * 1024 * 1024 * config.safetyFactor;
    const ratio = file.size > 0 ? targetBytes / file.size : 1;

    let scale = 1;
    let fps = 15;
    let maxColors = 128;

    if (ratio < 0.25) {
      scale = 0.5;
      fps = 10;
      maxColors = 48;
    } else if (ratio < 0.5) {
      scale = 0.65;
      fps = 12;
      maxColors = 64;
    } else if (ratio < 0.8) {
      scale = 0.8;
      fps = 14;
      maxColors = 96;
    }

    const filter =
      scale < 1
        ? `fps=${fps},scale=trunc(iw*${scale}/2)*2:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=${maxColors}[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`
        : `fps=${fps},split[s0][s1];[s0]palettegen=max_colors=${maxColors}[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`;

    const args = ['-i', inputFileName, '-vf', filter, '-y', outputFileName];
    if (isMultiThreaded) {
      args.splice(args.length - 2, 0, '-threads', '2');
    }

    onProgress(50, 'Encoding GIF...');
    await ffmpeg.exec(args);

    onProgress(95, 'Writing GIF file...');
    const data = (await ffmpeg.readFile(outputFileName)) as Uint8Array;
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/gif' });

    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch {
      // Ignore cleanup
    }

    const cleanBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return {
      blob,
      fileName: `${cleanBaseName}_wumpressed.gif`,
    };
  } finally {
    //
  }
}
