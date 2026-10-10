'use client';

import { BitrateCalculation, formatBytes, formatBitrate, formatDuration } from '../lib/calculator';
import { MediaMetadata } from '../lib/types';
import { Activity, Clock, Zap, CheckCircle2 } from 'lucide-react';

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
    <div className="w-full bg-[#0d1015] border border-[#1e2330] rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#e2fd52]" />
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#9ba6b9] font-bold">
            ENCODING ESTIMATES
          </span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#161a24] text-[#8fa0b5] border border-[#232938]">
          {metadata.type.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Original File Size */}
        <div className="p-3 rounded-xl bg-[#12151e] border border-[#1d222e]">
          <span className="text-[10px] font-mono text-[#6c788d] uppercase block">
            SOURCE SIZE
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-white">
            {formatBytes(metadata.originalSizeBytes)}
          </span>
        </div>

        {/* Target Size */}
        <div className="p-3 rounded-xl bg-[#12151e] border border-[#1d222e]">
          <span className="text-[10px] font-mono text-[#6c788d] uppercase block">
            TARGET BUDGET
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-[#e2fd52]">
            {targetMB.toFixed(1)} MB
          </span>
        </div>

        {/* Est. Savings */}
        <div className="p-3 rounded-xl bg-[#12151e] border border-[#1d222e]">
          <span className="text-[10px] font-mono text-[#6c788d] uppercase block">
            EST. SAVINGS
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-[#38bdf8]">
            -{reductionPercent}%
          </span>
        </div>

        {/* Video Bitrate / Image Quality */}
        <div className="p-3 rounded-xl bg-[#12151e] border border-[#1d222e]">
          <span className="text-[10px] font-mono text-[#6c788d] uppercase block">
            {metadata.type === 'video' ? 'VIDEO BITRATE' : 'FORMAT'}
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-white">
            {metadata.type === 'video'
              ? formatBitrate(calculation.videoBitrateKbps)
              : 'WEBP COMPRESSED'}
          </span>
        </div>
      </div>

      {metadata.type === 'video' && (
        <div className="pt-3 border-t border-[#181d27] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#768297]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>DURATION: {formatDuration(metadata.durationSeconds || 0)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#e2fd52]" />
            <span>AUDIO: {calculation.audioBitrateKbps} kbps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>DISCORD STREAMABLE: FASTSTART</span>
          </div>
        </div>
      )}
    </div>
  );
}
