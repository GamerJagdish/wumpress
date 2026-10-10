'use client';

import { BitrateCalculation, formatBytes, formatBitrate } from '../lib/calculator';
import { MediaMetadata } from '../lib/types';

interface SpecsBoardProps {
  metadata: MediaMetadata;
  calculation: BitrateCalculation;
  targetMB: number;
}

export default function SpecsBoard({ metadata, calculation, targetMB }: SpecsBoardProps) {
  const originalBytes = metadata.originalSizeBytes;
  const targetBytes = targetMB * 1024 * 1024;
  const reductionPercent = Math.max(
    0,
    Math.round(((originalBytes - targetBytes) / originalBytes) * 100)
  );

  return (
    <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] font-medium block">
            Original
          </span>
          <span className="text-base sm:text-lg font-bold text-white">
            {formatBytes(metadata.originalSizeBytes)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] font-medium block">
            Target
          </span>
          <span className="text-base sm:text-lg font-bold text-[#5865f2]">
            {targetMB} MB
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] font-medium block">
            Estimated Savings
          </span>
          <span className="text-base sm:text-lg font-bold text-[#23a55a]">
            -{reductionPercent}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40]">
          <span className="text-[11px] text-[#949ba4] font-medium block">
            {metadata.type === 'video' ? 'Video Bitrate' : 'Output Format'}
          </span>
          <span className="text-base sm:text-lg font-bold text-white">
            {metadata.type === 'video'
              ? formatBitrate(calculation.videoBitrateKbps)
              : 'WebP'}
          </span>
        </div>
      </div>
    </div>
  );
}
