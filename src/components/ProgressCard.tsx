'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import Icon from './Icon';
import { CompressionProgress } from '../lib/types';
import { formatDuration } from '../lib/calculator';

interface ProgressCardProps {
  progress: CompressionProgress;
  logs: string[];
}

export default function ProgressCard({ progress, logs }: ProgressCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const stats = progress.stats;
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);

  // Auto-scroll to bottom only if the user hasn't scrolled up to read earlier logs
  useEffect(() => {
    if (showLogs && logsContainerRef.current && !isUserScrolledUpRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs.length, showLogs]);

  const handleLogsScroll = () => {
    const el = logsContainerRef.current;
    if (!el) return;
    // Calculate distance from bottom
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user is within 25px of the bottom, resume auto-scrolling
    isUserScrolledUpRef.current = distanceFromBottom > 25;
  };

  const handleToggleLogs = () => {
    const nextState = !showLogs;
    if (nextState) {
      isUserScrolledUpRef.current = false;
    }
    setShowLogs(nextState);
  };

  return (
    <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#313338] border border-[#3f4147] flex items-center justify-center text-[#5865f2]">
            <Icon name="progress_activity" size={20} className="animate-spin" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">
              Wumpressing
            </h3>
            <p className="text-xs text-[#949ba4] mt-0.5">
              {progress.currentStage || 'Working...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1f22] border border-[#383a40] text-[#949ba4]">
            <Icon name="schedule" size={14} className="text-[#5865f2]" />
            <span>{formatDuration(progress.timeElapsed)}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#5865f2]">
            {progress.progress}%
          </div>
        </div>
      </div>

      {/* Solid Discord blurple progress bar */}
      <div className="w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden border border-[#383a40] mb-4">
        <div
          className="h-full bg-[#5865f2] rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, progress.progress)}%` }}
        />
      </div>

      {/* Simplified live frame / fps stats for users who don't expand the log */}
      {stats && (stats.frame || stats.time) && (
        <div className="p-3 rounded-xl bg-[#1e1f22] border border-[#383a40] flex flex-wrap items-center justify-between gap-2 text-xs text-[#dbdee1] mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[#949ba4]">Frame:</span>
            <span className="font-bold text-white">{stats.frame ?? 'n/a'}</span>
          </div>
          {stats.fps && (
            <div className="flex items-center gap-2">
              <span className="text-[#949ba4]">Speed:</span>
              <span className="font-bold text-white">{stats.fps} fps</span>
            </div>
          )}
          {stats.speed && (
            <div className="flex items-center gap-2">
              <span className="text-[#949ba4]">Rate:</span>
              <span className="font-bold text-[#5865f2]">{stats.speed}</span>
            </div>
          )}
          {stats.time && (
            <div className="flex items-center gap-2">
              <span className="text-[#949ba4]">Encoded:</span>
              <span className="font-bold text-white">{stats.time}</span>
            </div>
          )}
        </div>
      )}

      {/* Terminal log toggle */}
      <div>
        <button
          type="button"
          onClick={handleToggleLogs}
          className="flex items-center gap-2 text-xs text-[#949ba4] hover:text-white transition-colors"
        >
          <Icon name="terminal" size={15} className="text-[#5865f2]" />
          <span>Raw Logs ({logs.length})</span>
          <Icon
            name="expand_more"
            size={16}
            className={`transition-transform duration-200 ${showLogs ? 'rotate-180' : ''}`}
          />
        </button>

        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            ref={logsContainerRef}
            onScroll={handleLogsScroll}
            className="mt-3 p-3 rounded-xl bg-[#1e1f22] border border-[#383a40] font-mono text-[11px] max-h-60 overflow-y-auto space-y-1"
          >
            {logs.length === 0 ? (
              <p className="text-[#949ba4]">Waiting for output...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap break-all leading-relaxed text-[#f2f3f5]">
                  {log}
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
