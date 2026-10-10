'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Download, RefreshCw } from 'lucide-react';
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
          <motion.svg
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: [0, 1.25, 0.95, 1], rotate: [-25, 4, -1, 0] }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            viewBox="0 0 22 22"
            className="w-6 h-6 shrink-0"
          >
            <path
              fill="#23a55a"
              d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.246-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"
            />
            <path
              fill="#ffffff"
              d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.136 5.378-5.378 1.302 1.302-6.68 6.67z"
            />
          </motion.svg>
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
