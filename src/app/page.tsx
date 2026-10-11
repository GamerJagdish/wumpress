'use client';

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Film,
  Image as ImageIcon,
  RotateCcw,
  X,
  Layers,
  Pencil,
  Check,
} from 'lucide-react';

import Header from '@/components/Header';
import Dropzone from '@/components/Dropzone';
import TargetSelector from '@/components/TargetSelector';
import AdvancedSettings from '@/components/AdvancedSettings';
import ProgressCard from '@/components/ProgressCard';
import ResultCard from '@/components/ResultCard';
import ActiveJobCard from '@/components/ActiveJobCard';
import HistoryList from '@/components/HistoryList';
import ClickSpark from '@/components/ClickSpark';

import { inspectFile } from '@/lib/media-inspector';
import { calculateVideoBitrates, formatBytes, formatDuration } from '@/lib/calculator';
import {
  compressVideo,
  compressGif,
  getDetectedCore,
  subscribeCoreChange,
  terminateFFmpeg,
} from '@/lib/ffmpeg';
import { compressImage } from '@/lib/image-compressor';
import {
  getAllHistory,
  saveHistory,
  deleteHistory,
  clearAllHistory,
} from '@/lib/storage';
import {
  MediaMetadata,
  CompressionConfig,
  CompressionProgress,
  CompressionResult,
  HistoryItem,
  QueuedCompression,
} from '@/lib/types';

const DEFAULT_CONFIG: CompressionConfig = {
  targetSizeMB: 20,
  safetyFactor: 0.94,
  audioMode: 'standard',
  scaleMode: 'auto',
  fpsMode: 'auto',
  imageFormat: 'auto',
};

type ViewMode = 'upload' | 'progress' | 'result';

