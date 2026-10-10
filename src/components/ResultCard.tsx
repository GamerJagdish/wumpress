'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Download, RefreshCw, Check } from 'lucide-react';
import { CompressionResult } from '../lib/types';
import { formatBytes } from '../lib/calculator';

interface ResultCardProps {
  result: CompressionResult;
  onReset: () => void;
}

export default function ResultCard({ result, onReset }: ResultCardProps) {
  useEffect(() => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#5865f2', '#23a55a', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      //
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-5 sm:p-7 overflow-hidden"
    >
      {/* Sleek unified header without block boxes */}
      <div className="pb-5 border-b border-[#383a40] mb-5 space-y-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
            Compressed
          </h2>
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-6 h-6 rounded-full bg-[#23a55a]/15 border border-[#23a55a] flex items-center justify-center text-[#23a55a] shrink-0"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </motion.div>
        </div>

        <p className="text-xs sm:text-sm text-[#949ba4] font-medium truncate max-w-full">
          {result.fileName}
        </p>

        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold pt-0.5">
          <span className="line-through text-[#949ba4]">
            {formatBytes(result.originalSizeBytes)}
          </span>
          <span className="text-[#949ba4] font-normal">to</span>
          <span className="text-[#5865f2]">
            {formatBytes(result.outputSizeBytes)}
          </span>
          <span className="text-[#23a55a]">
            (-{result.savingsPercentage}%)
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
