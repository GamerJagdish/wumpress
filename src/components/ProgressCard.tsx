'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Terminal, Clock, ChevronDown } from 'lucide-react';
import { CompressionProgress } from '../lib/types';
import { formatDuration } from '../lib/calculator';

interface ProgressCardProps {
  progress: CompressionProgress;
  logs: string[];
}

export default function ProgressCard({ progress, logs }: ProgressCardProps) {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full bg-[#0d1015] border border-[#232938] rounded-2xl p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#171c26] border border-[#283042] flex items-center justify-center text-[#e2fd52]">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white">
              CRUNCHING MEDIA
            </h3>
            <p className="text-xs font-mono text-[#818ea2]">
              {progress.currentStage || 'Processing frames...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141822] border border-[#212736] text-[#8e9bb0]">
            <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>ELAPSED: {formatDuration(progress.timeElapsed)}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#e2fd52]">
            {progress.progress}%
          </div>
        </div>
      </div>

      {/* Chunky animated progress bar */}
      <div className="w-full h-4 bg-[#141822] rounded-full overflow-hidden p-0.5 border border-[#222836] mb-6">
        <motion.div
          className="h-full bg-[#e2fd52] rounded-full shadow-[0_0_12px_rgba(226,253,82,0.4)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(2, progress.progress)}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Terminal log toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 text-xs font-mono text-[#768397] hover:text-white transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-[#e2fd52]" />
          <span>VIEW ENCODER LOGS ({logs.length})</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showLogs ? 'rotate-180' : ''}`}
          />
        </button>

        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 rounded-xl bg-[#07080b] border border-[#1b202a] font-mono text-[11px] text-[#788599] max-h-48 overflow-y-auto space-y-1"
          >
            {logs.length === 0 ? (
              <p>Waiting for encoder output...</p>
            ) : (
              logs.slice(-25).map((log, idx) => (
                <div key={idx} className="truncate">
                  {log}
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
