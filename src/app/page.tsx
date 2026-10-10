'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileVideo,
  FileImage,
  Zap,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

import Header from '@/components/Header';
import Dropzone from '@/components/Dropzone';
import TargetSelector from '@/components/TargetSelector';
import AdvancedSettings from '@/components/AdvancedSettings';
import SpecsBoard from '@/components/SpecsBoard';
import ProgressCard from '@/components/ProgressCard';
import ResultCard from '@/components/ResultCard';

import { inspectFile } from '@/lib/media-inspector';
import { calculateVideoBitrates, formatBytes, formatDuration } from '@/lib/calculator';
import { compressVideo, convertGifToMp4 } from '@/lib/ffmpeg';
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
  convertToMp4IfGif: true,
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

  // Stop elapsed timer on unmount
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
      currentStage: 'Preparing compression pipeline...',
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
      let outputBlob: Blob;
      let finalFileName: string;

      if (metadata.type === 'video') {
        const res = await compressVideo({
          file: metadata.file,
          durationSeconds: metadata.durationSeconds || 10,
          config,
          calculation,
          onProgress: (pct, stage) => {
            setProgress((prev) => ({
              ...prev,
              progress: pct,
              currentStage: stage || prev.currentStage,
            }));
          },
          onLog: (line) => {
            setLogs((prev) => [...prev.slice(-100), line]);
          },
        });
        outputBlob = res.blob;
        finalFileName = res.fileName;
      } else if (metadata.type === 'gif' && config.convertToMp4IfGif) {
        const res = await convertGifToMp4({
          file: metadata.file,
          onProgress: (pct, stage) => {
            setProgress((prev) => ({
              ...prev,
              progress: pct,
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
    <div className="min-h-screen flex flex-col bg-[#07080a] text-[#f4f5f8] selection:bg-[#e2fd52] selection:text-black">
      <Header />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        {!metadata && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13161f] border border-[#232938] text-[11px] font-mono text-[#a2adbf] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e2fd52]" />
              CLIENT-SIDE DISCORD MEDIA ENGINE
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase leading-[0.95] mb-4 font-sans">
              CRUNCH UNDER <br />
              <span className="text-[#e2fd52]">{config.targetSizeMB} MB</span> LIMIT
            </h1>
            <p className="text-sm sm:text-lg text-[#8592a6] max-w-xl mx-auto font-sans font-medium">
              Compress heavy videos and images right inside your browser. No server uploads, zero
              file limits, and instant Discord inline playback.
            </p>
          </motion.div>
        )}

        {/* Error Alert */}
        <AnimatePresence>
          {progress.status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-[#241215] border border-[#521c22] text-[#f87171] flex items-center justify-between gap-3 text-sm font-mono"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>{progress.error || 'Encountered an error while compressing.'}</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 rounded bg-[#3b171c] hover:bg-[#521c22] text-white text-xs font-bold shrink-0 transition-colors"
              >
                DISMISS
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Result View */}
          {result ? (
            <ResultCard
              result={result}
              targetMB={config.targetSizeMB}
              onReset={handleReset}
            />
          ) : isCompressing ? (
            /* Active Progress View */
            <ProgressCard progress={progress} logs={logs} />
          ) : !metadata ? (
            /* Upload Dropzone */
            <Dropzone onFileSelect={handleFileSelect} isProcessing={isCompressing} />
          ) : (
            /* Staged Media Configuration View */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Media Header Card */}
              <div className="bg-[#0d1015] border border-[#1e2330] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-xl bg-[#141822] border border-[#252c3c] flex items-center justify-center shrink-0">
                    {metadata.type === 'video' ? (
                      <FileVideo className="w-6 h-6 text-[#38bdf8]" />
                    ) : (
                      <FileImage className="w-6 h-6 text-[#f472b6]" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-md font-sans">
                      {metadata.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#7b889d]">
                      <span>{formatBytes(metadata.originalSizeBytes)}</span>
                      {metadata.durationSeconds && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(metadata.durationSeconds)}</span>
                        </>
                      )}
                      {metadata.width && metadata.height && (
                        <>
                          <span>•</span>
                          <span>
                            {metadata.width}x{metadata.height}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#141722] border border-[#232a3a] text-xs font-mono font-bold text-[#8d9ab0] hover:text-white hover:border-[#343e54] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  CHANGE FILE
                </button>
              </div>

              {/* Target Limit Selector */}
              <TargetSelector
                targetMB={config.targetSizeMB}
                onTargetChange={(mb) => handleConfigChange({ targetSizeMB: mb })}
              />

              {/* Calculated Specs Board */}
              <SpecsBoard
                metadata={metadata}
                calculation={calculation}
                targetMB={config.targetSizeMB}
              />

              {/* Advanced Settings Drawer */}
              <AdvancedSettings
                config={config}
                onChange={handleConfigChange}
                mediaType={metadata.type}
              />

              {/* Big Bold Action Button */}
              <motion.button
                type="button"
                onClick={startCompression}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full py-5 px-6 rounded-2xl bg-[#e2fd52] text-black font-black text-lg sm:text-2xl font-mono tracking-wider flex items-center justify-center gap-3 shadow-[0_6px_0_#9bb814] active:shadow-none active:translate-y-1.5 transition-all select-none"
              >
                <Zap className="w-6 h-6 text-black stroke-[3]" />
                CRUNCH TO UNDER {config.targetSizeMB} MB
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Feature Grid: Non-generic, functional brutalist badges */}
        <div className="mt-16 sm:mt-24 pt-8 border-t border-[#161a23] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-xl bg-[#0c0e13] border border-[#1b202c]">
            <span className="text-[10px] font-mono uppercase text-[#e2fd52] font-bold block mb-1">
              DISCORD COMPATIBLE
            </span>
            <h4 className="text-sm font-bold text-white mb-1">H.264 & FastStart</h4>
            <p className="text-xs text-[#738094] leading-relaxed">
              Muxes the MP4 moov atom to the front so videos stream instantly inline in Discord chat
              channels.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0c0e13] border border-[#1b202c]">
            <span className="text-[10px] font-mono uppercase text-[#38bdf8] font-bold block mb-1">
              ACCURATE BITRATE BUDGET
            </span>
            <h4 className="text-sm font-bold text-white mb-1">5% Safety Factor</h4>
            <p className="text-xs text-[#738094] leading-relaxed">
              Calculates precise bitrates with buffer caps to ensure files land cleanly under the 20
              MB limit.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0c0e13] border border-[#1b202c]">
            <span className="text-[10px] font-mono uppercase text-[#4ade80] font-bold block mb-1">
              ZERO DATA LOGGING
            </span>
            <h4 className="text-sm font-bold text-white mb-1">In-Browser WASM</h4>
            <p className="text-xs text-[#738094] leading-relaxed">
              Files never touch any cloud servers. All processing executes securely in your local
              browser.
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-[#161a23] py-6 px-4 text-center font-mono text-xs text-[#5f6c80]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WAMPRESS: DISCORD MEDIA COMPRESSION ENGINE</span>
          <span>CLIENT-SIDE WEBASSEMBLY</span>
        </div>
      </footer>
    </div>
  );
}
