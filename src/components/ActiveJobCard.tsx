'use client';

import { motion } from 'motion/react';
import { Loader2, Clock, XCircle, Eye } from 'lucide-react';
import { CompressionProgress } from '../lib/types';
import { formatDuration } from '../lib/calculator';

interface ActiveJobCardProps {
  fileName: string;
  progress: CompressionProgress;
  onExpand: () => void;
  onCancel: () => void;
}

export default function ActiveJobCard({
  fileName,
  progress,
  onExpand,
  onCancel,
}: ActiveJobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="w-full bg-[#2b2d31] border border-[#5865f2]/40 rounded-2xl p-4 sm:p-5 shadow-lg shadow-[#5865f2]/5"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#5865f2]/15 border border-[#5865f2]/30 flex items-center justify-center text-[#5865f2] shrink-0">
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#5865f2] uppercase tracking-wider">
                Compressing in Background
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs font-['Outfit']">
              {fileName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-lg font-black text-[#5865f2] font-['Outfit']">
              {progress.progress}%
            </span>
            <div className="text-[11px] text-[#949ba4] flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-[#5865f2]" />
              <span>{formatDuration(progress.timeElapsed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-[#1e1f22] rounded-full overflow-hidden border border-[#383a40] mb-3">
        <div
          className="h-full bg-[#5865f2] rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, progress.progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-xs text-[#949ba4] truncate max-w-[200px] sm:max-w-sm">
          {progress.currentStage || 'Processing media...'}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 rounded-lg bg-[#313338] hover:bg-[#392125] hover:text-[#f23f43] border border-[#3f4147] hover:border-[#5c2d33] text-xs text-[#949ba4] transition-colors cursor-pointer flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={onExpand}
            className="px-3 py-1 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 font-['Outfit']"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
