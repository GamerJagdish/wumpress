'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Volume1, VolumeX, ChevronDown, SlidersHorizontal, Monitor } from 'lucide-react';
import { CompressionConfig, MediaType } from '../lib/types';

interface AdvancedSettingsProps {
  config: CompressionConfig;
  onChange: (updated: Partial<CompressionConfig>) => void;
  mediaType: MediaType;
  disabled?: boolean;
}

export default function AdvancedSettings({
  config,
  onChange,
  mediaType,
  disabled = false,
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (mediaType === 'image') {
    return (
      <div className="w-full bg-[#0d1015] border border-[#1e2330] rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-mono uppercase tracking-wider text-[#9ba6b9] font-bold">
            IMAGE OUTPUT FORMAT
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['auto', 'webp', 'jpeg'] as const).map((fmt) => {
            const isSelected = config.imageFormat === fmt;
            return (
              <button
                key={fmt}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ imageFormat: fmt })}
                className={`py-2 px-3 rounded-xl border text-xs font-mono uppercase font-bold transition-all ${
                  isSelected
                    ? 'border-[#e2fd52] bg-[#1a2012] text-[#e2fd52]'
                    : 'border-[#222836] bg-[#12151d] text-[#8692a3] hover:border-[#30384a]'
                }`}
              >
                {fmt === 'auto' ? 'AUTO (WEBP)' : fmt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0d1015] border border-[#1e2330] rounded-2xl overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#11141c] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-4 h-4 text-[#e2fd52]" />
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[#f0f3f8] font-bold">
            FINE TUNING: AUDIO & RESOLUTION
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <ChevronDown className="w-4 h-4 text-[#8a96a8]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="border-t border-[#1a1f2b] p-4 sm:p-5 space-y-5"
          >
            {/* Audio Profile */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#8a96a8] font-bold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#38bdf8]" />
                  AUDIO PROFILE
                </span>
                <span className="text-[11px] font-mono text-[#626e81]">
                  Lower audio kbps gives more bandwidth to video frames
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ audioMode: 'standard' })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    config.audioMode === 'standard'
                      ? 'border-[#e2fd52] bg-[#1a2012] text-[#e2fd52]'
                      : 'border-[#222836] bg-[#12151d] text-[#8692a3] hover:border-[#30384a]'
                  }`}
                >
                  <Volume2 className="w-4 h-4 mb-1" />
                  <span>STANDARD</span>
                  <span className="text-[10px] text-[#657388] font-normal">128 kbps</span>
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ audioMode: 'voice' })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    config.audioMode === 'voice'
                      ? 'border-[#e2fd52] bg-[#1a2012] text-[#e2fd52]'
                      : 'border-[#222836] bg-[#12151d] text-[#8692a3] hover:border-[#30384a]'
                  }`}
                >
                  <Volume1 className="w-4 h-4 mb-1" />
                  <span>VOICE ONLY</span>
                  <span className="text-[10px] text-[#657388] font-normal">64 kbps</span>
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ audioMode: 'mute' })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                    config.audioMode === 'mute'
                      ? 'border-[#e2fd52] bg-[#1a2012] text-[#e2fd52]'
                      : 'border-[#222836] bg-[#12151d] text-[#8692a3] hover:border-[#30384a]'
                  }`}
                >
                  <VolumeX className="w-4 h-4 mb-1" />
                  <span>MUTE</span>
                  <span className="text-[10px] text-[#657388] font-normal">0 kbps</span>
                </button>
              </div>
            </div>

            {/* Resolution Scaling */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#8a96a8] font-bold flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-[#a855f7]" />
                  RESOLUTION SCALING
                </span>
                <span className="text-[11px] font-mono text-[#626e81]">
                  Auto downscales if bitrate would become pixelated
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['auto', 'native', '720p', '480p'] as const).map((mode) => {
                  const isSelected = config.scaleMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange({ scaleMode: mode })}
                      className={`py-2 px-2 text-center rounded-xl border text-xs font-mono uppercase font-bold transition-all ${
                        isSelected
                          ? 'border-[#e2fd52] bg-[#1a2012] text-[#e2fd52]'
                          : 'border-[#222836] bg-[#12151d] text-[#8692a3] hover:border-[#30384a]'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GIF Loop to MP4 */}
            {mediaType === 'gif' && (
              <div className="pt-2 border-t border-[#1a1f2b] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-white font-bold block">
                    CONVERT GIF TO DISCORD MP4
                  </span>
                  <span className="text-[11px] font-mono text-[#626e81]">
                    Yields up to 90% higher compression and loops natively in Discord.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ convertToMp4IfGif: !config.convertToMp4IfGif })}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors ${
                    config.convertToMp4IfGif
                      ? 'bg-[#e2fd52] text-black border-[#e2fd52]'
                      : 'bg-[#151922] text-[#8692a3] border-[#222836]'
                  }`}
                >
                  {config.convertToMp4IfGif ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
