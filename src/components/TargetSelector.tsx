'use client';

import { motion } from 'motion/react';
import { Sliders } from 'lucide-react';

interface TargetSelectorProps {
  targetMB: number;
  onTargetChange: (mb: number) => void;
  disabled?: boolean;
}

const PRESETS = [10, 20, 25, 50];

export default function TargetSelector({
  targetMB,
  onTargetChange,
  disabled = false,
}: TargetSelectorProps) {
  return (
    <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm uppercase tracking-wider text-[#949ba4] font-bold font-['Outfit']">
          Target Size
        </span>
        <span className="text-xs sm:text-sm font-bold text-white px-2 py-0.5 rounded bg-[#313338] border border-[#3f4147]">
          {targetMB} MB
        </span>
      </div>

      {/* Chunky Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {PRESETS.map((mb) => {
          const isSelected = targetMB === mb;
          return (
            <motion.button
              key={mb}
              type="button"
              disabled={disabled}
              onClick={() => onTargetChange(mb)}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`py-3 px-3 rounded-xl border text-center transition-all select-none font-['Outfit'] ${
                isSelected
                  ? 'border-[#5865f2] bg-[#5865f2] text-white font-black'
                  : 'border-[#383a40] bg-[#313338] text-[#dbdee1] hover:border-[#4e5058] hover:bg-[#383a40]'
              }`}
            >
              <span className="text-lg sm:text-xl font-bold">
                {mb} MB
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Custom target slider / input */}
      <div className="pt-3 border-t border-[#383a40] flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#949ba4] font-medium shrink-0">
          <Sliders className="w-3.5 h-3.5 text-[#5865f2]" />
          <span>Custom</span>
        </div>

        <input
          type="range"
          min="2"
          max="100"
          step="1"
          value={targetMB}
          disabled={disabled}
          onChange={(e) => onTargetChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-[#1e1f22] rounded-lg appearance-none cursor-pointer accent-[#5865f2]"
        />

        <div className="flex items-center gap-1 shrink-0">
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
            className="w-14 px-2 py-1 text-center bg-[#1e1f22] border border-[#3f4147] rounded-md text-xs font-bold text-white focus:outline-none focus:border-[#5865f2]"
          />
          <span className="text-xs text-[#949ba4] font-medium">MB</span>
        </div>
      </div>
    </div>
  );
}
