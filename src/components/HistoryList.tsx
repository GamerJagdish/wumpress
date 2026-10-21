'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Film, Image as ImageIcon, Clock, Eye, Download, X } from 'lucide-react';
import { HistoryItem } from '../lib/types';
import { formatBytes, formatDuration } from '../lib/calculator';

interface HistoryListProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function HistoryList({ items, onDelete, onClearAll }: HistoryListProps) {
  const [preview, setPreview] = useState<{ item: HistoryItem; url: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleOpenPreview = (item: HistoryItem) => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    const url = URL.createObjectURL(item.blob);
    setPreview({ item, url });
  };

  const handleClosePreview = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  };

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview?.url]);

  if (items.length === 0) {
    return null;
  }

  const totalBytes = items.reduce((acc, curr) => acc + (curr.outputSizeBytes || curr.blob.size || 0), 0);

  const handleDownload = (item: HistoryItem) => {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="w-full mt-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            Recent Compressions
          </h3>
          <span className="text-xs text-[#949ba4] font-medium">
            ({items.length} {items.length === 1 ? 'file' : 'files'}, {formatBytes(totalBytes)})
          </span>
        </div>

        {confirmClear ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#f23f43]">Delete all?</span>
            <button
              type="button"
              onClick={() => {
                onClearAll();
                setConfirmClear(false);
              }}
              className="px-2 py-0.5 rounded bg-[#f23f43] hover:bg-[#da373c] text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-2 py-0.5 rounded bg-[#313338] hover:bg-[#383a40] text-[#dbdee1] text-[11px] transition-colors cursor-pointer"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="text-xs text-[#949ba4] hover:text-[#f23f43] transition-colors cursor-pointer flex items-center gap-1 font-medium"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* History Items Cards */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-[#2b2d31] border border-[#383a40] hover:border-[#474a52] rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#313338] border border-[#3f4147] flex items-center justify-center shrink-0 text-[#5865f2]">
                  {item.mediaType === 'video' ? (
                    <Film className="w-4.5 h-4.5" />
                  ) : (
                    <ImageIcon className="w-4.5 h-4.5" />
                  )}
                </div>

                <div className="overflow-hidden min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px] sm:max-w-xs font-['Outfit']">
                    {item.fileName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#949ba4] pt-0.5">
                    <span className="font-semibold text-[#5865f2]">
                      {formatBytes(item.outputSizeBytes)}
                    </span>
                    <span className="text-[#23a55a] font-medium">
                      (-{item.savingsPercentage}%)
                    </span>
                    <span className="text-[#80848e]">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                    {typeof item.timeElapsed === 'number' && (
                      <span className="inline-flex items-center gap-1 text-[#80848e]">
                        <Clock className="w-3 h-3 text-[#5865f2]" />
                        <span>{formatDuration(item.timeElapsed)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenPreview(item)}
                  title="Preview"
                  className="w-8 h-8 rounded-lg bg-[#313338] hover:bg-[#383a40] text-[#949ba4] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#3f4147]"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  title="Download"
                  className="w-8 h-8 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45a5] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  title="Delete from history"
                  className="w-8 h-8 rounded-lg bg-[#313338] hover:bg-[#392125] text-[#949ba4] hover:text-[#f23f43] flex items-center justify-center transition-colors cursor-pointer border border-[#3f4147] hover:border-[#5c2d33]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-[#2b2d31] border border-[#383a40] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl select-text"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="overflow-hidden">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate font-['Outfit']">
                    {preview.item.fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#949ba4]">
                    <span className="line-through">{formatBytes(preview.item.originalSizeBytes)}</span>
                    <span className="text-[#5865f2] font-bold">{formatBytes(preview.item.outputSizeBytes)}</span>
                    <span className="text-[#23a55a] font-medium">(-{preview.item.savingsPercentage}%)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="w-8 h-8 rounded-lg bg-[#313338] hover:bg-[#383a40] text-[#949ba4] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#3f4147] shrink-0"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Media viewer */}
              <div className="w-full bg-[#1e1f22] border border-[#383a40] rounded-xl overflow-hidden max-h-[360px] flex items-center justify-center">
                {preview.item.mediaType === 'video' ? (
                  <video
                    src={preview.url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[360px] object-contain"
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={preview.url}
                    alt={preview.item.fileName}
                    className="w-full max-h-[360px] object-contain"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="px-4 py-2 rounded-xl bg-[#313338] hover:bg-[#383a40] text-[#dbdee1] text-xs font-bold transition-colors cursor-pointer font-['Outfit']"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(preview.item)}
                  className="px-4 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 font-['Outfit']"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