export default function HomePage() {
  const [selectedFiles, setSelectedFiles] = useState<MediaMetadata[]>([]);
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
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedCompression[]>([]);
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const coreType = useSyncExternalStore(
    subscribeCoreChange,
    getDetectedCore,
    () => '@ffmpeg/core-mt'
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const queueRef = useRef<QueuedCompression[]>([]);
  const viewModeRef = useRef<ViewMode>('upload');
  const isCancellingRef = useRef(false);
  const cancelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const executeCompressionRef = useRef<((targetMeta: MediaMetadata, targetConfig: CompressionConfig) => Promise<void>) | null>(null);

  queueRef.current = queue;
  viewModeRef.current = viewMode;

  const isCompressing = progress.status === 'compressing';

  // Load history from IndexedDB on initial mount
  useEffect(() => {
    getAllHistory().then((items) => {
      setHistory(items);
    });
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cancelTimeoutRef.current) clearTimeout(cancelTimeoutRef.current);
    };
  }, []);

  // Protect against accidental refresh or tab close while compression is active
  useEffect(() => {
    if (!isCompressing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isCompressing]);

  // Handle browser Back button with History API
  useEffect(() => {
    const handlePopState = () => {
      if (result) {
        handleReset();
      } else if (selectedFiles.length > 0) {
        handleClearSelectedFiles();
        setViewMode('upload');
      } else if (isCompressing && viewModeRef.current === 'progress') {
        setViewMode('upload');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [result, selectedFiles, isCompressing]);

  const handleFilesSelect = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      setProgress((prev) => ({ ...prev, error: null }));
      const inspected = await Promise.all(files.map((file) => inspectFile(file)));
      setSelectedFiles((prev) => [...prev, ...inspected]);
      if (typeof window !== 'undefined') {
        window.history.pushState({ step: 'config' }, '');
      }
    } catch (err: unknown) {
      console.error(err);
      setProgress((prev) => ({
        ...prev,
        status: 'error',
        error: 'Failed to inspect one or more media files. Please try again.',
      }));
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearSelectedFiles = () => {
    selectedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSelectedFiles([]);
  };

  const handleConfigChange = (updated: Partial<CompressionConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  const handlePostCancellation = useCallback((targetMeta: MediaMetadata) => {
    isCancellingRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    if (targetMeta.previewUrl) {
      URL.revokeObjectURL(targetMeta.previewUrl);
    }

    if (queueRef.current.length > 0) {
      const nextItem = queueRef.current[0];
      queueRef.current = queueRef.current.slice(1);
      setQueue((prev) => prev.slice(1));

      setActiveFileName(nextItem.metadata.name);
      setProgress({
        status: 'compressing',
        progress: 2,
        currentStage: `Preparing ${nextItem.metadata.name}...`,
        timeElapsed: 0,
        error: null,
      });

      if (cancelTimeoutRef.current) clearTimeout(cancelTimeoutRef.current);
      cancelTimeoutRef.current = setTimeout(() => {
        executeCompressionRef.current?.(nextItem.metadata, nextItem.config);
      }, 100);
    } else {
      setActiveFileName(null);
      setProgress({
        status: 'idle',
        progress: 0,
        currentStage: '',
        timeElapsed: 0,
        error: null,
      });
      setViewMode('upload');
    }
  }, []);

  const executeCompression = useCallback(
    async (targetMeta: MediaMetadata, targetConfig: CompressionConfig) => {
      setActiveFileName(targetMeta.name);
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

      const calculation = calculateVideoBitrates(
        targetMeta.durationSeconds || 10,
        targetConfig.targetSizeMB,
        targetConfig.audioMode,
        targetConfig.safetyFactor
      );

      try {
        let outputBlob: Blob = targetMeta.file;
        let finalFileName: string = targetMeta.name;

        if (targetMeta.type === 'video') {
          const res = await compressVideo({
            file: targetMeta.file,
            durationSeconds: targetMeta.durationSeconds || 10,
            config: targetConfig,
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
              setLogs((prev) => [...prev, line]);
            },
          });
          outputBlob = res.blob;
          finalFileName = res.fileName;
        } else if (targetMeta.type === 'gif') {
          const res = await compressGif({
            file: targetMeta.file,
            config: targetConfig,
            onProgress: (pct, stage) => {
              setProgress((prev) => ({
                ...prev,
                progress: pct >= 0 ? pct : prev.progress,
                currentStage: stage || prev.currentStage,
              }));
            },
            onLog: (line) => {
              setLogs((prev) => [...prev, line]);
            },
          });
          outputBlob = res.blob;
          finalFileName = res.fileName;
        } else {
          const res = await compressImage({
            file: targetMeta.file,
            config: targetConfig,
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

        // If cancellation occurred while compression finished
        if (isCancellingRef.current) {
          handlePostCancellation(targetMeta);
          return;
        }

        if (timerRef.current) clearInterval(timerRef.current);

        const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const downloadUrl = URL.createObjectURL(outputBlob);
        const savingsPercentage = Math.max(
          0,
          Math.round(
            ((targetMeta.originalSizeBytes - outputBlob.size) / targetMeta.originalSizeBytes) * 100
          )
        );

        const compResult: CompressionResult = {
          blob: outputBlob,
          downloadUrl,
          outputSizeBytes: outputBlob.size,
          originalSizeBytes: targetMeta.originalSizeBytes,
          savingsPercentage,
          fileName: finalFileName,
          mediaType: finalFileName.endsWith('.mp4') ? 'video' : targetMeta.type,
          timeElapsed: elapsedSeconds,
        };

        // Persist to IndexedDB history
        const savedHistoryItem = await saveHistory({
          fileName: finalFileName,
          originalSizeBytes: targetMeta.originalSizeBytes,
          outputSizeBytes: outputBlob.size,
          savingsPercentage,
          mediaType: compResult.mediaType,
          durationSeconds: targetMeta.durationSeconds,
          timeElapsed: elapsedSeconds,
          blob: outputBlob,
        });

        setHistory((prev) => [
          savedHistoryItem,
          ...prev.filter((item) => item.id !== savedHistoryItem.id),
        ]);

        // Revoke the original input preview URL to free memory
        if (targetMeta.previewUrl) {
          URL.revokeObjectURL(targetMeta.previewUrl);
        }

        // Check if more items are waiting in the queue
        if (queueRef.current.length > 0) {
          const nextItem = queueRef.current[0];
          queueRef.current = queueRef.current.slice(1);
          setQueue((prev) => prev.slice(1));
          executeCompressionRef.current?.(nextItem.metadata, nextItem.config);
        } else {
          setActiveFileName(null);
          setProgress({
            status: 'completed',
            progress: 100,
            currentStage: 'Done',
            timeElapsed: elapsedSeconds,
            error: null,
          });

          // If the user was viewing the progress card, show the result card
          if (viewModeRef.current === 'progress') {
            setResult(compResult);
            setViewMode('result');
            if (typeof window !== 'undefined') {
              window.history.pushState({ step: 'result' }, '');
            }
          }
        }
      } catch (err: unknown) {
        if (timerRef.current) clearInterval(timerRef.current);

        const isCancelled =
          isCancellingRef.current ||
          (err instanceof Error &&
            (err.message.includes('called FFmpeg.terminate') ||
              err.message.toLowerCase().includes('terminate')));

        if (isCancelled) {
          handlePostCancellation(targetMeta);
          return;
        }

        console.error('Compression failed:', err);
        const message =
          err instanceof Error ? err.message : 'Wumpressing failed due to an unexpected error.';
        setProgress((prev) => ({
          ...prev,
          status: 'error',
          error: message,
        }));
        setActiveFileName(null);
      }
    },
    [handlePostCancellation]
  );

  executeCompressionRef.current = executeCompression;

  const startCompression = () => {
    if (selectedFiles.length === 0) return;

    if (isCompressing) {
      // Add all selected files to queue
      const queuedItems: QueuedCompression[] = selectedFiles.map((meta, idx) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `queue_${Date.now()}_${idx}`,
        metadata: meta,
        config: { ...config },
      }));
      queueRef.current = [...queueRef.current, ...queuedItems];
      setQueue((prev) => [...prev, ...queuedItems]);
      setSelectedFiles([]);
      setViewMode('upload');
      return;
    }

    const first = selectedFiles[0];
    const rest = selectedFiles.slice(1);

    if (rest.length > 0) {
      const queuedItems: QueuedCompression[] = rest.map((meta, idx) => ({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `queue_${Date.now()}_${idx}`,
        metadata: meta,
        config: { ...config },
      }));
      queueRef.current = [...queueRef.current, ...queuedItems];
      setQueue((prev) => [...prev, ...queuedItems]);
    }

    setSelectedFiles([]);
    setResult(null);
    setViewMode('progress');
    if (typeof window !== 'undefined') {
      window.history.pushState({ step: 'progress' }, '');
    }

    executeCompression(first, { ...config });
  };

  const handleUpdateQueueConfig = (id: string, updated: Partial<CompressionConfig>) => {
    queueRef.current = queueRef.current.map((item) =>
      item.id === id ? { ...item, config: { ...item.config, ...updated } } : item
    );
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, config: { ...item.config, ...updated } } : item
      )
    );
  };

  const handleCancelActiveJob = useCallback(() => {
    if (isCancellingRef.current) return;

    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current);
      cancelTimeoutRef.current = null;
      if (queueRef.current.length > 0) {
        const nextItem = queueRef.current[0];
        queueRef.current = queueRef.current.slice(1);
        setQueue((prev) => prev.slice(1));
        setActiveFileName(nextItem.metadata.name);
        setProgress({
          status: 'compressing',
          progress: 2,
          currentStage: `Preparing ${nextItem.metadata.name}...`,
          timeElapsed: 0,
          error: null,
        });
        cancelTimeoutRef.current = setTimeout(() => {
          executeCompressionRef.current?.(nextItem.metadata, nextItem.config);
        }, 100);
        return;
      } else {
        setActiveFileName(null);
        setProgress({
          status: 'idle',
          progress: 0,
          currentStage: '',
          timeElapsed: 0,
          error: null,
        });
        setViewMode('upload');
        return;
      }
    }

    isCancellingRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress((prev) => ({
      ...prev,
      currentStage: queueRef.current.length > 0 ? 'Cancelling file, moving to next...' : 'Cancelling...',
    }));

    terminateFFmpeg();
  }, []);

  const handleReset = () => {
    if (cancelTimeoutRef.current) {
      clearTimeout(cancelTimeoutRef.current);
      cancelTimeoutRef.current = null;
    }
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    handleClearSelectedFiles();
    setResult(null);
    setLogs([]);
    setProgress({
      status: 'idle',
      progress: 0,
      currentStage: '',
      timeElapsed: 0,
      error: null,
    });
    setViewMode('upload');
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteHistory(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = async () => {
    await clearAllHistory();
    setHistory([]);
  };

  const handleRemoveFromQueue = (id: string) => {
    const itemToRemove = queue.find((item) => item.id === id);
    if (itemToRemove?.metadata?.previewUrl) {
      URL.revokeObjectURL(itemToRemove.metadata.previewUrl);
    }
    queueRef.current = queueRef.current.filter((item) => item.id !== id);
    setQueue((prev) => prev.filter((item) => item.id !== id));
    if (editingQueueId === id) {
      setEditingQueueId(null);
    }
  };

  const uniqueSelectedTypes = Array.from(new Set(selectedFiles.map((f) => f.type)));
  const totalSelectedBytes = selectedFiles.reduce((acc, f) => acc + f.originalSizeBytes, 0);

  return (
    <ClickSpark sparkColor="#ffffff">
      <div className="min-h-screen flex flex-col bg-[#1e1f22] text-[#f2f3f5] select-none">
        <Header />

        <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center select-text">
          {/* Error Alert */}
          <AnimatePresence>
            {progress.status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mb-4 p-4 rounded-xl bg-[#392125] border border-[#5c2d33] text-[#f23f43] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{progress.error || 'Failed to wumpress media.'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded bg-[#4e272d] hover:bg-[#5c2d33] text-white font-bold transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className="space-y-4">
            {/* Result View */}
            {result && viewMode === 'result' ? (
              <ResultCard result={result} onReset={handleReset} />
            ) : isCompressing && viewMode === 'progress' ? (
              /* Full Progress View */
              <ProgressCard
                progress={progress}
                logs={logs}
                onMinimize={() => setViewMode('upload')}
                onCancel={handleCancelActiveJob}
              />
            ) : selectedFiles.length > 0 ? (
              /* Settings & Config View for Selected Files */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {selectedFiles.length === 1 ? (
                  /* Single Media File Card */
                  <div className="bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-[#313338] border border-[#3f4147] flex items-center justify-center shrink-0">
                        {selectedFiles[0].type === 'video' ? (
                          <Film className="w-5 h-5 text-[#5865f2]" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#5865f2]" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md font-['Outfit']">
                          {selectedFiles[0].name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#949ba4]">
                          <span>{formatBytes(selectedFiles[0].originalSizeBytes)}</span>
                          {selectedFiles[0].durationSeconds && (
                            <span className="text-[#80848e]">
                              ({formatDuration(selectedFiles[0].durationSeconds)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleClearSelectedFiles}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="px-3 py-1.5 rounded-xl bg-[#313338] hover:bg-[#383a40] active:bg-[#2b2d31] border border-[#3f4147] text-xs text-[#949ba4] hover:text-white flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </motion.button>
                  </div>
                ) : (
                  /* Bulk Upload Summary Card */
                  <div className="bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#383a40]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#5865f2]/15 border border-[#5865f2]/30 flex items-center justify-center text-[#5865f2] shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit']">
                            Bulk Upload ({selectedFiles.length} files)
                          </h3>
                          <p className="text-xs text-[#949ba4]">
                            Total size: {formatBytes(totalSelectedBytes)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearSelectedFiles}
                        className="px-2.5 py-1 rounded-xl bg-[#313338] hover:bg-[#383a40] border border-[#3f4147] text-xs text-[#949ba4] hover:text-white transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    {/* Scrollable list of files in this batch */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={`${file.name}_${idx}`}
                          className="bg-[#1e1f22] border border-[#383a40] rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-[#313338] flex items-center justify-center shrink-0 text-[#5865f2]">
                              {file.type === 'video' ? (
                                <Film className="w-3.5 h-3.5" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <span className="text-white font-bold truncate block">
                                {file.name}
                              </span>
                              <div className="text-[11px] text-[#949ba4]">
                                <span>{formatBytes(file.originalSizeBytes)}</span>
                                {file.durationSeconds && (
                                  <span className="text-[#80848e] ml-1">
                                    ({formatDuration(file.durationSeconds)})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedFile(idx)}
                            className="p-1 rounded-lg text-[#949ba4] hover:text-[#f23f43] hover:bg-[#313338] transition-colors cursor-pointer shrink-0"
                            title="Remove file from batch"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Limit Selector */}
                <TargetSelector
                  targetMB={config.targetSizeMB}
                  onTargetChange={(mb) => handleConfigChange({ targetSizeMB: mb })}
                />

                {/* Advanced Settings with support for all types in the batch */}
                <AdvancedSettings
                  config={config}
                  onChange={handleConfigChange}
                  mediaTypes={uniqueSelectedTypes}
                />

                {/* Compress / Add to Queue Button */}
                <motion.button
                  type="button"
                  onClick={startCompression}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-full py-4 px-6 rounded-2xl bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white font-bold text-base sm:text-lg tracking-wide transition-colors duration-150 font-['Outfit'] select-none cursor-pointer"
                >
                  {isCompressing
                    ? `Add ${selectedFiles.length === 1 ? 'File' : `${selectedFiles.length} Files`} to Queue (${config.targetSizeMB} MB)`
                    : selectedFiles.length === 1
                    ? `Wumpress to ${config.targetSizeMB} MB`
                    : `Wumpress ${selectedFiles.length} files to ${config.targetSizeMB} MB`}
                </motion.button>
              </motion.div>
            ) : (
              /* Upload Screen (Dropzone + Background Active Job + Queue + History) */
              <div className="space-y-4">
                <Dropzone onFilesSelect={handleFilesSelect} isProcessing={false} />

                {/* Active Background Job Card */}
                {isCompressing && activeFileName && (
                  <ActiveJobCard
                    fileName={activeFileName}
                    progress={progress}
                    onExpand={() => setViewMode('progress')}
                    onCancel={handleCancelActiveJob}
                  />
                )}

                {/* Queued Items List with Inline Editing */}
                {queue.length > 0 && (
                  <div className="bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider font-['Outfit']">
                        Up Next in Queue ({queue.length})
                      </span>
                      <span className="text-[11px] text-[#80848e]">
                        Sequential processing
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {queue.map((item, idx) => {
                        const isEditing = editingQueueId === item.id;
                        return (
                          <div
                            key={item.id}
                            className="bg-[#1e1f22] border border-[#383a40] rounded-xl overflow-hidden transition-all duration-200"
                          >
                            <div className="p-3 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                <span className="text-[#5865f2] font-bold font-mono shrink-0">
                                  #{idx + 1}
                                </span>
                                <div className="w-7 h-7 rounded-lg bg-[#313338] border border-[#3f4147] flex items-center justify-center shrink-0 text-[#5865f2]">
                                  {item.metadata.type === 'video' ? (
                                    <Film className="w-3.5 h-3.5" />
                                  ) : (
                                    <ImageIcon className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="overflow-hidden min-w-0">
                                  <span className="text-white font-bold truncate block font-['Outfit']">
                                    {item.metadata.name}
                                  </span>
                                  <div className="flex items-center gap-2 text-[11px] text-[#949ba4]">
                                    <span>{formatBytes(item.metadata.originalSizeBytes)}</span>
                                    <span className="text-[#5865f2] font-semibold">
                                      Target: {item.config.targetSizeMB} MB
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEditingQueueId(isEditing ? null : item.id)}
                                  className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                                    isEditing
                                      ? 'bg-[#5865f2] border-[#5865f2] text-white'
                                      : 'bg-[#313338] border-[#3f4147] text-[#949ba4] hover:text-white hover:bg-[#383a40]'
                                  }`}
                                  title={isEditing ? 'Close settings' : 'Edit compression settings'}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-medium hidden sm:inline">
                                    {isEditing ? 'Close' : 'Edit'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromQueue(item.id)}
                                  className="p-1.5 rounded-lg bg-[#313338] hover:bg-[#392125] border border-[#3f4147] hover:border-[#5c2d33] text-[#949ba4] hover:text-[#f23f43] transition-colors cursor-pointer"
                                  title="Remove from queue"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inline Editor for Queued Item */}
                            {isEditing && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="p-3.5 pt-0 border-t border-[#383a40] space-y-3 bg-[#242629]/50"
                              >
                                <div className="pt-2">
                                  <TargetSelector
                                    targetMB={item.config.targetSizeMB}
                                    onTargetChange={(mb) =>
                                      handleUpdateQueueConfig(item.id, { targetSizeMB: mb })
                                    }
                                  />
                                </div>

                                <AdvancedSettings
                                  config={item.config}
                                  onChange={(up) => handleUpdateQueueConfig(item.id, up)}
                                  mediaType={item.metadata.type}
                                />

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingQueueId(null)}
                                    className="px-3 py-1.5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 font-['Outfit']"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Done Editing</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Persistent History List */}
                <HistoryList
                  items={history}
                  onDelete={handleDeleteHistory}
                  onClearAll={handleClearHistory}
                />
              </div>
            )}
          </div>
        </main>

        <footer className="w-full py-6 text-center text-xs text-[#949ba4] select-none">
          <span className="inline-block select-text">
            <a
              href="https://github.com/gamerjagdish/wumpress"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#949ba4] hover:text-white underline underline-offset-2 transition-colors duration-150"
            >
              Wumpress v1.0
            </a>{' '}
            using{' '}
            <a
              href="https://github.com/ffmpegwasm/ffmpeg.wasm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#949ba4] hover:text-white underline underline-offset-2 transition-colors duration-150"
            >
              {coreType}
            </a>
          </span>
        </footer>
      </div>
    </ClickSpark>
  );
}
