'use client';

import { motion } from 'motion/react';

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
  const sliderValue = Math.min(Math.max(targetMB, 2), 100);
  const sliderProgress = Math.min(100, Math.max(0, ((sliderValue - 2) / (100 - 2)) * 100));

  return (
    <div className="w-full bg-[#2b2d31] border border-[#383a40] rounded-2xl p-4 sm:p-5">
      <label className="text-xs uppercase tracking-wider text-[#949ba4] font-bold font-['Outfit'] block mb-2.5">
        Target Size
      </label>

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
              whileTap={disabled ? {} : { scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`py-3 px-3 rounded-xl border text-center transition-colors duration-150 select-none font-['Outfit'] ${
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
      <div className="pt-3.5 border-t border-[#383a40] flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-[#949ba4] font-bold font-['Outfit'] shrink-0 select-none">
          Custom
        </span>

        <input
          type="range"
          min="2"
          max="100"
          step="1"
          value={sliderValue}
          disabled={disabled}
          onChange={(e) => onTargetChange(parseFloat(e.target.value))}
          style={{
            background: `linear-gradient(to right, #5865f2 ${sliderProgress}%, #1e1f22 ${sliderProgress}%)`,
          }}
          className="wumpress-slider w-full h-2 rounded-full cursor-pointer appearance-none border border-[#383a40] transition-all"
        />

        <div className="flex items-center gap-1.5 shrink-0 bg-[#1e1f22] border border-[#383a40] hover:border-[#4e5058] focus-within:border-[#5865f2] rounded-xl px-2.5 py-1.5 transition-colors">
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
            className="w-10 bg-transparent text-center text-xs font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-['Outfit']"
          />
          <span className="text-xs text-[#949ba4] font-bold select-none font-['Outfit']">MB</span>
        </div>
      </div>
    </div>
  );
}
