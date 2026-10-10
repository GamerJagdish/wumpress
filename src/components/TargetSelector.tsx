'use client';

import { motion } from 'motion/react';
import { Sliders } from 'lucide-react';

interface TargetSelectorProps {
  targetMB: number;
  onTargetChange: (mb: number) => void;
  disabled?: boolean;
}

const PRESETS = [
  { value: 10, label: '10 MB', note: 'FREE TIER' },
  { value: 20, label: '20 MB', note: 'TARGET' },
  { value: 25, label: '25 MB', note: 'NITRO BASIC' },
  { value: 50, label: '50 MB', note: 'NITRO BOOST' },
];

export default function TargetSelector({
  targetMB,
  onTargetChange,
  disabled = false,
}: TargetSelectorProps) {
  return (
    <div className="w-full bg-[#0d1015] border border-[#1e2330] rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <label className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#9ba6b9] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e2fd52]" />
            DISCORD TARGET LIMIT
          </label>
          <p className="text-xs text-[#636f84] font-mono mt-0.5">
            Output file will be strictly budgeted under this threshold.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141822] border border-[#232938] text-right self-start sm:self-auto">
          <span className="text-xs font-mono text-[#8a96ab]">SELECTED:</span>
          <span className="text-sm font-extrabold text-[#e2fd52] font-mono">
            {targetMB.toFixed(1)} MB
          </span>
        </div>
      </div>

      {/* Chunky Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {PRESETS.map((preset) => {
          const isSelected = targetMB === preset.value;
          return (
            <motion.button
              key={preset.value}
              type="button"
              disabled={disabled}
              onClick={() => onTargetChange(preset.value)}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`relative flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border text-center transition-all select-none ${
                isSelected
                  ? 'border-[#e2fd52] bg-[#1a2012] text-white shadow-[0_3px_0_#9bb814]'
                  : 'border-[#222836] bg-[#12151d] text-[#939fab] hover:border-[#323b4e] hover:bg-[#161a24]'
              }`}
            >
              <span
                className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                  isSelected ? 'text-[#e2fd52]' : 'text-white'
                }`}
              >
                {preset.label}
              </span>
              <span
                className={`text-[10px] font-mono tracking-wider uppercase font-bold mt-0.5 ${
                  isSelected ? 'text-[#c8df42]' : 'text-[#647083]'
                }`}
              >
                {preset.note}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom target slider / input drawer */}
      <div className="pt-3 border-t border-[#1a1f2b] flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#8995a9] w-full sm:w-auto">
          <Sliders className="w-3.5 h-3.5 text-[#e2fd52]" />
          <span>CUSTOM MB:</span>
        </div>

        <div className="flex items-center gap-3 w-full">
          <input
            type="range"
            min="2"
            max="100"
            step="1"
            value={targetMB}
            disabled={disabled}
            onChange={(e) => onTargetChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-[#1b202c] rounded-lg appearance-none cursor-pointer accent-[#e2fd52]"
          />
          <div className="flex items-center gap-1 min-w-[76px]">
            <input
              type="number"
              min="1"
              max="500"
              value={targetMB}
              disabled={disabled}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  onTargetChange(val);
                }
              }}
              className="w-14 px-2 py-1 text-center bg-[#141722] border border-[#252c3c] rounded-md font-mono text-xs font-bold text-white focus:outline-none focus:border-[#e2fd52]"
            />
            <span className="text-xs font-mono text-[#6c788d]">MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
