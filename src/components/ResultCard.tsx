'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { CompressionResult } from '../lib/types';
import { formatBytes } from '../lib/calculator';

interface ResultCardProps {
  result: CompressionResult;
  targetMB: number;
  onReset: () => void;
}

export default function ResultCard({ result, targetMB, onReset }: ResultCardProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#5865f2', '#23a55a', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      //
    }
  }, []);

  const isUnderLimit = result.outputSizeBytes <= targetMB * 1024 * 1024;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-5 sm:p-7 overflow-hidden"
    >
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#383a40] mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#23a55a] font-bold font-mono mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#23a55a]" />
            <span>Ready for Discord</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Compressed
          </h2>
          <p className="text-xs text-[#949ba4] font-mono mt-0.5 truncate max-w-sm">
            {result.fileName}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-[11px] text-[#949ba4] uppercase font-bold">Reduction</span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-[#23a55a]">
            -{result.savingsPercentage}%
          </span>
        </div>
      </div>

      {/* Comparison metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] block">Original</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#949ba4] line-through">
            {formatBytes(result.originalSizeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] block">New Size</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#5865f2]">
            {formatBytes(result.outputSizeBytes)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] block">Status</span>
          <span
            className={`text-sm font-bold font-mono ${
              isUnderLimit ? 'text-[#23a55a]' : 'text-[#f0b232]'
            }`}
          >
            {isUnderLimit ? 'Under limit' : 'Slightly over'}
          </span>
        </div>
      </div>

      {/* Media Preview */}
      <div className="w-full bg-[#1e1f22] border border-[#383a40] rounded-xl overflow-hidden mb-5 flex items-center justify-center max-h-[320px]">
        {result.mediaType === 'video' ? (
          <video
            src={result.downloadUrl}
            controls
            playsInline
            className="w-full max-h-[320px] object-contain"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={result.downloadUrl}
            alt="Compressed result"
            className="max-h-[320px] w-auto object-contain"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <a
          href={result.downloadUrl}
          download={result.fileName}
          className="w-full sm:flex-1 py-3.5 px-5 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-center text-sm sm:text-base flex items-center justify-center gap-2 transition-colors select-none font-['Outfit']"
        >
          <Download className="w-4 h-4" />
          Download
        </a>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-[#313338] hover:bg-[#383a40] border border-[#3f4147] text-[#f2f3f5] text-center text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition-colors select-none font-['Outfit']"
        >
          <RefreshCw className="w-4 h-4 text-[#949ba4]" />
          Compress Another
        </button>
      </div>
    </motion.div>
  );
}
