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
    // Fire celebratory confetti pop
    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#e2fd52', '#38bdf8', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore if confetti not supported
    }
  }, []);

  const isUnderLimit = result.outputSizeBytes <= targetMB * 1024 * 1024;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="w-full bg-[#0d1015] border border-[#242c3d] rounded-2xl p-5 sm:p-8 overflow-hidden"
    >
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#1b212e] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#122115] border border-[#1e3c23] text-[#4ade80] text-xs font-mono font-bold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>DISCORD COMPLIANT</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
            CRUNCH COMPLETE
          </h2>
          <p className="text-xs sm:text-sm text-[#7e8c9f] font-mono mt-1 truncate max-w-md">
            {result.fileName}
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end">
          <span className="text-[10px] font-mono uppercase text-[#677488]">SAVINGS</span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-[#e2fd52]">
            -{result.savingsPercentage}%
          </span>
        </div>
      </div>

      {/* Comparison metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-[#12151e] border border-[#1d222e]">
          <span className="text-[10px] font-mono text-[#677488] uppercase block">
            ORIGINAL SIZE
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-[#a5b2c3] line-through">
            {formatBytes(result.originalSizeBytes)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#151c14] border border-[#28381d]">
          <span className="text-[10px] font-mono text-[#7ea05c] uppercase block">
            NEW COMPRESSED SIZE
          </span>
          <span className="text-lg sm:text-xl font-black font-mono text-[#e2fd52]">
            {formatBytes(result.outputSizeBytes)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-[#12151e] border border-[#1d222e] flex flex-col justify-center">
          <span className="text-[10px] font-mono text-[#677488] uppercase block">
            DISCORD STATUS
          </span>
          <span
            className={`text-sm font-bold font-mono ${
              isUnderLimit ? 'text-[#4ade80]' : 'text-[#f59e0b]'
            }`}
          >
            {isUnderLimit
              ? `PASSED (${(targetMB - result.outputSizeBytes / 1024 / 1024).toFixed(1)} MB HEADROOM)`
              : 'SLIGHTLY OVER BUDGET'}
          </span>
        </div>
      </div>

      {/* Media Preview Box */}
      <div className="w-full bg-[#08090c] border border-[#1c212c] rounded-xl overflow-hidden mb-6 flex items-center justify-center max-h-[360px]">
        {result.mediaType === 'video' ? (
          <video
            src={result.downloadUrl}
            controls
            playsInline
            className="w-full max-h-[360px] object-contain bg-black"
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={result.downloadUrl}
            alt="Compressed result"
            className="max-h-[360px] w-auto object-contain"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href={result.downloadUrl}
          download={result.fileName}
          className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-[#e2fd52] text-black font-black text-center text-sm sm:text-base font-mono tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_#9bb814] active:shadow-none active:translate-y-1 transition-all select-none"
        >
          <Download className="w-5 h-5 text-black stroke-[2.5]" />
          DOWNLOAD COMPRESSED MEDIA
        </a>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto py-4 px-6 rounded-xl bg-[#141822] border border-[#262c3b] text-white hover:bg-[#1a202d] text-center text-sm sm:text-base font-mono font-bold flex items-center justify-center gap-2 transition-all select-none"
        >
          <RefreshCw className="w-4 h-4 text-[#8a98ab]" />
          CRUNCH ANOTHER
        </button>
      </div>
    </motion.div>
  );
}
