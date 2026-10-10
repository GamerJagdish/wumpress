'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileVideo,
  FileImage,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

import Header from '@/components/Header';
import Dropzone from '@/components/Dropzone';
import TargetSelector from '@/components/TargetSelector';
import AdvancedSettings from '@/components/AdvancedSettings';
import ProgressCard from '@/components/ProgressCard';
import ResultCard from '@/components/ResultCard';

import { inspectFile } from '@/lib/media-inspector';
import { calculateVideoBitrates, formatBytes, formatDuration } from '@/lib/calculator';
import { compressVideo, compressGif } from '@/lib/ffmpeg';
import { compressImage } from '@/lib/image-compressor';
import {
  MediaMetadata,
  CompressionConfig,
  CompressionProgress,
  CompressionResult,
} from '@/lib/types';

const DEFAULT_CONFIG: CompressionConfig = {
  targetSizeMB: 20,
  safetyFactor: 0.94,
  audioMode: 'standard',
  scaleMode: 'auto',
  fpsMode: 'auto',
  imageFormat: 'auto',
};

export default function HomePage() {
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [config, setConfig] = useState<CompressionConfig>(DEFAULT_CONFIG);
  const [progress, setProgress] = useState<CompressionProgress>({
    status: 'idle',
    progress: 0,
    currentStage: '',
    timeElapsed: 0,
    error: null,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<CompressionResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    try {
      setResult(null);
      setLogs([]);
      setProgress({
        status: 'idle',
        progress: 0,
        currentStage: '',
        timeElapsed: 0,
        error: null,
      });

      const meta = await inspectFile(file);
      setMetadata(meta);
    } catch (err: unknown) {
      console.error(err);
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        error: 'Failed to inspect media file. Please try another file.',
      }));
    }
  };

  const handleConfigChange = (updated: Partial<CompressionConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  const calculation = calculateVideoBitrates(
    metadata?.durationSeconds || 10,
    config.targetSizeMB,
    config.audioMode,
    config.safetyFactor
  );

  const startCompression = async () => {
    if (!metadata) return;

    setProgress({
      status: 'compressing',
      progress: 2,
      currentStage: 'Preparing...',
      timeElapsed: 0,
      error: null,
    });
    setLogs([]);

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((prev) => ({
        ...prev,
        timeElapsed: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    try {
      let outputBlob: Blob = metadata.file;
      let finalFileName: string = metadata.name;

      if (metadata.type === 'video') {
        const res = await compressVideo({
          file: metadata.file,
          durationSeconds: metadata.durationSeconds || 10,
          config,
          calculation,
          onProgress: (pct, stage, stats) => {
            setProgress((prev) => ({
              ...prev,
              progress: pct >= 0 ? pct : prev.progress,
              currentStage: stage || prev.currentStage,
              stats: stats || prev.stats,
            }));
          },
          onLog: (line) => {
            setLogs((prev) => [...prev.slice(-100), line]);
          },
        });
        outputBlob = res.blob;
      } else if (metadata.type === 'gif') {
        const res = await compressGif({
          file: metadata.file,
          config,
          onProgress: (pct, stage) => {
            setProgress((prev) => ({
              ...prev,
              progress: pct >= 0 ? pct : prev.progress,
              currentStage: stage || prev.currentStage,
            }));
          },
          onLog: (line) => {
            setLogs((prev) => [...prev.slice(-100), line]);
          },
        });
        outputBlob = res.blob;
        finalFileName = res.fileName;
      } else {
        const res = await compressImage({
          file: metadata.file,
          config,
          onProgress: (pct, stage) => {
            setProgress((prev) => ({
              ...prev,
              progress: pct,
              currentStage: stage || prev.currentStage,
            }));
          },
        });
        outputBlob = res.blob;
        finalFileName = res.fileName;
      }

      if (timerRef.current) clearInterval(timerRef.current);

      const downloadUrl = URL.createObjectURL(outputBlob);
      const savingsPercentage = Math.max(
        0,
        Math.round(
          ((metadata.originalSizeBytes - outputBlob.size) / metadata.originalSizeBytes) * 100
        )
      );

      setResult({
        blob: outputBlob,
        downloadUrl,
        outputSizeBytes: outputBlob.size,
        originalSizeBytes: metadata.originalSizeBytes,
        savingsPercentage,
        fileName: finalFileName,
        mediaType: finalFileName.endsWith('.mp4') ? 'video' : metadata.type,
      });

      setProgress({
        status: 'completed',
        progress: 100,
        currentStage: 'Done',
        timeElapsed: Math.floor((Date.now() - startTime) / 1000),
        error: null,
      });
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current);
      console.error('Compression failed:', err);
      const message =
        err instanceof Error ? err.message : 'Compression failed due to an unexpected error.';
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  };

  const handleReset = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    if (metadata?.previewUrl) {
      URL.revokeObjectURL(metadata.previewUrl);
    }
    setMetadata(null);
    setResult(null);
    setLogs([]);
    setProgress({
      status: 'idle',
      progress: 0,
      currentStage: '',
      timeElapsed: 0,
      error: null,
    });
  };

  const isCompressing = progress.status === 'compressing';

  return (
    <div className="min-h-screen flex flex-col bg-[#1e1f22] text-[#f2f3f5]">
      <Header />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center">
        {/* Error Alert */}
        <AnimatePresence>
          {progress.status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 rounded-xl bg-[#392125] border border-[#5c2d33] text-[#f23f43] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{progress.error || 'Failed to compress media.'}</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded bg-[#4e272d] hover:bg-[#5c2d33] text-white font-bold transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="space-y-4">
          {/* Result View */}
          {result ? (
            <ResultCard
              result={result}
              onReset={handleReset}
            />
          ) : isCompressing ? (
            <ProgressCard progress={progress} logs={logs} />
          ) : !metadata ? (
            <Dropzone onFileSelect={handleFileSelect} isProcessing={isCompressing} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Media File Card */}
              <div className="bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#313338] border border-[#3f4147] flex items-center justify-center shrink-0">
                    {metadata.type === 'video' ? (
                      <FileVideo className="w-5 h-5 text-[#5865f2]" />
                    ) : (
                      <FileImage className="w-5 h-5 text-[#5865f2]" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md font-['Outfit']">
                      {metadata.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#949ba4]">
                      <span>{formatBytes(metadata.originalSizeBytes)}</span>
                      {metadata.durationSeconds && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(metadata.durationSeconds)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-[#313338] hover:bg-[#383a40] border border-[#3f4147] text-xs text-[#949ba4] hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Change
                </button>
              </div>

              {/* Target Limit Selector */}
              <TargetSelector
                targetMB={config.targetSizeMB}
                onTargetChange={(mb) => handleConfigChange({ targetSizeMB: mb })}
              />

              {/* Advanced Settings */}
              <AdvancedSettings
                config={config}
                onChange={handleConfigChange}
                mediaType={metadata.type}
              />

              {/* Compress Action Button */}
              <motion.button
                type="button"
                onClick={startCompression}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full py-4 px-6 rounded-2xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-base sm:text-lg tracking-wide transition-colors font-['Outfit'] select-none"
              >
                Compress to {config.targetSizeMB} MB
              </motion.button>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="w-full py-6 text-center text-xs text-[#949ba4]">
        Wumpress v1.0
      </footer>
    </div>
  );
}
